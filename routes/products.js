const express = require("express");
const { body, validationResult } = require("express-validator");
const Product = require("../models/products");
const auth = require("../middleware/authmiddleware");
const upload = require("../middleware/upload"); // multer config
const cloudinary = require("../config/cloudinary");

const router = express.Router();

// =============================
// Create new product (Protected)
// =============================
router.post(
  "/",
  auth,
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("price").isNumeric().withMessage("Price must be a number"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, price, description } = req.body;

    try {
      const product = new Product({ name, price, description });
      await product.save();
      res.status(201).json(product);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

// =============================
// Get all products (Public)
// =============================
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// =============================
// Get product by id (Public)
// =============================
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ msg: "Product not found" });
    res.json(product);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Product not found" });
    }
    res.status(500).send("Server error");
  }
});

// =============================
// Update product by id (Protected)
// =============================
router.put(
  "/:id",
  auth,
  [
    body("name").optional().notEmpty().withMessage("Name cannot be empty"),
    body("price").optional().isNumeric().withMessage("Price must be a number"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, price, description } = req.body;
    const updatedFields = {};
    if (name !== undefined) updatedFields.name = name;
    if (price !== undefined) updatedFields.price = price;
    if (description !== undefined) updatedFields.description = description;

    try {
      let product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ msg: "Product not found" });

      product = await Product.findByIdAndUpdate(req.params.id, { $set: updatedFields }, { new: true });

      res.json(product);
    } catch (err) {
      console.error(err.message);
      if (err.kind === "ObjectId") return res.status(404).json({ msg: "Product not found" });
      res.status(500).send("Server error");
    }
  }
);

// =============================
// Delete product (Protected)
// =============================
router.delete("/:id", auth, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ msg: "Product not found" });
    res.json({ msg: "Product removed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// =============================
// Upload product image (Protected)
// =============================
router.post("/:id/upload-image", auth, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No image file provided" });

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ msg: "Product not found" });

    // Upload to Cloudinary
    const streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder: "products" }, (error, result) => {
          if (result) resolve(result);
          else reject(error);
        });
        stream.end(req.file.buffer);
      });
    };

    const result = await streamUpload(req);

    // Save URL in DB
    product.image = result.secure_url;
    await product.save();

    res.json({
      message: "Image uploaded successfully",
      imageUrl: result.secure_url,
      product,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
