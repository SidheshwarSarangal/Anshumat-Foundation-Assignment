# Anshumat-Foundation-Assignment

## 📌 Project Overview
This project implements a full Coupon Management System.  
Users can create multiple coupons with detailed attributes such as:

- **discountType**
- **discountValue**
- **maxDiscountAmount**
- **startDate**, **endDate**
- **usageLimitPerUser**
- **eligibility** (user-based conditions)
  - allowedUserTiers
  - minLifetimeSpend
  - minOrdersPlaced
  - firstOrderOnly
  - allowedCountries
- **cartEligibility** (cart-based conditions)
  - minCartValue
  - applicableCategories
  - excludedCategories
  - minItemsCount

Also, users can **search for the best coupon** by providing:

- user details
- cart details

We also track **coupon usage per user**, ensuring a single user cannot exceed allowed usage limits.

There is one more api for to get all coupons(just for testin purpose).

### Main APIs

#### ✅ Create Coupon API  
Creates a coupon with fields:  
`code, description, discountType, discountValue, maxDiscountAmount, startDate, endDate, usageLimitPerUser, eligibility{}, cartEligibility{}`

#### ✅ Best Coupon API  
Takes **user** + **cart** input and returns the best applicable coupon.

### Extra Utility APIs
- Get all coupons (testing only)
- Increment user usage for a coupon

---

## 🛠 Tech Stack
- Node.js  
- Express.js  
- SQLite (SQL queries)  
- Railway for deployment  
- JavaScript  

---

## 🚀 How to Run Locally

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/SidheshwarSarangal/Anshumat-Foundation-Assignment.git
```

### 2️⃣ Move into Project
```bash
cd Anshumat-Foundation-Assignment
```

### 3️⃣ Install Dependencies
```bash
npm install
```

### 4️⃣ Start the Server
```bash
npm run dev
```

Your server will run at:  
**http://localhost:3000**

---

## 🌐 Deployed App

Backend URL:  
**https://anshumat-foundation-assignment-production.up.railway.app/**

---

## 🔥 API Usage & Test Cases

- You can run these in Postman or in ThunderClient.

### 🧩 Create Coupon API

**Endpoint:**  
`POST http://localhost:3000/api/createCoupon`


**Sample Request Body**
```json
{
  "code": "REGULAR1000",
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
```

**Sample Output**
```json
{
  "message": "Coupon created successfully",
  "couponId": 1
}
```

---

### Best Coupon API

**Endpoint:**  
`POST http://localhost:3000/api/bestCoupons`

**Sample Input**
```json
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
```

**Sample Output**
```json
{
  "bestCoupon": {
    "id": 1,
    "code": "REGULAR20",
    "discount": 50
  }
}
```

---

### Using Deployed API Instead of Local

Just replace:

```
http://localhost:3000
```

with:

```
https://anshumat-foundation-assignment-production.up.railway.app
```

Example:

- Create coupon:  
  `https://anshumat-foundation-assignment-production.up.railway.app/api/createCoupon`

- Get best coupon:  
  `https://anshumat-foundation-assignment-production.up.railway.app/api/bestCoupons`

The json body stays the same

---

## AI Usage
AI was used for:

- Understanding deployment errors on Railway (especially SQLite native module build issues)
- Implementing SQLite with Express (first-time experience)
- Designing DB schema according to problem statement complexity
- Fixing Node version mismatch, module rebuild, and debugging
- Understanding that Railway can embed the local `.db` file along with the code

---

