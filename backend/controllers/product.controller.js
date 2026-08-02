const Product = require("../models/Product");
const crypto = require("crypto");
const { getValidSizesFor } = require("../models/Product");

// 🔑 productId generation lives here (plain function, called before the
// document is constructed) — not as a Mongoose schema hook. See the note
// at the top of Product.js for why.
function generateProductId() {
  const rand = crypto.randomBytes(6).toString("hex").toUpperCase(); // 12 hex chars
  return `PRD-${rand.slice(0, 8)}-${rand.slice(8, 12)}`;
}

// 🔑 NEW — shared helper so both Add and Update reject bad sizes with a
// clean, specific 400 BEFORE hitting the DB, instead of relying only on
// the schema-level pre("validate") in Product.js to catch it late.
function findInvalidSize(type, category, colors) {
  const validSizes = getValidSizesFor(type, category);
  if (type !== "shoes" || !validSizes) return null;

  const allowed = new Set(validSizes);
  for (const c of colors || []) {
    for (const s of c.sizes || []) {
      if (!allowed.has(s.size)) {
        return { size: s.size, color: c.color, validSizes };
      }
    }
  }
  return null;
}

// ── 1. Add Product ───────────────────────────────
exports.getAddProducts = async (req, res) => {
  try {
    const {
      name, description,
      price, oldPrice, colors, bg,
      discount, rating, type,
      category, stock, status,
      productId, // client-supplied, matches the form's editable Product ID field
    } = req.body;

    if (!colors || colors.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one color is required",
      });
    }

    const missingImage = colors.find((c) => !c.image);
    if (missingImage) {
      return res.status(400).json({
        success: false,
        message: "Each color must have an image",
      });
    }

    // 🔑 NEW — reject invalid sizes early with a specific message, before
    // constructing/saving the document.
    const invalid = findInvalidSize(type, category, colors);
    if (invalid) {
      return res.status(400).json({
        success: false,
        message: `Invalid size "${invalid.size}" for color "${invalid.color}" — allowed sizes for category "${category}" are: ${invalid.validSizes.join(", ")}`,
      });
    }

    const resolvedProductId =
      productId && String(productId).trim() ? String(productId).trim() : generateProductId();

    const product = new Product({
      name, description,
      price, oldPrice, colors, bg,
      discount, rating, type,
      category, stock, status,
      productId: resolvedProductId,
    });

    // .save() (not findByIdAndUpdate) is what runs colorSchema's
    // pre("validate") stock rollup, the duplicate-color/duplicate-size
    // validators, the size-range validator, and productSchema's
    // pre("save") total-stock rollup. Keep it this way.
    const savedProduct = await product.save();

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      product: savedProduct,
    });

  } catch (error) {
    console.error("Add error:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)[0]?.message || error.message || "Validation failed",
        error: error.message,
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "This Product ID is already in use — please choose a different one or clear the field to auto-generate.",
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: "Failed to add product",
      error: error.message,
    });
  }
};

exports.fetchAllProducts = async (req, res) => {
  try {
    const {
      category,
      color,
      sizes,
      minPrice,
      maxPrice,
      search,
      sortBy,
      order,
      page,
      size,
    } = req.query;

    const filter = {};

    if (category) {
      filter.category = { $regex: `^${category}$`, $options: "i" };
    }

    if (color) {
      filter["colors.color"] = { $regex: `^${color}$`, $options: "i" };
    }

    if (sizes) {
      const sizeList = sizes.split(",").map((s) => s.trim()).filter(Boolean);
      if (sizeList.length > 0) {
        filter["colors.sizes.size"] = { $in: sizeList };
      }
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { productId: { $regex: search, $options: "i" } },
      ];
    }

    const allowedSortFields = ["price", "name", "rating", "discount", "createdAt"];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    const sortOrder = order === "asc" ? 1 : -1;
    const sort = { [sortField]: sortOrder };

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.max(parseInt(size, 10) || 20, 1);
    const skip = (pageNum - 1) * pageSize;

    const [products, totalCount] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(pageSize),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: products.length,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: pageNum,
      products,
    });
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

// ── 3. Fetch Single Product by ID ───────────────
exports.fetchProductDetailsById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({ success: true, product });

  } catch (error) {
    console.error("Detail error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── 4. Delete Product ────────────────────────────
exports.deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted!",
      product: deleted,
    });

  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── 5. Update Product ────────────────────────────
exports.updateProduct = async (req, res) => {
  try {
    const {
      name, description,
      price, oldPrice, colors, bg,
      discount, rating, type,
      category, stock, status,
    } = req.body;
    // productId intentionally NOT accepted here — assigned once at
    // creation and shouldn't change afterwards.

    if (colors && colors.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one color is required",
      });
    }

    if (colors) {
      const missingImage = colors.find((c) => !c.image);
      if (missingImage) {
        return res.status(400).json({
          success: false,
          message: "Each color must have an image",
        });
      }
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // 🔑 NEW — validate sizes against whichever category/type will end up
    // on the document after this update (fall back to existing values for
    // any field the client didn't send).
    const effectiveCategory = category !== undefined ? category : product.category;
    const effectiveType = type !== undefined ? type : product.type;
    const effectiveColors = colors !== undefined ? colors : product.colors;

    const invalid = findInvalidSize(effectiveType, effectiveCategory, effectiveColors);
    if (invalid) {
      return res.status(400).json({
        success: false,
        message: `Invalid size "${invalid.size}" for color "${invalid.color}" — allowed sizes for category "${effectiveCategory}" are: ${invalid.validSizes.join(", ")}`,
      });
    }

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (oldPrice !== undefined) product.oldPrice = oldPrice;
    if (colors !== undefined) product.colors = colors;
    if (bg !== undefined) product.bg = bg;
    if (discount !== undefined) product.discount = discount;
    if (rating !== undefined) product.rating = rating;
    if (type !== undefined) product.type = type;
    if (category !== undefined) product.category = category;
    if (stock !== undefined) product.stock = stock; // overwritten by pre-save rollup if colors present
    if (status !== undefined) product.status = status;

    // 🔑 findByIdAndUpdate is intentionally NOT used — it runs QUERY
    // middleware, not DOCUMENT middleware, so it would skip the stock
    // rollup and the duplicate/size validators entirely. save() makes
    // Edit behave exactly like Add.
    const updatedProduct = await product.save();

    res.status(200).json({
      success: true,
      message: "Product updated!",
      product: updatedProduct,
    });

  } catch (error) {
    console.error("Update error:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)[0]?.message || error.message || "Validation failed",
        error: error.message,
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate key error",
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error.message,
    });
  }
};