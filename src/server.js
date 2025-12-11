import express from "express";
import db from "./db.js";
import dotenv from "dotenv";
import couponRoutes from "../routes/couponRoutes.js";

//environment variables
dotenv.config({ quiet: true }); 

//setting up server
const app = express();
app.use(express.json());

// Testing the database connection
try {
  const row = db.prepare(`SELECT 'SQLite is connected!' AS message`).get();
  console.log("DB TEST RESULT:", row.message);
} catch (err) {
  console.error("DB ERROR:", err.message);
}

//running the routes
app.use("/api", couponRoutes);

//running the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);
