import React, { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X } from "lucide-react";
import { API_URL } from "../../../../config/api";
// 🔑 Path yahan Filter.jsx ke import se match karayi gayi hai
// ("../redux_Toolkit/fetcherSlice"). Agar ProductForm kisi aur folder
// depth par hai to is path ko apne project ke hisaab se adjust kar lena.
import { fetchData } from "../../redux_Toolkit/fetcherSlice";
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
} from "../AdminFormComponents/Productformhelpers";

import BasicInfoFields from "./BasicInfoFields";
import GeneralImages from "./GeneralImages";
import ColorsSection from "./ColorsSection";

// 🔑 emptyColorBlock() (from Productformhelpers) now stamps every color
// block with a permanent `id` the moment it's created. This is the core
// fconst createColorBlock = () => emptyColorBlock();
 
const generateProductId = () => {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `PRD-${Date.now().toString(36).toUpperCase()}-${rand}`;
};
 
// 🔑 onProductAdded: optional callback for the parent — call it if the
// parent wants to force a hard remount of the product page (e.g. via a
// `key` bump) instead of / in addition to the redux refetch below.
const ProductForm = ({ onClose, onProductAdded }) => {
  const dispatch = useDispatch();
  // Same slice key Filter.jsx reads from ("state.FetchPrducts"), so the
  // refetch below respects whatever filters/page the user currently has.
  const { filters } = useSelector((state) => state.FetchPrducts);
 
  const [productId, setProductId] = useState(() => generateProductId());
 
  const [product, setProduct] = useState({
    name: "",
    price: "",
    oldPrice: "",
    description: "",
    image: "",
    discount: "",
    rating: 0,
    category: "",
    type: "",
    status: "active",
  });
 
  const [colorBlocks, setColorBlocks] = useState([createColorBlock()]);
 
  const [submitError, setSubmitError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [colorErrors, setColorErrors] = useState({}); // { [blockId]: true }
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
 
  // 🔑 Keyed by block id (not "colorIndex-imageIndex" anymore, since
  // each color now has just one image).
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
    setColorBlocks((prev) => prev.map((b) => ({ ...b, sizes: {}, stock: "" })));
 
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
 
  const handleImageChange = (value) => {
    setProduct((prev) => ({ ...prev, image: value }));
  };
 
  const handleFileSelect = async (file) => {
    if (!file) return;
 
    setUploading(true);
    setUploadError("");
 
    try {
      const url = await uploadToCloudinary(file);
      handleImageChange(url);
    } catch (err) {
      console.error(err);
      setUploadError(err.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };
 
  // ── Color block helpers — all id-based, see makeColorBlockId note above ──
 
  const addColorBlock = () => setColorBlocks((prev) => [...prev, createColorBlock()]);
 
  const removeColorBlock = (id) =>
    setColorBlocks((prev) => {
      const next = prev.filter((b) => b.id !== id);
      return next.length ? next : [createColorBlock()];
    });
 
  const updateColorField = (id, field, value) => {
    setColorBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, [field]: value } : b)));
    setColorErrors((prev) => (prev[id] ? { ...prev, [id]: false } : prev));
  };
 
  // 🔑 Single image per color. Looked up and updated strictly by block
  // id, so an upload started before a reorder/removal can never write
  // into a different color block.
  const handleColorImageChange = (id, value) => {
    setColorBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, image: value } : b))
    );
  };
 
  const handleColorFileSelect = async (id, file) => {
    if (!file) return;
 
    setColorImgUploading((prev) => ({ ...prev, [id]: true }));
    setColorImgErrors((prev) => ({ ...prev, [id]: "" }));
 
    try {
      const url = await uploadToCloudinary(file);
      setColorBlocks((prev) =>
        prev.map((b) => (b.id === id ? { ...b, image: url } : b))
      );
    } catch (err) {
      console.error(err);
      setColorImgErrors((prev) => ({
        ...prev,
        [id]: err.message || "Upload failed. Please try again.",
      }));
    } finally {
      setColorImgUploading((prev) => ({ ...prev, [id]: false }));
    }
  };
 
  // 🔑 Per-color size toggle-grid. Toggling a size on seeds a quantity
  // of 1 for THAT color only — other colors' size maps are untouched.
  const toggleColorSize = (id, size) => {
    setColorBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const sizes = { ...b.sizes };
        if (size in sizes) {
          delete sizes[size];
        } else {
          sizes[size] = 1;
        }
        return { ...b, sizes };
      })
    );
  };
 
  const setColorSizeQuantity = (id, size, qty) =>
    setColorBlocks((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, sizes: { ...b.sizes, [size]: qty } } : b
      )
    );
 
  // Colors actually worth saving = ones where a color name was picked.
  // A block left fully empty (user clicked "Add Color" but didn't fill it)
  // is silently dropped rather than causing a validation error.
  const filledColorBlocks = colorBlocks.filter((b) => b.color.trim() !== "");
 
  const totalStock = colorBlocksTotalStock(filledColorBlocks, sizeOptions);
 
  const validate = () => {
    const errors = {};
    if (!productId.trim()) errors.productId = true;
    if (!product.name.trim()) errors.name = true;
    if (!product.price) errors.price = true;
    if (!product.category) errors.category = true;
    if (!product.type) errors.type = true;
    return errors;
  };
 
  // 🔑 Color validation is separate from the rest since it's a list, not a
  // single field: at least one color must be picked, and no two blocks can
  // share the same color. Keyed by block id.
  const validateColors = () => {
    const errs = {};
    let hasAtLeastOne = false;
    const seen = new Set();
 
    colorBlocks.forEach((b) => {
      if (b.color.trim() === "") return; // ignore untouched blocks
      hasAtLeastOne = true;
      if (seen.has(b.color)) errs[b.id] = true;
      seen.add(b.color);
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
 
    if (uploading || Object.values(colorImgUploading).some(Boolean)) {
      setSubmitError("An image is still uploading, please wait.");
      return;
    }
 
    // 🔑 Each filled color carries its OWN sizes (when a size scale
    // applies) or its own plain stock number (when it doesn't), and its
    // own single image.
    const cleanedColors = blocksToColorsArray(filledColorBlocks, sizeOptions);
 
    const payload = {
      productId,
      name: product.name,
      price: Number(product.price),
      oldPrice: product.oldPrice ? Number(product.oldPrice) : null,
      description: product.description,
      discount: product.discount,
      rating: product.rating,
      category: product.category,
      type: product.type,
      status: product.status,
      image: product.image.trim(),
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
 
  const colorFieldClass = (hasError) =>
    `${baseInput} appearance-none pr-9 ${
      hasError
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
          <BasicInfoFields
            product={product}
            productId={productId}
            onProductIdChange={setProductId}
            handleChange={handleChange}
            handleCategoryChange={handleCategoryChange}
            handleTypeChange={handleTypeChange}
            fieldClass={fieldClass}
            labelClass={labelClass}
            Required={Required}
            refs={fieldRefs}
            CATEGORY_OPTIONS={CATEGORY_OPTIONS}
            TYPE_OPTIONS={TYPE_OPTIONS}
          />
 
          <GeneralImages
            image={product.image}
            uploading={uploading}
            uploadError={uploadError}
            onImageChange={handleImageChange}
            onFileSelect={handleFileSelect}
            fieldClass={fieldClass}
          />
 
          <ColorsSection
            colorBlocks={colorBlocks}
            colorErrors={colorErrors}
            sizeOptions={sizeOptions}
            hasCategoryAndType={!!product.type && !!product.category}
            totalStock={totalStock}
            COLOR_OPTIONS={COLOR_OPTIONS}
            colorBlockStock={colorBlockStock}
            swatchStyle={swatchStyle}
            colorFieldClass={colorFieldClass}
            baseInput={baseInput}
            colorImgUploading={colorImgUploading}
            colorImgErrors={colorImgErrors}
            onAddColorBlock={addColorBlock}
            onUpdateColorField={updateColorField}
            onRemoveColorBlock={removeColorBlock}
            onToggleSize={toggleColorSize}
            onSetSizeQty={setColorSizeQuantity}
            onColorImageChange={handleColorImageChange}
            onColorFileSelect={handleColorFileSelect}
          />
 
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