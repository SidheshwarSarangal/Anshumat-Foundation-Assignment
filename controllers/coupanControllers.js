// src/controllers/couponController.js
import db from "../src/db.js";

// Helper to convert arrays to JSON strings
const arrayToJson = (arr) => (arr ? JSON.stringify(arr) : null);

export const createCoupon = (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      maxDiscountAmount,
      startDate,
      endDate,
      usageLimitPerUser,
      eligibility = {},
      cartEligibility = {},
    } = req.body;

    // 1. Validate required fields
    if (!code || !discountType || !discountValue || !startDate || !endDate) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    if (!["FLAT", "PERCENT"].includes(discountType)) {
      return res.status(400).json({ error: "Invalid discountType." });
    }

    // 2. Check for duplicate coupon code
    const existingCoupon = db
      .prepare("SELECT * FROM coupons WHERE code = ?")
      .get(code);

    if (existingCoupon) {
      return res
        .status(400)
        .json({ error: "Coupon code already exists. Use a unique code." });
    }

    // 3. Insert into coupons table (all columns)
    const result = db
      .prepare(
        `INSERT INTO coupons 
      (code, description, discountType, discountValue, maxDiscountAmount, startDate, endDate, usageLimitPerUser, eligibility)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        code,
        description || null,
        discountType,
        discountValue,
        maxDiscountAmount || null,
        startDate,
        endDate,
        usageLimitPerUser || null,
        JSON.stringify(eligibility) // storing full eligibility JSON for reference
      );

    const couponId = result.lastInsertRowid;

    // 4. Insert into coupon_user_attributes (all columns)
    db.prepare(
      `INSERT INTO coupon_user_attributes
      (coupon_id, allowedUserTiers, minLifetimeSpend, minOrdersPlaced, firstOrderOnly, allowedCountries)
      VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      couponId,
      arrayToJson(eligibility.allowedUserTiers),
      eligibility.minLifetimeSpend || null,
      eligibility.minOrdersPlaced || null,
      eligibility.firstOrderOnly ? 1 : 0,
      arrayToJson(eligibility.allowedCountries)
    );

    // 5. Insert into coupon_cart_attributes (all columns)
    db.prepare(
      `INSERT INTO coupon_cart_attributes
      (coupon_id, minCartValue, applicableCategories, excludedCategories, minItemsCount)
      VALUES (?, ?, ?, ?, ?)`
    ).run(
      couponId,
      cartEligibility.minCartValue || null,
      arrayToJson(cartEligibility.applicableCategories),
      arrayToJson(cartEligibility.excludedCategories),
      cartEligibility.minItemsCount || null
    );

    // 6. Return success response
    res.status(201).json({
      message: "Coupon created successfully",
      couponId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};



// New controller: Get all coupons
export const getAllCoupons = (req, res) => {
  try {
    // Fetch all coupons
    const coupons = db.prepare("SELECT * FROM coupons").all();

    // Optionally, fetch eligibility details per coupon
    const couponsWithDetails = coupons.map((coupon) => {
      const userAttrs = db
        .prepare("SELECT * FROM coupon_user_attributes WHERE coupon_id = ?")
        .get(coupon.id);

      const cartAttrs = db
        .prepare("SELECT * FROM coupon_cart_attributes WHERE coupon_id = ?")
        .get(coupon.id);

      return {
        ...coupon,
        userEligibility: userAttrs || {},
        cartEligibility: cartAttrs || {},
      };
    });

    res.status(200).json(couponsWithDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};



// Compute cartValue from items
const computeCartValue = (items) =>
  items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

export const getBestCoupon = (req, res) => {
  try {
    const { user, cart } = req.body;

    if (!user || !cart || !Array.isArray(cart.items)) {
      return res
        .status(400)
        .json({ error: "Invalid payload. Provide user and cart data." });
    }

    const cartValue = computeCartValue(cart.items);

    const now = new Date();
    const coupons = db.prepare("SELECT * FROM coupons").all();

    let eligibleCoupons = [];

    for (const coupon of coupons) {
      const userAttr = db
        .prepare("SELECT * FROM coupon_user_attributes WHERE coupon_id = ?")
        .get(coupon.id);

      const cartAttr = db
        .prepare("SELECT * FROM coupon_cart_attributes WHERE coupon_id = ?")
        .get(coupon.id);

      // ---- 1. Check coupon date validity ----
      if (now < new Date(coupon.startDate) || now > new Date(coupon.endDate)) {
        continue;
      }

      // ---- 2. Check user attribute eligibility ----
      if (userAttr) {
        if (
          userAttr.allowedUserTiers &&
          !JSON.parse(userAttr.allowedUserTiers).includes(user.userTier)
        )
          continue;

        if (
          userAttr.allowedCountries &&
          !JSON.parse(userAttr.allowedCountries).includes(user.country)
        )
          continue;

        if (
          userAttr.minLifetimeSpend &&
          user.lifetimeSpend < userAttr.minLifetimeSpend
        )
          continue;

        if (
          userAttr.minOrdersPlaced &&
          user.ordersPlaced < userAttr.minOrdersPlaced
        )
          continue;

        if (userAttr.firstOrderOnly && user.ordersPlaced > 0) continue;
      }

      // ---- 3. Check cart attribute eligibility ----
      if (cartAttr) {
        if (cartAttr.minCartValue && cartValue < cartAttr.minCartValue)
          continue;

        if (cartAttr.applicableCategories) {
          const allowed = JSON.parse(cartAttr.applicableCategories);
          const cartCategories = cart.items.map((i) => i.category);
          if (!cartCategories.some((cat) => allowed.includes(cat))) continue;
        }

        if (cartAttr.excludedCategories) {
          const excluded = JSON.parse(cartAttr.excludedCategories);
          const cartCategories = cart.items.map((i) => i.category);
          if (cartCategories.some((cat) => excluded.includes(cat))) continue;
        }

        if (cartAttr.minItemsCount) {
          const totalQty = cart.items.reduce(
            (sum, item) => sum + item.quantity,
            0
          );
          if (totalQty < cartAttr.minItemsCount) continue;
        }
      }

      // ---- 4. Compute discount ----
      let discount = 0;
      if (coupon.discountType === "FLAT") {
        discount = coupon.discountValue;
      } else if (coupon.discountType === "PERCENT") {
        discount = (coupon.discountValue / 100) * cartValue;
        if (coupon.maxDiscountAmount) {
          discount = Math.min(discount, coupon.maxDiscountAmount);
        }
      }

      eligibleCoupons.push({
        ...coupon,
        discountAmount: discount,
      });
    }

    // ---- 5. Choose best coupon ----
    if (eligibleCoupons.length === 0)
      return res.json({ bestCoupon: null, discount: 0 });

    // Sort by:
    // 1. Highest discount
    // 2. Earliest end date
    // 3. Lexicographical code
    eligibleCoupons.sort((a, b) => {
      if (b.discountAmount !== a.discountAmount)
        return b.discountAmount - a.discountAmount;
      if (new Date(a.endDate) - new Date(b.endDate) !== 0)
        return new Date(a.endDate) - new Date(b.endDate);
      return a.code.localeCompare(b.code);
    });

    const best = eligibleCoupons[0];

    res.json({
      bestCoupon: {
        id: best.id,
        code: best.code,
        discount: best.discountAmount,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};