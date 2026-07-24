import React, { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X, Loader2, Plus, ChevronDown } from "lucide-react";
import { API_URL } from "../../../config/api";
// 🔑 Path yahan Filter.jsx ke import se match karayi gayi hai
// ("../redux_Toolkit/fetcherSlice"). Agar ProductForm kisi aur folder
// depth par hai to is path ko apne project ke hisaab se adjust kar lena.
import { fetchData } from "../redux_Toolkit/fetcherSlice";

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
//
// 🔑 IMPORTANT: the exact strings below (casing included) are what gets
// saved as colors[].color in the DB, and Filter.jsx's color list must use
// these SAME strings, or clicking a color in the filter will never match
// a saved product. If you ever change this list, update Filter.jsx too
// (ideally, pull both from one shared constants file).

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

// 🔑 Empty color block seed — used both for the initial state and every
// time "Add Color" is clicked.
const emptyColorBlock = () => ({ color: "", images: [""], stock: "" });

// 🔑 onProductAdded: optional callback for the parent — call it if the
// parent wants to force a hard remount of the product page (e.g. via a
// `key` bump) instead of / in addition to the redux refetch below.
const ProductForm = ({ onClose, onProductAdded }) => {
  const dispatch = useDispatch();
  // Same slice key Filter.jsx reads from ("state.FetchPrducts"), so the
  // refetch below respects whatever filters/page the user currently has.
  const { filters } = useSelector((state) => state.FetchPrducts);

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
    status: "active",
    stock: "", // used only when neither sizes nor colors apply
  });

  // Size is a toggle-box grid: { "40": 5, "42": 2, ... } — key = size,
  // value = quantity for that size. Only shown for type "shoes" with a
  // category that has a defined size scale.
  const [sizeStocks, setSizeStocks] = useState({});

  // 🔑 Colors — array of blocks, each with its OWN color name, its OWN
  // images, and its OWN stock. Starts with one empty block so the section
  // isn't blank on first render; "Add Color" pushes another one.
  const [colorBlocks, setColorBlocks] = useState([emptyColorBlock()]);

  const [submitError, setSubmitError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [colorErrors, setColorErrors] = useState({}); // { [colorIndex]: true }
  const [uploading, setUploading] = useState({});
  const [uploadErrors, setUploadErrors] = useState({});

  // 🔑 Color-image upload/error state is keyed "colorIndex-imageIndex" so
  // it doesn't collide with the general `uploading`/`uploadErrors` state
  // used by the top-level Images section.
  const [colorImgUploading, setColorImgUploading] = useState({});
  const [colorImgErrors, setColorImgErrors] = useState({});

  const nameRef = useRef(null);
  const priceRef = useRef(null);
  const categoryRef = useRef(null);
  const typeRef = useRef(null);
  const fieldRefs = {
    name: nameRef,
    price: priceRef,
    category: categoryRef,
    type: typeRef,
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

  // ── Color block helpers ──────────────────────────────────────────────

  const addColorBlock = () =>
    setColorBlocks((prev) => [...prev, emptyColorBlock()]);

  const removeColorBlock = (colorIndex) =>
    setColorBlocks((prev) => {
      const next = prev.filter((_, i) => i !== colorIndex);
      return next.length ? next : [emptyColorBlock()];
    });

  const updateColorField = (colorIndex, field, value) => {
    setColorBlocks((prev) => {
      const next = [...prev];
      next[colorIndex] = { ...next[colorIndex], [field]: value };
      return next;
    });
    setColorErrors((prev) => (prev[colorIndex] ? { ...prev, [colorIndex]: false } : prev));
  };

  const handleColorImageChange = (colorIndex, imgIndex, value) => {
    setColorBlocks((prev) => {
      const next = [...prev];
      const images = [...next[colorIndex].images];
      images[imgIndex] = value;
      next[colorIndex] = { ...next[colorIndex], images };
      return next;
    });
  };

  const addColorImageField = (colorIndex) =>
    setColorBlocks((prev) => {
      const next = [...prev];
      next[colorIndex] = {
        ...next[colorIndex],
        images: [...next[colorIndex].images, ""],
      };
      return next;
    });

  const removeColorImageField = (colorIndex, imgIndex) =>
    setColorBlocks((prev) => {
      const next = [...prev];
      const images = next[colorIndex].images.filter((_, i) => i !== imgIndex);
      next[colorIndex] = { ...next[colorIndex], images: images.length ? images : [""] };
      return next;
    });

  const handleColorFileSelect = async (colorIndex, imgIndex, file) => {
    if (!file) return;
    const key = `${colorIndex}-${imgIndex}`;

    setColorImgUploading((prev) => ({ ...prev, [key]: true }));
    setColorImgErrors((prev) => ({ ...prev, [key]: "" }));

    try {
      const url = await uploadToCloudinary(file);
      handleColorImageChange(colorIndex, imgIndex, url);
    } catch (err) {
      console.error(err);
      setColorImgErrors((prev) => ({
        ...prev,
        [key]: err.message || "Upload failed. Please try again.",
      }));
    } finally {
      setColorImgUploading((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Colors actually worth saving = ones where a color name was picked.
  // A block left fully empty (user clicked "Add Color" but didn't fill it)
  // is silently dropped rather than causing a validation error.
  const filledColorBlocks = colorBlocks.filter((c) => c.color.trim() !== "");
  const hasAnyColorInput = colorBlocks.some(
    (c) => c.color.trim() !== "" || c.images.some((img) => img.trim() !== "") || c.stock !== ""
  );

  const totalStock = sizeOptions
    ? Object.values(sizeStocks).reduce((sum, q) => sum + (Number(q) || 0), 0)
    : filledColorBlocks.length > 0
    ? filledColorBlocks.reduce((sum, c) => sum + (Number(c.stock) || 0), 0)
    : Number(product.stock) || 0;

  const validate = () => {
    const errors = {};
    if (!product.name.trim()) errors.name = true;
    if (!product.price) errors.price = true;
    if (!product.category) errors.category = true;
    if (!product.type) errors.type = true;
    return errors;
  };

  // 🔑 Color validation is separate from the rest since it's a list, not a
  // single field: at least one color must be picked, and no two blocks can
  // share the same color.
  const validateColors = () => {
    const errs = {};
    let hasAtLeastOne = false;
    const seen = new Set();

    colorBlocks.forEach((c, i) => {
      if (c.color.trim() === "") return; // ignore untouched blocks
      hasAtLeastOne = true;
      if (seen.has(c.color)) errs[i] = true;
      seen.add(c.color);
    });

    return { errs, hasAtLeastOne };
  };

  const focusFirstError = (errors) => {
    const order = ["name", "price", "category", "type"];
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
    const { errs: colorErrs, hasAtLeastOne } = validateColors();

    if (!hasAtLeastOne) {
      setSubmitError("Please add at least one color.");
      focusFirstError(errors);
      setFieldErrors(errors);
      return;
    }

    if (Object.keys(errors).length > 0 || Object.keys(colorErrs).length > 0) {
      setFieldErrors(errors);
      setColorErrors(colorErrs);
      focusFirstError(errors);
      setSubmitError(
        Object.keys(colorErrs).length > 0
          ? "Duplicate colors selected — each color can only be added once."
          : "Please fill in the highlighted required fields."
      );
      return;
    }

    if (Object.values(uploading).some(Boolean) || Object.values(colorImgUploading).some(Boolean)) {
      setSubmitError("An image is still uploading, please wait.");
      return;
    }

    const cleanedSizes = sizeOptions
      ? Object.entries(sizeStocks).map(([size, stock]) => ({
          size,
          stock: Number(stock) || 0,
        }))
      : [{ size: "One Size", stock: Number(product.stock) || 0 }];

    // 🔑 Only the filled-in color blocks get saved; each one's own images
    // are trimmed of blanks the same way the top-level images are.
    const cleanedColors = filledColorBlocks.map((c) => ({
      color: c.color,
      hex: COLOR_SWATCH[c.color] && !COLOR_SWATCH[c.color].startsWith("linear")
        ? COLOR_SWATCH[c.color]
        : "",
      images: c.images.filter((img) => img.trim() !== ""),
      stock: Number(c.stock) || 0,
    }));

    const payload = {
      name: product.name,
      price: Number(product.price),
      oldPrice: product.oldPrice ? Number(product.oldPrice) : null,
      description: product.description,
      discount: product.discount,
      rating: product.rating,
      category: product.category,
      type: product.type,
      status: product.status,
      images: product.images.filter((img) => img.trim() !== ""),
      colors: cleanedColors,
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

        // 🔑 Only NOW (a real successful add) do we touch the product
        // list — refetch with whatever filters/page are currently active,
        // so the product page reflects the new item instead of getting
        // refreshed on every open/close of this form.
        dispatch(fetchData(filters));
        // Let the parent force a hard remount too, if it wants one
        // (e.g. `setListKey((k) => k + 1)` passed in as onProductAdded).
        onProductAdded?.();

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

  const colorFieldClass = (colorIndex) =>
    `${baseInput} appearance-none pr-9 ${
      colorErrors[colorIndex]
        ? "border-red-300 ring-2 ring-red-100 focus:ring-red-100"
        : "border-gray-200 focus:ring-gray-900/10 focus:border-gray-300"
    }`;

  const labelClass = "block text-xs font-medium text-gray-500 mb-1.5";
  const Required = () => <span className="text-red-500">*</span>;

  // Colors already picked in OTHER blocks, so each dropdown can hide them
  // and make accidental duplicates harder to create in the first place.
  const colorsUsedElsewhere = (currentIndex) =>
    new Set(
      colorBlocks
        .filter((_, i) => i !== currentIndex)
        .map((c) => c.color)
        .filter(Boolean)
    );

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

          {/* General Images — fallback shown when a color has no images of its own */}
          <section>
            <label className={labelClass}>General Images</label>
            <p className="text-xs text-gray-400 mb-2">
              Used as a fallback wherever a color below doesn't have its own images.
            </p>
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

          {/* ── Colors — each color has its OWN images + its OWN stock ── */}
          <section>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelClass.replace("mb-1.5", "mb-0")}>
                Colors <Required />
              </label>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Add at least one color. Each color can have its own photos and its own stock count.
            </p>

            <div className="space-y-4">
              {colorBlocks.map((block, colorIndex) => {
                const usedElsewhere = colorsUsedElsewhere(colorIndex);
                const availableOptions = COLOR_OPTIONS.filter(
                  (c) => c === block.color || !usedElsewhere.has(c)
                );

                return (
                  <div
                    key={colorIndex}
                    className={`border rounded-xl p-3 space-y-3 ${
                      colorErrors[colorIndex] ? "border-red-300 bg-red-50/40" : "border-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <select
                          value={block.color}
                          onChange={(e) => updateColorField(colorIndex, "color", e.target.value)}
                          className={colorFieldClass(colorIndex)}
                        >
                          <option value="">select color</option>
                          {availableOptions.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>

                      {block.color && (
                        <span
                          className="w-9 h-9 rounded-full border border-gray-300 shrink-0"
                          style={swatchStyle(block.color)}
                          title={block.color}
                        />
                      )}

                      <input
                        type="number"
                        min="0"
                        placeholder="Stock"
                        value={block.stock}
                        onChange={(e) => updateColorField(colorIndex, "stock", e.target.value)}
                        className={`${baseInput} w-28 border-gray-200 focus:ring-gray-900/10 focus:border-gray-300`}
                      />

                      {colorBlocks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeColorBlock(colorIndex)}
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 shrink-0"
                          aria-label="Remove color"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {colorErrors[colorIndex] && (
                      <p className="text-[11px] text-red-500">
                        This color is already added above — pick a different one.
                      </p>
                    )}

                    {/* Per-color images */}
                    <div className="pl-1 space-y-2">
                      {block.images.map((img, imgIndex) => {
                        const key = `${colorIndex}-${imgIndex}`;
                        return (
                          <div key={imgIndex} className="flex items-center gap-2">
                            {colorImgUploading[key] ? (
                              <div className="w-12 h-12 flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 shrink-0">
                                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                              </div>
                            ) : img ? (
                              <img
                                src={img}
                                alt={`${block.color || "color"}-preview-${imgIndex}`}
                                className="w-12 h-12 object-cover rounded-lg border border-gray-200 shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 flex items-center justify-center rounded-lg border border-dashed border-gray-300 text-[9px] text-gray-400 text-center shrink-0">
                                No image
                              </div>
                            )}

                            <label className="text-xs text-gray-600 hover:text-gray-900 cursor-pointer bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-lg shrink-0">
                              {img ? "Change" : "Upload"}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) =>
                                  handleColorFileSelect(colorIndex, imgIndex, e.target.files[0])
                                }
                              />
                            </label>

                            <input
                              type="text"
                              placeholder="...or paste image URL"
                              value={img}
                              onChange={(e) =>
                                handleColorImageChange(colorIndex, imgIndex, e.target.value)
                              }
                              className={`${baseInput} flex-1 border-gray-200 focus:ring-gray-900/10 focus:border-gray-300 py-1.5`}
                            />

                            {block.images.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeColorImageField(colorIndex, imgIndex)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 shrink-0"
                                aria-label="Remove color image"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {colorImgErrors[key] && (
                              <p className="text-[10px] text-red-500 shrink-0">
                                {colorImgErrors[key]}
                              </p>
                            )}
                          </div>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => addColorImageField(colorIndex)}
                        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 hover:underline"
                      >
                        <Plus className="w-3 h-3" /> Add image for this color
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={addColorBlock}
              disabled={colorBlocks.length >= COLOR_OPTIONS.length}
              className="mt-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 hover:underline disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline"
            >
              <Plus className="w-3.5 h-3.5" /> Add Color
            </button>
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
                  {hasAnyColorInput
                    ? "Sizes only apply to the \"shoes\" type — total stock is being taken from the colors above instead."
                    : product.type === "shoes"
                    ? product.category
                      ? `"${product.category}" doesn't have a shoe size scale — just set a stock quantity.`
                      : "Select a category above first."
                    : "Sizes only apply to the \"shoes\" type — just set a stock quantity."}
                </p>
                {!hasAnyColorInput && (
                  <input
                    name="stock"
                    type="number"
                    min="0"
                    placeholder="Stock quantity"
                    value={product.stock}
                    onChange={handleChange}
                    className={fieldClass("stock")}
                  />
                )}
                <p className="text-xs text-gray-400 mt-2">Total stock: {totalStock}</p>
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