// src/routes/couponRoutes.js
import express from "express";
import { createCoupon, getAllCoupons, getBestCoupon } from "../controllers/coupanControllers";

const router = express.Router();

router.post("/createCoupon", createCoupon);

router.get("/getAllCoupons", getAllCoupons);

router.post("/bestCoupans", getBestCoupon);


export default router;
