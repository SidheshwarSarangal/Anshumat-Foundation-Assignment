import express from "express";
import db from "./db.js";
import dotenv from "dotenv";
import couponRoutes from "../routes/coupanRoutes.js";

dotenv.config();

const app = express();
app.use(express.json());

// TEST DATABASE CONNECTION AUTOMATICALLY ON SERVER START
try {
  const row = db.prepare(`SELECT 'SQLite is connected!' AS message`).get();
  console.log("DB TEST RESULT:", row);
} catch (err) {
  console.error("DB ERROR:", err.message);
}

app.use("/api", couponRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);
