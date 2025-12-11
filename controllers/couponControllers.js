import db from "../src/db.js";

//function to stringify
const arrayToJson = (arr) => (arr ? JSON.stringify(arr) : null);

//create coupon controller
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

    // ensuring these fields are present
    if (!code || !discountType || !discountValue || !startDate || !endDate) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    //what type of discount
    if (!["FLAT", "PERCENT"].includes(discountType)) {
      return res.status(400).json({ error: "Invalid discountType." });
    }

    //check for duplicate coupon code
    const existingCoupon = db
      .prepare("SELECT * FROM coupons WHERE code = ?")
      .get(code);

    if (existingCoupon) {
      return res
        .status(400)
        .json({ error: "Coupon code already exists. Use a unique code." });
    }

    //insert into coupons table
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
        JSON.stringify(eligibility)
      );

    const couponId = result.lastInsertRowid;

    //insert into coupon_user_attributes
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

    //Insert into coupon_cart_attributes
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

    //return success response
    res.status(201).json({
      message: "Coupon created successfully",
      couponId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//get all coupons controller
export const getAllCoupons = (req, res) => {
  try {
    //fetch all coupons
    const coupons = db.prepare("SELECT * FROM coupons").all();

    // fetch eligibility(coupon and cart) details per coupon
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

//calculate total cart value
const computeCartValue = (items) =>
  items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

//best coupon controller for the given user with the given cart items
export const getBestCoupon = (req, res) => {
  try {
    const { user, cart } = req.body;

    //initial check if user and cart are present in the request
    if (!user || !cart || !Array.isArray(cart.items)) {
      return res
        .status(400)
        .json({ error: "Invalid payload. Provide user and cart data." });
    }

    const cartValue = computeCartValue(cart.items); //calculating the total cart value
    const now = new Date(); //date
    const coupons = db.prepare("SELECT * FROM coupons").all(); //fetching all the coupons
    let eligibleCoupons = []; //for storing the relevent coupons after filtering

    //loop over all the coupons in order to filter the appropriate ones
    for (const coupon of coupons) {
      //getting details of user and cart attributes for this particular coupon
      const userAttr = db
        .prepare("SELECT * FROM coupon_user_attributes WHERE coupon_id = ?")
        .get(coupon.id);
      const cartAttr = db
        .prepare("SELECT * FROM coupon_cart_attributes WHERE coupon_id = ?")
        .get(coupon.id);

      //check coupon date validity
      if (now < new Date(coupon.startDate) || now > new Date(coupon.endDate)) {
        continue;
      }

      //it helps in computing the usageLimitPerCoupon
      //if the timeused exceeded the usagelimit of the given coupon, then that coupon will not be considered
      //we use user_coupon_uasge table for this
      if (coupon.usageLimitPerUser) {
        const usageRow = db
          .prepare(
            "SELECT timesUsed FROM user_coupon_usage WHERE coupon_id = ? AND user_id = ?"
          )
          .get(coupon.id, user.userId);

        const timesUsed = usageRow?.timesUsed || 0;

        if (timesUsed >= coupon.usageLimitPerUser) {
          continue; // skip this coupon
        }
      }

      //check user attribute eligibility
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

      //check cart attribute eligibility
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

      //calculate discount
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

    //choosing the best coupon ----
    if (eligibleCoupons.length === 0)
      return res.json({ bestCoupon: null, discount: 0 });

    // Sort by-
    // 1. highest discount
    // 2. earliest end date
    // 3. lexicographical code
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

//user_coupon_usage table is used to keep record of how many times a user has used a particular coupon
//the following controller will be used when the user has selected the best coupon, and then incrementation will be done in this table
//if the user selects the best coupon, then there will be an increment in the value timeUsed in the table with the given couponid and userid
//this has to be done manually after getting the best coupon
export const incrementCouponUsage = (req, res) => {
  try {
    const { userId, couponId } = req.body;

    if (!userId || !couponId) {
      return res
        .status(400)
        .json({ error: "userId and couponId are required" });
    }

    db.prepare(
      `INSERT INTO user_coupon_usage (coupon_id, user_id, timesUsed) VALUES (?, ?, 1)
       ON CONFLICT(coupon_id, user_id) DO UPDATE SET timesUsed = timesUsed + 1`
    ).run(couponId, userId);

    res.json({ message: "Coupon usage incremented successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
