import React, { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X, Loader2, Plus, ChevronDown } from "lucide-react";
import { API_URL } from "../../../config/api";
// 🔑 Path yahan Filter.jsx ke import se match karayi gayi hai
// ("../redux_Toolkit/fetcherSlice"). Agar ProductForm kisi aur folder
// depth par hai to is path ko apne project ke hisaab se adjust kar lena.
import { fetchData } from "../redux_Toolkit/fetcherSlice";
import {
  uploadToCloudinary,
  CATEGORY_OPTIONS,
  TYPE_OPTIONS,
  COLOR_OPTIONS,
  sizeOptionsFor,
  swatchStyle,
  emptyColorBlock,
  blocksToColorsArray,
  colorBlockStock,
  colorBlocksTotalStock,
} from "./Productformhelpers";

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
  });

  // 🔑 Colors — array of blocks, each with its OWN color name, its OWN
  // images, and its OWN stock (either a plain number, or a per-color
  // size toggle-grid when the type+category has a shoe size scale).
  // Starts with one empty block so the section isn't blank on first
  // render; "Add Color" pushes another one.
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
  // one resets any sizes already picked on every color block (they may no
  // longer be valid), and clears each color's manual stock too so stale
  // numbers from the "no size scale" mode don't linger silently.
  const resetAllColorSizesAndStock = () =>
    setColorBlocks((prev) => prev.map((c) => ({ ...c, sizes: {}, stock: "" })));

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setProduct((prev) => ({ ...prev, category }));
    resetAllColorSizesAndStock();
    clearFieldError("category");
  };

  const handleTypeChange = (e) => {
    const type = e.target.value;
    setProduct((prev) => ({ ...prev, type }));
    resetAllColorSizesAndStock();
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

  // 🔑 Per-color size toggle-grid helpers. Toggling a size on seeds a
  // quantity of 1 for THAT color only — other colors' size maps are
  // untouched.
  const toggleColorSize = (colorIndex, size) => {
    setColorBlocks((prev) => {
      const next = [...prev];
      const sizes = { ...next[colorIndex].sizes };
      if (size in sizes) {
        delete sizes[size];
      } else {
        sizes[size] = 1;
      }
      next[colorIndex] = { ...next[colorIndex], sizes };
      return next;
    });
  };

  const setColorSizeQuantity = (colorIndex, size, qty) =>
    setColorBlocks((prev) => {
      const next = [...prev];
      next[colorIndex] = {
        ...next[colorIndex],
        sizes: { ...next[colorIndex].sizes, [size]: qty },
      };
      return next;
    });

  // Colors actually worth saving = ones where a color name was picked.
  // A block left fully empty (user clicked "Add Color" but didn't fill it)
  // is silently dropped rather than causing a validation error.
  const filledColorBlocks = colorBlocks.filter((c) => c.color.trim() !== "");

  const totalStock = colorBlocksTotalStock(filledColorBlocks, sizeOptions);

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

    // 🔑 Each filled color carries its OWN sizes (when a size scale
    // applies) or its own plain stock number (when it doesn't).
    const cleanedColors = blocksToColorsArray(filledColorBlocks, sizeOptions);

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

          {/* ── Colors — each color has its OWN images + its OWN stock/sizes ── */}
          <section>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelClass.replace("mb-1.5", "mb-0")}>
                Colors <Required />
              </label>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Add at least one color. Each color has its own photos, and its own
              {sizeOptions ? " size-wise stock." : " stock count."}
            </p>
            {!product.type || !product.category ? (
              <p className="text-xs text-amber-600 mb-3">
                Pick a Category and Type above first — that decides whether each color
                gets a size grid (shoes) or a plain stock number.
              </p>
            ) : null}

            <div className="space-y-4">
              {colorBlocks.map((block, colorIndex) => {
                const usedElsewhere = colorsUsedElsewhere(colorIndex);
                const availableOptions = COLOR_OPTIONS.filter(
                  (c) => c === block.color || !usedElsewhere.has(c)
                );
                const blockStock = colorBlockStock(block, sizeOptions);

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

                      {/* Plain stock input — only when there's no size scale.
                          When sizes apply, this color's stock is the sum of
                          the size grid below (read-only badge instead). */}
                      {sizeOptions ? (
                        <span className="w-28 shrink-0 text-xs text-gray-500 text-center px-2 py-2.5 rounded-xl bg-gray-100 border border-gray-200">
                          Stock: {blockStock}
                        </span>
                      ) : (
                        <input
                          type="number"
                          min="0"
                          placeholder="Stock"
                          value={block.stock}
                          onChange={(e) => updateColorField(colorIndex, "stock", e.target.value)}
                          className={`${baseInput} w-28 border-gray-200 focus:ring-gray-900/10 focus:border-gray-300`}
                        />
                      )}

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

                    {/* 🔑 Per-color size toggle-grid — only when type=shoes
                        and the chosen category has a defined size scale. */}
                    {sizeOptions && (
                      <div className="pl-1 space-y-2 border-t border-gray-100 pt-3">
                        <p className="text-[11px] font-medium text-gray-500">
                          Sizes for this color
                        </p>
                        <div className="grid grid-cols-4 xs:grid-cols-5 sm:grid-cols-6 gap-2">
                          {sizeOptions.map((size) => {
                            const active = size in block.sizes;
                            return (
                              <button
                                key={size}
                                type="button"
                                onClick={() => toggleColorSize(colorIndex, size)}
                                className={`h-10 rounded-lg text-sm font-medium border transition ${
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

                        {Object.keys(block.sizes).length > 0 && (
                          <div className="space-y-2 pt-1">
                            {Object.entries(block.sizes)
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
                                    onChange={(e) =>
                                      setColorSizeQuantity(colorIndex, size, e.target.value)
                                    }
                                    className={`${baseInput} flex-1 border-gray-200 focus:ring-gray-900/10 focus:border-gray-300`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => toggleColorSize(colorIndex, size)}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 shrink-0"
                                    aria-label={`Remove size ${size}`}
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Per-color images */}
                    <div className="pl-1 space-y-2 border-t border-gray-100 pt-3">
                      <p className="text-[11px] font-medium text-gray-500">
                        Images for this color
                      </p>
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

            <p className="text-xs text-gray-400 mt-3">Total stock: {totalStock}</p>
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