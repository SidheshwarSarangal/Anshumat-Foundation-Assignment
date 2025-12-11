# 🧾 Anshumat Foundation – Coupon Management System
A complete backend system for creating, managing, and applying discount coupons based on user and cart eligibility rules. Built using Node.js, Express, SQLite and deployed on Railway.

## 🚀 Project Overview
This project implements a Coupon Management System with:
- Creating coupons with detailed rules
- User-based eligibility (tiers, lifetime spend, orders, country, etc.)
- Cart-based eligibility (cart value, category rules, item count, etc.)
- Selecting the best coupon for any user & cart
- Tracking how many times a user used a coupon
A SQLite file `database.db` stores all data.

## 📡 APIs Implemented
1. POST /api/createCoupon – Create a coupon  
2. POST /api/bestCoupons – Get best coupon  
3. GET /api/coupons – Get all coupons  
4. POST /api/increment-usage – Increase coupon usage  

## 🛠 Tech Stack
Node.js, Express.js, SQLite (better-sqlite3), Railway Deployment

## 🏃 How to Run Locally
1️⃣ Clone the Repository  
git clone https://github.com/SidheshwarSarangal/Anshumat-Foundation-Assignment.git  
2️⃣ Move into Project  
cd Anshumat-Foundation-Assignment  
3️⃣ Install Dependencies  
npm install  
4️⃣ Start the Server  
npm run dev  

Your server will run at:  
http://localhost:3000  

## 🌐 Deployed App
Backend URL:  
https://anshumat-foundation-assignment-production.up.railway.app  

## 📌 API Testing

### 1. Create Coupon
POST /api/createCoupon  
Example Body:
{
  "code": "REGULAR20",
  "description": "50 off for regular users on electronics and fashion",
  "discountType": "FLAT",
  "discountValue": 50,
  "maxDiscountAmount": null,
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "usageLimitPerUser": 5,
  "eligibility": {
    "allowedUserTiers": ["REGULAR", "GOLD"],
    "minLifetimeSpend": 2000,
    "minOrdersPlaced": 2,
    "firstOrderOnly": false,
    "allowedCountries": ["IN"]
  },
  "cartEligibility": {
    "minCartValue": 500,
    "applicableCategories": ["electronics", "fashion"],
    "excludedCategories": [],
    "minItemsCount": 1
  }
}

Response:
{
  "message": "Coupon created successfully",
  "couponId": 1
}

### 2. Best Coupon
POST /api/bestCoupons  
Example Body:
{
  "user": {
    "userTier": "REGULAR",
    "country": "IN",
    "lifetimeSpend": 2500,
    "ordersPlaced": 3
  },
  "cart": {
    "items": [
      {
        "id": 1,
        "name": "Smartphone",
        "unitPrice": 15000,
        "quantity": 1,
        "category": "electronics"
      },
      {
        "id": 2,
        "name": "T-Shirt",
        "unitPrice": 800,
        "quantity": 2,
        "category": "fashion"
      }
    ]
  }
}

Response:
{
  "bestCoupon": {
    "id": 1,
    "code": "REGULAR20",
    "discount": 50
  }
}

### 3. Get All Coupons
GET /api/coupons

### 4. Increment Usage
POST /api/increment-usage  
Body:
{
  "userId": "USER123",
  "couponId": 1
}

## 🤖 AI Usage
AI helped with:
- Fixing SQLite deployment issues on Railway  
- Debugging better-sqlite3 Node version mismatch  
- Designing SQL schema & relationships  
- Implementing SQL logic in Express (coming from MongoDB background)  
- Understanding how to keep a persistent database.db on Railway  

## ✅ Final Notes
This backend supports coupon creation, eligibility rules, selection logic, and tracking usage. SQLite ensures easy deployment and persistence. The system works identically in local and production.
