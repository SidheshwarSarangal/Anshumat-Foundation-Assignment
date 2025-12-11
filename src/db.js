import Database from "better-sqlite3";
import dotenv from "dotenv";

//environment variables 
dotenv.config({ quiet: true }); 

const db = new Database(process.env.DB_FILE);

//creating the tables if are not already present
//coupons table
//user eligibility attributes table for a coupon
//cart eligibility attibutes table for a coupon
//user coupon usage table to keep record of how many times a user has used a particular coupon
db.exec(`
CREATE TABLE IF NOT EXISTS coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    discountType TEXT NOT NULL CHECK(discountType IN ('FLAT', 'PERCENT')),
    discountValue REAL NOT NULL,
    maxDiscountAmount REAL,
    startDate TEXT NOT NULL,
    endDate TEXT NOT NULL,
    usageLimitPerUser INTEGER,
    eligibility TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coupon_user_attributes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    coupon_id INTEGER NOT NULL,
    allowedUserTiers TEXT,
    minLifetimeSpend REAL,
    minOrdersPlaced INTEGER,
    firstOrderOnly INTEGER,
    allowedCountries TEXT,
    FOREIGN KEY(coupon_id) REFERENCES coupons(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS coupon_cart_attributes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    coupon_id INTEGER NOT NULL,
    minCartValue REAL,
    applicableCategories TEXT,
    excludedCategories TEXT,
    minItemsCount INTEGER,
    FOREIGN KEY(coupon_id) REFERENCES coupons(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_coupon_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    coupon_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    timesUsed INTEGER DEFAULT 0,
    FOREIGN KEY(coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
    UNIQUE(coupon_id, user_id)
);
`);

export default db;
