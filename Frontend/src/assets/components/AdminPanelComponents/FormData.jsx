import React, { useState, useRef } from "react";
import { X, Loader2, Plus, ChevronDown } from "lucide-react";
import { API_URL } from "../config/api";

// Backend already handles Cloudinary upload (signed, via multer-storage-cloudinary)
// so we hit OUR server route, not Cloudinary directly — no upload_preset needed.
const uploadToCloudinary = async (file) => {
  const uploadData = new FormData();
  uploadData.append("file", file); // field name MUST match multer's upload.single('file')

  const res = await fetch(`${API_URL}/api/upload`, {
    method: "POST",
    body: uploadData,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || `Upload failed (status ${res.status})`);
  }

  return data.url; // req.file.path (Cloudinary secure URL) from backend
};

// --- Fixed lookup lists -----------------------------------------------
// Fixed lists (instead of free text) keep the backend's exact-match
// filters (?category=kids, ?color=black) reliable — no typos, no casing
// mismatches.

const CATEGORY_OPTIONS = [
  "men",
  "women",
  "sales",
  "perfume",
  "accessories",
  "getinspired",
  "kids",
];

const TYPE_OPTIONS = ["shoes", "other"];

const COLOR_OPTIONS = [
  "Black", "White", "Grey", "Navy", "Blue", "Red",
  "Green", "Yellow", "Pink", "Brown", "Beige", "Multicolor",
];

const COLOR_SWATCH = {
  Black: "#000000", White: "#ffffff", Grey: "#9ca3af", Navy: "#1e3a5f",
  Blue: "#2563eb", Red: "#dc2626", Green: "#16a34a", Yellow: "#eab308",
  Pink: "#ec4899", Brown: "#78350f", Beige: "#e8dcc8", Multicolor:
    "linear-gradient(135deg, red, orange, yellow, green, blue, violet)",
};

// Shoe size ranges, per category. Sizes only ever apply when Type = "shoes"
// AND the category has a defined scale below — everything else (type =
// "other", or a category with no shoe scale) just uses a plain stock number.
const range = (start, end) =>
  Array.from({ length: end - start + 1 }, (_, i) => String(start + i));

const SHOE_SIZES_BY_CATEGORY = {
  kids: range(25, 36),
  men: range(38, 46),
  women: range(37, 42),
};

const sizeOptionsFor = (type, category) =>
  type === "shoes" ? SHOE_SIZES_BY_CATEGORY[category] || null : null;

const swatchStyle = (color) => {
  const value = COLOR_SWATCH[color];
  if (!value) return { background: "#e5e7eb" };
  return value.startsWith("linear") ? { background: value } : { backgroundColor: value };
};

