import { useState, useRef, useEffect } from "react";
import {
  Plus, Search, Trash2, AlertCircle, PackageX, X, Pencil,
  Loader2, ChevronDown,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchData, deleteProductAsync, editProductAsync } from "../redux_Toolkit/fetcherSlice";
import FormData from "./FormData";
import {
  uploadToCloudinary,
  CATEGORY_OPTIONS,
  TYPE_OPTIONS,
  COLOR_OPTIONS,
  sizeOptionsFor,
  swatchStyle,
  emptyColorBlock,
  colorsArrayToBlocks,
  blocksToColorsArray,
  colorBlockStock,
  colorBlocksTotalStock,
} from "./Productformhelpers";

// 🎨 Primary action color used across this page
const PRIMARY = "#333333";
const PRIMARY_HOVER = "#222222";

// ── Loading / Error / Empty states (shared, width-safe) ──
const StateBlock = ({ children }) => (
  <div className="py-14 flex flex-col items-center gap-3 text-center px-4">{children}</div>
);

const ErrorState = ({ message }) => (
  <StateBlock>
    <AlertCircle className="w-8 h-8 text-red-400" />
    <span className="text-sm font-medium text-red-400">Error: {message}</span>
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="text-sm text-gray-600 border border-gray-300 px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
    >
      Refresh
    </button>
  </StateBlock>
);

const EmptyState = () => (
  <StateBlock>
    <PackageX className="w-8 h-8 text-gray-400" />
    <span className="text-sm text-gray-400">No products found</span>
  </StateBlock>
);

// ── Skeleton placeholders — shown instead of a spinner until real data mounts ──
const ProductCardSkeleton = () => (
  <div className="flex items-center gap-3 p-3 border-b border-gray-100 last:border-0 animate-pulse">
    <div className="w-12 h-12 rounded-lg bg-gray-200 shrink-0" />
    <div className="min-w-0 flex-1 space-y-2">
      <div className="h-3.5 w-2/3 bg-gray-200 rounded" />
      <div className="h-2.5 w-1/3 bg-gray-100 rounded" />
      <div className="h-3 w-1/2 bg-gray-100 rounded" />
    </div>
    <div className="flex flex-col gap-2 shrink-0">
      <div className="w-6 h-6 rounded-lg bg-gray-100" />
      <div className="w-6 h-6 rounded-lg bg-gray-100" />
    </div>
  </div>
);

const ProductRowSkeleton = () => (
  <tr className="border-t border-gray-100 animate-pulse">
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gray-200 shrink-0" />
        <div className="h-3.5 w-32 bg-gray-200 rounded" />
      </div>
    </td>
    <td className="px-6 py-4"><div className="h-3.5 w-20 bg-gray-100 rounded" /></td>
    <td className="px-6 py-4"><div className="h-3.5 w-16 bg-gray-100 rounded" /></td>
    <td className="px-6 py-4"><div className="h-5 w-24 bg-gray-100 rounded-full" /></td>
    <td className="px-6 py-4">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-gray-100" />
        <div className="w-6 h-6 rounded-lg bg-gray-100" />
      </div>
    </td>
  </tr>
);

const SKELETON_COUNT = 5;
const CardSkeletonList = () => (
  <>{Array.from({ length: SKELETON_COUNT }).map((_, i) => <ProductCardSkeleton key={i} />)}</>
);
const RowSkeletonList = () => (
  <>{Array.from({ length: SKELETON_COUNT }).map((_, i) => <ProductRowSkeleton key={i} />)}</>
);

