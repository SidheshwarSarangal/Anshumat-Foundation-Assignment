import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to prevent crashes on JSON errors
app.use(express.json());
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Sample route
app.get("/", (req, res) => {
  res.send("Server is running safely!");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