const ProductForm = ({ onClose }) => {
  const [product, setProduct] = useState({
    name: "",
    price: "",
    oldPrice: "",
    description: "",
    images: [""],
    discount: "",
    rating: 0,
    category: "",
    type: "",
    color: "",
    status: "active",
    stock: "", // used only when sizes don't apply
  });

  // Size is a toggle-box grid: { "40": 5, "42": 2, ... } — key = size,
  // value = quantity for that size. Only shown for type "shoes" with a
  // category that has a defined size scale.
  const [sizeStocks, setSizeStocks] = useState({});

  const [submitError, setSubmitError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [uploading, setUploading] = useState({});
  const [uploadErrors, setUploadErrors] = useState({});

  const nameRef = useRef(null);
  const priceRef = useRef(null);
  const categoryRef = useRef(null);
  const typeRef = useRef(null);
  const colorRef = useRef(null);
  const fieldRefs = {
    name: nameRef,
    price: priceRef,
    category: categoryRef,
    type: typeRef,
    color: colorRef,
  };

  const sizeOptions = sizeOptionsFor(product.type, product.category);

  const clearFieldError = (field) =>
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: false } : prev));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({ ...prev, [name]: value }));
    clearFieldError(name);
  };

  // Category and Type together decide the size scale, so changing either
  // one resets any sizes already picked (they may no longer be valid).
  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setProduct((prev) => ({ ...prev, category }));
    setSizeStocks({});
    clearFieldError("category");
  };

  const handleTypeChange = (e) => {
    const type = e.target.value;
    setProduct((prev) => ({ ...prev, type }));
    setSizeStocks({});
    clearFieldError("type");
  };

  const handleImageChange = (index, value) => {
    setProduct((prev) => {
      const images = [...prev.images];
      images[index] = value;
      return { ...prev, images };
    });
  };

  const handleFileSelect = async (index, file) => {
    if (!file) return;

    setUploading((prev) => ({ ...prev, [index]: true }));
    setUploadErrors((prev) => ({ ...prev, [index]: "" }));

    try {
      const url = await uploadToCloudinary(file);
      handleImageChange(index, url);
    } catch (err) {
      console.error(err);
      setUploadErrors((prev) => ({
        ...prev,
        [index]: err.message || "Upload failed. Please try again.",
      }));
    } finally {
      setUploading((prev) => ({ ...prev, [index]: false }));
    }
  };

  const addImageField = () =>
    setProduct((prev) => ({ ...prev, images: [...prev.images, ""] }));

  const removeImageField = (index) =>
    setProduct((prev) => {
      const images = prev.images.filter((_, i) => i !== index);
      return { ...prev, images: images.length ? images : [""] };
    });

  // Toggle a size box on/off. Turning it on seeds a quantity of 1.
  const toggleSize = (size) => {
    setSizeStocks((prev) => {
      const next = { ...prev };
      if (size in next) {
        delete next[size];
      } else {
        next[size] = 1;
      }
      return next;
    });
  };

  const setSizeQuantity = (size, qty) =>
    setSizeStocks((prev) => ({ ...prev, [size]: qty }));

  const totalStock = sizeOptions
    ? Object.values(sizeStocks).reduce((sum, q) => sum + (Number(q) || 0), 0)
    : Number(product.stock) || 0;

  const validate = () => {
    const errors = {};
    if (!product.name.trim()) errors.name = true;
    if (!product.price) errors.price = true;
    if (!product.category) errors.category = true;
    if (!product.type) errors.type = true;
    if (!product.color) errors.color = true;
    return errors;
  };

  const focusFirstError = (errors) => {
    const order = ["name", "price", "category", "type", "color"];
    const firstField = order.find((f) => errors[f]);
    const ref = firstField && fieldRefs[firstField];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
      ref.current.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      focusFirstError(errors);
      setSubmitError("Please fill in the highlighted required fields.");
      return;
    }

    if (Object.values(uploading).some(Boolean)) {
      setSubmitError("An image is still uploading, please wait.");
      return;
    }

    const cleanedSizes = sizeOptions
      ? Object.entries(sizeStocks).map(([size, stock]) => ({
          size,
          stock: Number(stock) || 0,
        }))
      : [{ size: "One Size", stock: Number(product.stock) || 0 }];

    const payload = {
      name: product.name,
      price: Number(product.price),
      oldPrice: product.oldPrice ? Number(product.oldPrice) : null,
      description: product.description,
      discount: product.discount,
      rating: product.rating,
      category: product.category,
      type: product.type,
      color: product.color,
      status: product.status,
      images: product.images.filter((img) => img.trim() !== ""),
      sizes: cleanedSizes,
      stock: totalStock,
    };

    try {
      const res = await fetch(`${API_URL}/admin/addproducts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        alert("Product added successfully!");
        onClose();
      } else {
        setSubmitError(data?.message || "Could not add product. Server error.");
      }
    } catch (err) {
      console.error(err);
      setSubmitError("Network error — could not reach the server.");
    }
  };

  const baseInput =
    "w-full px-4 py-2.5 rounded-xl border bg-gray-50 text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:bg-white transition";

  const fieldClass = (name) =>
    `${baseInput} ${
      fieldErrors[name]
        ? "border-red-300 ring-2 ring-red-100 focus:ring-red-100"
        : "border-gray-200 focus:ring-gray-900/10 focus:border-gray-300"
    }`;

  const labelClass = "block text-xs font-medium text-gray-500 mb-1.5";
  const Required = () => <span className="text-red-500">*</span>;

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-gray-200 max-h-[95vh] overflow-y-auto">

        {/* Header */}
        <div className="flex justify-between items-center px-4 sm:px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Add New Product</h2>
            <p className="text-xs text-gray-400 mt-0.5">Fields marked with * are required</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-5 space-y-6">

          {/* Basic info */}
          <section className="space-y-4">
            <div>
              <label className={labelClass}>Product Name <Required /></label>
              <input
                ref={nameRef}
                name="name"
                placeholder="e.g. Classic Leather Jacket"
                value={product.name}
                onChange={handleChange}
                className={fieldClass("name")}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Price <Required /></label>
                <input
                  ref={priceRef}
                  name="price"
                  type="number"
                  placeholder="0.00"
                  value={product.price}
                  onChange={handleChange}
                  className={fieldClass("price")}
                />
              </div>
              <div>
                <label className={labelClass}>Old Price (optional)</label>
                <input
                  name="oldPrice"
                  type="number"
                  placeholder="0.00"
                  value={product.oldPrice}
                  onChange={handleChange}
                  className={fieldClass("oldPrice")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Category <Required /></label>
                <div className="relative">
                  <select
                    ref={categoryRef}
                    name="category"
                    value={product.category}
                    onChange={handleCategoryChange}
                    className={`${fieldClass("category")} appearance-none pr-9`}
                  >
                    <option value="">select category</option>
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div>
                <label className={labelClass}>Type <Required /></label>
                <div className="relative">
                  <select
                    ref={typeRef}
                    name="type"
                    value={product.type}
                    onChange={handleTypeChange}
                    className={`${fieldClass("type")} appearance-none pr-9`}
                  >
                    <option value="">select type</option>
                    {TYPE_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Status</label>
                <div className="relative">
                  <select
                    name="status"
                    value={product.status}
                    onChange={handleChange}
                    className={`${fieldClass("status")} appearance-none pr-9`}
                  >
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                    <option value="pending">pending</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Discount (optional)</label>
                <input
                  name="discount"
                  placeholder="e.g. 20%"
                  value={product.discount}
                  onChange={handleChange}
                  className={fieldClass("discount")}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Description</label>
              <textarea
                name="description"
                placeholder="Short description of the product"
                value={product.description}
                onChange={handleChange}
                className={`${fieldClass("description")} h-24 resize-none`}
              />
            </div>
          </section>

          {/* Images */}
          <section>
            <label className={labelClass}>Images</label>
            <div className="space-y-3">
              {product.images.map((img, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    {uploading[i] ? (
                      <div className="w-16 h-16 flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 shrink-0">
                        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                      </div>
                    ) : img ? (
                      <img
                        src={img}
                        alt={`preview-${i}`}
                        className="w-16 h-16 object-cover rounded-lg border border-gray-200 shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 flex items-center justify-center rounded-lg border border-dashed border-gray-300 text-[10px] text-gray-400 text-center shrink-0">
                        No image
                      </div>
                    )}

                    <div className="flex-1 space-y-1 min-w-0">
                      <label className="inline-block text-xs text-gray-600 hover:text-gray-900 cursor-pointer bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg">
                        {img ? "Change Image" : "Upload Image"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileSelect(i, e.target.files[0])}
                        />
                      </label>
                      {uploadErrors[i] && (
                        <p className="text-[11px] text-red-500">{uploadErrors[i]}</p>
                      )}
                    </div>

                    {product.images.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeImageField(i)}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 shrink-0"
                        aria-label="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="...or paste an image URL directly"
                    value={img}
                    onChange={(e) => handleImageChange(i, e.target.value)}
                    className={`${fieldClass("images")} mt-2`}
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addImageField}
              className="mt-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 hover:underline"
            >
              <Plus className="w-3.5 h-3.5" /> Add Image
            </button>
          </section>

          {/* Color */}
          <section>
            <label className={labelClass}>Color <Required /></label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <select
                  ref={colorRef}
                  name="color"
                  value={product.color}
                  onChange={handleChange}
                  className={`${fieldClass("color")} appearance-none pr-9`}
                >
                  <option value="">select color</option>
                  {COLOR_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              {product.color && (
                <span
                  className="w-9 h-9 rounded-full border border-gray-300 shrink-0"
                  style={swatchStyle(product.color)}
                  title={product.color}
                />
              )}
            </div>
          </section>

          {/* Sizes & stock — optional, only real for type = shoes */}
          <section>
            <label className={labelClass}>Sizes & Stock (optional)</label>

            {sizeOptions ? (
              <>
                <p className="text-xs text-gray-400 mb-3">
                  Tap a size to add it, then set the quantity for that size.
                </p>

                <div className="grid grid-cols-4 xs:grid-cols-5 sm:grid-cols-6 gap-2 mb-3">
                  {sizeOptions.map((size) => {
                    const active = size in sizeStocks;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleSize(size)}
                        className={`h-11 rounded-lg text-sm font-medium border transition ${
                          active
                            ? "bg-gray-900 border-gray-900 text-white"
                            : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>

                {Object.keys(sizeStocks).length > 0 && (
                  <div className="space-y-2">
                    {Object.entries(sizeStocks)
                      .sort((a, b) => Number(a[0]) - Number(b[0]))
                      .map(([size, qty]) => (
                        <div
                          key={size}
                          className="flex items-center gap-3 border border-gray-100 rounded-xl px-3 py-2"
                        >
                          <span className="w-12 shrink-0 text-sm font-medium text-gray-700">
                            Size {size}
                          </span>
                          <input
                            type="number"
                            min="0"
                            placeholder="Quantity"
                            value={qty}
                            onChange={(e) => setSizeQuantity(size, e.target.value)}
                            className={`${fieldClass("sizeQty")} flex-1`}
                          />
                          <button
                            type="button"
                            onClick={() => toggleSize(size)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 shrink-0"
                            aria-label={`Remove size ${size}`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                  </div>
                )}

                <p className="text-xs text-gray-400 mt-2">Total stock: {totalStock}</p>
              </>
            ) : (
              <div>
                <p className="text-xs text-gray-400 mb-2">
                  {product.type === "shoes"
                    ? product.category
                      ? `"${product.category}" doesn't have a shoe size scale — just set a stock quantity.`
                      : "Select a category above first."
                    : "Sizes only apply to the \"shoes\" type — just set a stock quantity."}
                </p>
                <input
                  name="stock"
                  type="number"
                  min="0"
                  placeholder="Stock quantity"
                  value={product.stock}
                  onChange={handleChange}
                  className={fieldClass("stock")}
                />
              </div>
            )}
          </section>

          {submitError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {submitError}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-gray-900 hover:bg-gray-800 active:bg-gray-950 text-white font-semibold py-3 rounded-xl transition"
          >
            Save Product
          </button>

        </form>
      </div>
    </div>
  );
};

export default ProductForm;