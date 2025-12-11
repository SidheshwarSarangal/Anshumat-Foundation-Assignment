# Coupon Management

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

Here, the deployment is done with Raillway, where it is just using a database.db file, along with the code, for implementing the database. With, every new deployment, this file gets wiped and a new file is created.

---

## 📦 Database Schema (SQLite)

This project uses **SQLite** (via `better-sqlite3`) as a lightweight, file-based database.  
All tables are automatically created inside:./database.db


Below is a full description of every table.

---

## 🧱 1. `coupons` Table  
Stores the main coupon details.

| Column              | Type     | Description |
|--------------------|----------|-------------|
| id                 | INTEGER (PK) | Auto-increment coupon ID |
| code               | TEXT UNIQUE | Unique coupon code (e.g., `WELCOME100`) |
| description        | TEXT     | Human-readable coupon description |
| discountType       | TEXT     | Either `FLAT` or `PERCENT` |
| discountValue      | REAL     | Flat amount or percent value |
| maxDiscountAmount  | REAL     | Optional cap for % discounts |
| startDate          | TEXT     | Coupon valid-from date |
| endDate            | TEXT     | Coupon valid-until date |
| usageLimitPerUser  | INTEGER  | Max times each user can use the coupon |
| eligibility        | TEXT     | JSON backup of full eligibility conditions |
| created_at         | TEXT     | Timestamp of when coupon was created |

---

## 👤 2. `coupon_user_attributes` Table  
Stores **user-based eligibility rules**.

| Column            | Type     | Description |
|------------------|----------|-------------|
| id               | INTEGER (PK) | Row ID |
| coupon_id        | INTEGER (FK) | References `coupons.id` |
| allowedUserTiers | TEXT     | JSON array of allowed tiers |
| minLifetimeSpend | REAL     | Minimum historical spend |
| minOrdersPlaced  | INTEGER  | Minimum number of past orders |
| firstOrderOnly   | INTEGER  | 1 = true, 0 = false |
| allowedCountries | TEXT     | JSON array of allowed countries |

---

## 🛒 3. `coupon_cart_attributes` Table  
Stores **cart-based eligibility rules**.

| Column               | Type     | Description |
|---------------------|----------|-------------|
| id                  | INTEGER (PK) | Row ID |
| coupon_id           | INTEGER (FK) | References `coupons.id` |
| minCartValue        | REAL     | Minimum cart value before discount |
| applicableCategories| TEXT     | JSON array of allowed categories |
| excludedCategories  | TEXT     | JSON array of banned categories |
| minItemsCount       | INTEGER  | Minimum number of total cart items |

---

## 🔄 4. `user_coupon_usage` Table  
Tracks **how many times each user has used each coupon**.

| Column     | Type     | Description |
|------------|----------|-------------|
| id         | INTEGER (PK) | Row ID |
| coupon_id  | INTEGER (FK) | References `coupons.id` |
| user_id    | TEXT     | ID of the user |
| timesUsed  | INTEGER  | How many times this user used this coupon |
| UNIQUE(coupon_id, user_id) | Constraint | Ensures one row per (coupon, user) pair |


---

## 🚀 How to Run Locally

Demo Vido Link:
**https://drive.google.com/file/d/1sCfaXzlHHWeB5Jyt0SMKfAYaAyWRQY6N/view?usp=sharing**

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
  "code": "REGULAR5555",
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

The json body stays the same here for these two.

If you want to check the get all coupons api then it is here like this

**Endpoint:**  
`GET http://anshumat-foundation-assignment-production.up.railway.app/api/coupons`

If you want to increment the number of times of the given user with the given coupon, then use the following endpoint

**Endpoint:**
`POST https://anshumat-foundation-assignment-production.up.railway.app/api/increment-usage`

With the following json body:

```json
{
  "userId": 1,
  "couponId": 1
}
```
Remember, here the couponId should be of a coupon which is present in the database.

**sample output***
```json
{
  "message": "Coupon usage incremented successfully"
}
```

---

## AI Usage
AI was used for:

- Understanding deployment errors on Railway (especially SQLite native module build issues)
- Fixing Node version mismatch, module rebuild, and debugging during deployment
- Understanding that Railway will embed the local `.db` file along with the code
- Understanding implemention and usage of SQLite with Express
- Checking and imrpoving DB schema according to problem statement complexity 
- Refining the presentation of the final readme document

### 📌 Prompts Used

1. **Railway Deployment & SQLite Issues**
   - “Railway keeps throwing this error: `better_sqlite3.node was compiled against NODE_MODULE_VERSION 115 but the current Node version requires 127`.  
     I already deleted node_modules and reinstalled but it still fails during deployment.  
     What EXACT steps should I follow so that better-sqlite3 builds correctly on Railway?”

   - “Railway logs show ‘Application failed to respond’. My server works perfectly on localhost.  
     Is this because SQLite isn't loading? How do I debug this in a Railway container environment?”

2. **Fixing SQLite Build**
   - “Give me the correct Dockerfile or environment variables so that Railway installs better-sqlite3 correctly without node-gyp errors.”

   - “Why does better-sqlite3 fail when Node.js version changes? Explain NODE_MODULE_VERSION mismatch and how to rebuild native modules properly.”

3. **Database Schema & Logic**
   - “Here is my coupon schema. Am I structuring eligibility rules correctly?  
     Should I store user- and cart-eligibility in separate tables or JSON columns?”

4. **Best Coupon Selection Logic**
   - “Here is my bestCoupons controller. Why is it returning the wrong coupon? Show me the step-by-step filtering logic.”

5. **Debugging**
   - “When I run on Railway I get: `Server running at http://localhost:8080` but the public URL still gives 502.  
     What does this mean? Do I need to bind to 0.0.0.0 or use process.env.PORT?”

6. **Writing the README**
   - “Rewrite my entire README to be clean, professional, formatted properly, and aligned with the assignment requirements.  

   - “Generate a full technical explanation for each database table in Markdown with proper formatting.”

---