// ── Stock Badge ──
const StockBadge = ({ stock }) => {
  const qty = Number(stock);
  let style, label;

  if (!stock && stock !== 0) {
    style = "bg-gray-100 text-gray-500";
    label = "—";
  } else if (qty === 0) {
    style = "bg-red-100 text-red-700";
    label = "0 — Out of Stock";
  } else if (qty <= 10) {
    style = "bg-yellow-100 text-yellow-700";
    label = `${qty} — Low Stock`;
  } else {
    style = "bg-green-100 text-green-700";
    label = `${qty} — In Stock`;
  }

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${style}`}>
      {label}
    </span>
  );
};

// ── Image Modal ──
const ImageModal = ({ selectedImage, productName, onClose }) => {
  if (!selectedImage) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4" onClick={onClose}>
      <div className="relative bg-white rounded-2xl p-4 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100">
          <X className="w-5 h-5 text-gray-600" />
        </button>
        <h3 className="text-lg font-semibold text-gray-800 mb-3 pr-8 break-words">{productName}</h3>
        <img src={selectedImage} alt={productName} className="w-full h-[300px] sm:h-[400px] object-contain rounded-xl" />
      </div>
    </div>
  );
};

// ── Edit Modal — mirrors every field from the Add Product form ──
const EditModal = ({ product, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: product.name || "",
    price: product.price || "",
    oldPrice: product.oldPrice || "",
    description: product.description || "",
    discount: product.discount || "",
    category: product.category || "",
    type: product.type || "",
    status: product.status || "active",
    images: product.images?.length ? product.images : [""],
  });

  // 🔑 Colors — same per-color block shape as the Add form (color, images,
  // stock OR sizes map), pre-filled from whatever this product already
  // has via colorsArrayToBlocks (handles both the new colors[] schema and
  // legacy single-color documents).
  const [colorBlocks, setColorBlocks] = useState(() => colorsArrayToBlocks(product));
  const [colorErrors, setColorErrors] = useState({});
  const [colorImgUploading, setColorImgUploading] = useState({});
  const [colorImgErrors, setColorImgErrors] = useState({});

  const [submitError, setSubmitError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [uploading, setUploading] = useState({});
  const [uploadErrors, setUploadErrors] = useState({});

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

  const sizeOptions = sizeOptionsFor(form.type, form.category);

  const clearFieldError = (field) =>
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: false } : prev));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    clearFieldError(name);
  };

  // Category/Type together decide the size scale — changing either resets
  // every color's sizes AND stock, since they may no longer be valid for
  // the new combo.
  const resetAllColorSizesAndStock = () =>
    setColorBlocks((prev) => prev.map((c) => ({ ...c, sizes: {}, stock: "" })));

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setForm((prev) => ({ ...prev, category }));
    resetAllColorSizesAndStock();
    clearFieldError("category");
  };

  const handleTypeChange = (e) => {
    const type = e.target.value;
    setForm((prev) => ({ ...prev, type }));
    resetAllColorSizesAndStock();
    clearFieldError("type");
  };

  const handleImageChange = (index, value) => {
    setForm((prev) => {
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
    setForm((prev) => ({ ...prev, images: [...prev.images, ""] }));

  const removeImageField = (index) =>
    setForm((prev) => {
      const images = prev.images.filter((_, i) => i !== index);
      return { ...prev, images: images.length ? images : [""] };
    });

  // ── Color block helpers (same shape/behavior as the Add form) ──

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

  // 🔑 Per-color size toggle-grid helpers (same idea as the Add form).
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

  const colorsUsedElsewhere = (currentIndex) =>
    new Set(
      colorBlocks
        .filter((_, i) => i !== currentIndex)
        .map((c) => c.color)
        .filter(Boolean)
    );

  const totalStock = colorBlocksTotalStock(colorBlocks, sizeOptions);

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = true;
    if (!form.price) errors.price = true;
    if (!form.category) errors.category = true;
    if (!form.type) errors.type = true;
    return errors;
  };

  // Same idea as the Add form: at least one color, and no duplicates.
  const validateColors = () => {
    const errs = {};
    let hasAtLeastOne = false;
    const seen = new Set();

    colorBlocks.forEach((c, i) => {
      if (c.color.trim() === "") return;
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

  const handleSubmit = () => {
    setSubmitError("");

    const errors = validate();
    const { errs: colorErrs, hasAtLeastOne } = validateColors();

    if (!hasAtLeastOne) {
      setFieldErrors(errors);
      setSubmitError("Please add at least one color.");
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

    const payload = {
      name: form.name,
      price: Number(form.price),
      oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
      description: form.description,
      discount: form.discount,
      category: form.category,
      type: form.type,
      status: form.status,
      images: form.images.filter((img) => img.trim() !== ""),
      colors: blocksToColorsArray(colorBlocks, sizeOptions),
      stock: totalStock,
    };

    onSave(payload);
  };

  const baseInput =
    "w-full px-4 py-2.5 rounded-xl border bg-gray-50 text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:bg-white transition";

  const fieldClass = (name) =>
    `${baseInput} ${
      fieldErrors[name]
        ? "border-red-300 ring-2 ring-red-100 focus:ring-red-100"
        : "border-gray-200 focus:ring-gray-300 focus:border-gray-300"
    }`;

  const colorFieldClass = (colorIndex) =>
    `${baseInput} appearance-none pr-9 ${
      colorErrors[colorIndex]
        ? "border-red-300 ring-2 ring-red-100 focus:ring-red-100"
        : "border-gray-200 focus:ring-gray-300 focus:border-gray-300"
    }`;

  const labelClass = "block text-xs font-medium text-gray-500 mb-1.5";
  const Required = () => <span className="text-red-500">*</span>;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4 py-6" onClick={onClose}>
      <div
        className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-4 sm:px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Edit Product</h2>
            <p className="text-xs text-gray-400 mt-0.5">Fields marked with * are required</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 shrink-0" aria-label="Close">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-4 sm:px-6 py-5 space-y-6">

          {/* Basic info */}
          <section className="space-y-4">
            <div>
              <label className={labelClass}>Product Name <Required /></label>
              <input
                ref={nameRef}
                name="name"
                placeholder="e.g. Classic Leather Jacket"
                value={form.name}
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
                  value={form.price}
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
                  value={form.oldPrice}
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
                    value={form.category}
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
                    value={form.type}
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
                    value={form.status}
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
                  value={form.discount}
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
                value={form.description}
                onChange={handleChange}
                className={`${fieldClass("description")} h-24 resize-none`}
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500">Stock preview:</span>
              <StockBadge stock={totalStock} />
            </div>
          </section>

          {/* General Images — fallback for whichever color has no images of its own */}
          <section>
            <label className={labelClass}>General Images</label>
            <p className="text-xs text-gray-400 mb-2">
              Used as a fallback wherever a color below doesn't have its own images.
            </p>
            <div className="space-y-3">
              {form.images.map((img, i) => (
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

                    {form.images.length > 1 && (
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
            <label className={labelClass}>Colors <Required /></label>
            <p className="text-xs text-gray-400 mb-3">
              At least one color is required. Each color has its own photos, and its own
              {sizeOptions ? " size-wise stock." : " stock count."}
            </p>

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
                          className={`${baseInput} w-28 border-gray-200 focus:ring-gray-300 focus:border-gray-300`}
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
                                style={active ? { backgroundColor: PRIMARY, borderColor: PRIMARY } : undefined}
                                className={`h-10 rounded-lg text-sm font-medium border transition ${
                                  active
                                    ? "text-white"
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
                                    className={`${baseInput} flex-1 border-gray-200 focus:ring-gray-300 focus:border-gray-300`}
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
                              className={`${baseInput} flex-1 border-gray-200 focus:ring-gray-300 focus:border-gray-300 py-1.5`}
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

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              style={{ backgroundColor: PRIMARY }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = PRIMARY_HOVER)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = PRIMARY)}
              className="flex-1 py-2.5 rounded-xl text-white transition text-sm font-medium"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Product Card (mobile — replaces table row on small screens) ──
