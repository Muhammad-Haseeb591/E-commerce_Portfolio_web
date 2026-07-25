const Product = require("../models/Product");

// ── 1. Add Product ───────────────────────────────
exports.getAddProducts = async (req, res) => {
  try {
    const {
      name, description, images,
      price, oldPrice, colors, bg,
      discount, rating, type,
      category, stock, status,
    } = req.body;
    // 🔑 `sizes` REMOVED from here — sizes now live INSIDE each
    // colors[i].sizes, not at the top level. `type` ADDED — the schema
    // now declares it, and it's what decides (with category) whether a
    // color uses a size grid or a plain stock number.

    if (!images || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one image is required",
      });
    }

    if (!colors || colors.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one color is required",
      });
    }

    const product = new Product({
      name, description, images,
      price, oldPrice, colors, bg,
      discount, rating, type,
      category, stock, status,
    });

    // 🔑 .save() (not .create() shortcut skipped, not findByIdAndUpdate)
    // is what actually runs colorSchema's pre("validate") stock rollup,
    // the duplicate-color/duplicate-size validators, and productSchema's
    // pre("save") total-stock rollup. Keep it this way.
    const savedProduct = await product.save();

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      product: savedProduct,
    });

  } catch (error) {
    console.error("Add error:", error);
    // Mongoose validation errors (duplicate color, duplicate size, missing
    // required field) land here — surface the real message instead of a
    // generic 500 so the form's submitError shows something useful.
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)[0]?.message || "Validation failed",
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

// ── 2. Fetch All Products (category + color + size + price + search + sort + pagination) ──
// Query params, sab optional:
//   category=women                → sirf usi category ke products
//   color=Black                   → colors[].color match (case-insensitive)
//   sizes=40,42                   → colors[].sizes[].size mein se koi bhi match
//   minPrice=1000&maxPrice=5000   → price range
//   search=shirt                  → name/description mein match
//   sortBy=price                  → price | name | rating | discount | createdAt
//   order=asc | desc              → default: desc
//   page=1                        → default: 1
//   size=20                       → per-page count, default: 20
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

    // ── Filter ────────────────────────────────────
    const filter = {};

    if (category) {
      filter.category = { $regex: `^${category}$`, $options: "i" };
    }

    // 🔑 Color lives inside the colors[] array now, not a top-level field.
    // Dot-notation on an array path matches if ANY element has that color.
    if (color) {
      filter["colors.color"] = { $regex: `^${color}$`, $options: "i" };
    }

    // 🔑 Same idea for size — nested one level deeper (colors[].sizes[].size).
    // `sizes` can be a comma list ("40,42") from the Filter.jsx toggle grid;
    // $in matches a product that has ANY color offering ANY of these sizes.
    // Note: this does NOT require the matching color and size to be on the
    // SAME color entry — if you need "this exact color in this exact size",
    // use $elemMatch with a nested arrayFilter-style query instead.
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
      ];
    }

    // ── Sorting ───────────────────────────────────
    const allowedSortFields = ["price", "name", "rating", "discount", "createdAt"];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    const sortOrder = order === "asc" ? 1 : -1;
    const sort = { [sortField]: sortOrder };

    // ── Pagination ─────────────────────────────────
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
      name, description, images,
      price, oldPrice, colors, bg,
      discount, rating, type,
      category, stock, status,
    } = req.body;

    if (colors && colors.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one color is required",
      });
    }

    // 🔑 CHANGED from findByIdAndUpdate to fetch → mutate → save().
    // findByIdAndUpdate runs QUERY middleware, not DOCUMENT middleware —
    // it never fires colorSchema's pre("validate") stock rollup, the
    // duplicate-color/duplicate-size path validators, or productSchema's
    // pre("save") total-stock rollup. That means edits were silently
    // skipping stock recalculation and duplicate checks. Using save()
    // here makes Edit behave exactly like Add.
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (images !== undefined) product.images = images;
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
        message: Object.values(error.errors)[0]?.message || "Validation failed",
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: "Failed to update product",
    });
  }
};