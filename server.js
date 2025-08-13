require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./middleware/logger");

// Import route modules
const userRoutes = require("./routes/user");
const productRoutes = require("./routes/products");
const authRoutes = require("./routes/auth"); // ✅ NEW

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(logger);

// MongoDB connection
mongoose
  .connect(process.env.DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// API routes
app.use("/api/user", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes); // ✅ NEW

// Root route - health check
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