const ProductCard = ({ product, onDelete, onImageClick, onEdit }) => (
  <div className="flex items-center gap-3 p-3 border-b border-gray-100 last:border-0 active:bg-gray-50 transition-colors">
    {product.images?.[0] ? (
      <img
        src={product.images[0]}
        alt={product.name}
        onClick={() => onImageClick(product.images[0], product.name)}
        className="w-12 h-12 object-cover rounded-lg border border-gray-200 cursor-pointer shrink-0"
      />
    ) : (
      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-[10px] shrink-0">
        No img
      </div>
    )}

    <div className="min-w-0 flex-1">
      <p className="font-medium text-gray-900 truncate">{product.name || "—"}</p>
      <p className="text-xs text-gray-400 truncate">{product.category || "—"}</p>
      <div className="flex items-center gap-2 mt-1 flex-wrap">
        <span className="text-sm text-gray-700 font-semibold">
          {product.price ? `Rs. ${Number(product.price).toFixed(2)}` : "—"}
        </span>
        <StockBadge stock={product.stock} />
      </div>
    </div>

    <div className="flex flex-col gap-1 shrink-0">
      <button
        onClick={() => onEdit(product)}
        className="p-2 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        aria-label="Edit product"
      >
        <Pencil className="w-4 h-4" />
      </button>
      <button
        onClick={() => onDelete(product._id)}
        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
        aria-label="Delete product"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  </div>
);

