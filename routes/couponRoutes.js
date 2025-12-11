import express from "express";
import { createCoupon, getAllCoupons, getBestCoupon, incrementCouponUsage } from "../controllers/couponControllers.js";

const router = express.Router();

router.post("/createCoupon", createCoupon); //creating the coupon

router.get("/coupons", getAllCoupons); //getting all the coupons

router.post("/bestCoupons", getBestCoupon); //getting the best coupons according to the user and the cart items

router.post("/increment-usage", incrementCouponUsage); //incrementing the usageTime of a user, for that coupon which is used 


export default router;