// ── Product Row (desktop — table row, sm+ only) ──
const ProductRow = ({ product, onDelete, onImageClick, onEdit }) => (
  <tr className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            onClick={() => onImageClick(product.images[0], product.name)}
            className="w-10 h-10 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs shrink-0">
            No img
          </div>
        )}
        <span className="font-medium text-gray-900">{product.name || "—"}</span>
      </div>
    </td>
    <td className="px-6 py-4 text-gray-500">{product.category || "—"}</td>
    <td className="px-6 py-4 text-gray-700">
      {product.price ? `Rs. ${Number(product.price).toFixed(2)}` : "—"}
    </td>
    <td className="px-6 py-4">
      <StockBadge stock={product.stock} />
    </td>
    <td className="px-6 py-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onEdit(product)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          aria-label="Edit product"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(product._id)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          aria-label="Delete product"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </td>
  </tr>
);

// ── Main Products Component ──
const Products = () => {
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedName, setSelectedName] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);

  const dispatch = useDispatch();
  const { products = [], loading, error } = useSelector((state) => state.FetchPrducts);

  // 🔑 fetchData ke andar mount-guard condition honi chahiye (jaisa orders
  // slice mein hai) taake tab-switch / remount par dobara fetch na ho —
  // sirf jab product add/edit/delete ho ya guard khud force:true bheje.
  useEffect(() => { dispatch(fetchData()); }, [dispatch]);

  if (showAddProduct) return <FormData onClose={() => setShowAddProduct(false)} />;

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    return p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q);
  });

  const handleDelete = (id) => {
    if (window.confirm("Delete this product?")) dispatch(deleteProductAsync(id));
  };
  const handleImageClick = (img, name) => { setSelectedImage(img); setSelectedName(name); };
  const handleEdit = (product) => setEditingProduct(product);

  // Skeleton dikhta hai sirf jab data abhi tak mount hi nahi hua (loading +
  // list khali). Baad mein background refetch pe purani list screen pe rehti hai.
  const showSkeleton = loading && products.length === 0;

  const renderContent = () => {
    if (showSkeleton) return null; // skeleton list render hoti hai neeche seedha
    if (error) return <ErrorState message={error} />;
    if (filteredProducts.length === 0) return <EmptyState />;
    return null;
  };

  const emptyOrStateContent = renderContent();

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6 overflow-x-hidden">

      <ImageModal
        selectedImage={selectedImage}
        productName={selectedName}
        onClose={() => { setSelectedImage(null); setSelectedName(""); }}
      />

      {editingProduct && (
        <EditModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={(updatedData) => {
            dispatch(editProductAsync({ id: editingProduct._id, updatedData }));
            setEditingProduct(null);
          }}
        />
      )}

      <div className="max-w-7xl mx-auto space-y-3 sm:space-y-6">

        {/* Header bar */}
        <div className="bg-white rounded-2xl shadow-sm sm:shadow-lg p-4 sm:p-6 border border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h1 className="text-lg sm:text-3xl font-bold text-gray-900">Product Management</h1>
          <button
            onClick={() => setShowAddProduct(true)}
            style={{ backgroundColor: PRIMARY }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = PRIMARY_HOVER)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = PRIMARY)}
            className="flex items-center justify-center gap-2 text-white px-5 py-3 sm:py-2.5 rounded-xl transition-colors text-sm sm:text-base w-full sm:w-auto active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>

        {/* Search */}
        <div className="p-3 bg-white rounded-xl border border-gray-100 sticky top-2 z-10 sm:static">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-300 text-sm sm:text-base"
            />
          </div>
        </div>

        {/* ── Mobile: card list (< sm) ── */}
        <div className="sm:hidden bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {showSkeleton ? (
            <CardSkeletonList />
          ) : (
            emptyOrStateContent || filteredProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onDelete={handleDelete}
                onImageClick={handleImageClick}
                onEdit={handleEdit}
              />
            ))
          )}
        </div>

        {/* ── Desktop: table (sm and up) ── */}
        <div className="hidden sm:block bg-white rounded-2xl shadow-lg border border-gray-100 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {["Product", "Category", "Price", "Stock", "Actions"].map((col) => (
                  <th key={col} className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {showSkeleton ? (
                <RowSkeletonList />
              ) : error || filteredProducts.length === 0 ? (
                <tr><td colSpan={5}>{emptyOrStateContent}</td></tr>
              ) : (
                filteredProducts.map((product) => (
                  <ProductRow
                    key={product._id}
                    product={product}
                    onDelete={handleDelete}
                    onImageClick={handleImageClick}
                    onEdit={handleEdit}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default Products;