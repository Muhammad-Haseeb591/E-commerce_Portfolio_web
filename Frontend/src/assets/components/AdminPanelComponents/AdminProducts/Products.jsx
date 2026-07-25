import { useState, useRef, useEffect } from "react";
import {
  Plus, Search, Trash2, AlertCircle, PackageX, X, Pencil,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchData, deleteProductAsync, editProductAsync } from "../../redux_Toolkit/fetcherSlice";
import FormData from "../../AdminPanelComponents/AdminFormComponents/FormData";
import StockBadge from "../AdminProducts/StockBadge";
import {
  uploadToCloudinary,
  sizeOptionsFor,
  colorsArrayToBlocks,
  blocksToColorsArray,
  colorBlocksTotalStock,
} from "../../AdminPanelComponents/AdminFormComponents/Productformhelpers";
import useColorBlocks from "./useColorBlocks";
import BasicInfoFields from "./BasicInfoFields";
import ColorsSection from "./ColorsSection";

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

  // 🔑 Pre-fill straight from the DB product — colorsArrayToBlocks handles
  // both the new colors[] schema and legacy single-color documents, so
  // opening Edit on ANY existing product shows its real saved
  // color/images/stock (or size grid) already selected.
  const {
    colorBlocks,
    colorErrors,
    colorImgUploading,
    colorImgErrors,
    addColorBlock,
    removeColorBlock,
    updateColorField,
    handleColorImageChange,
    addColorImageField,
    removeColorImageField,
    handleColorFileSelect,
    toggleColorSize,
    setColorSizeQuantity,
    resetAllColorSizesAndStock,
    colorsUsedElsewhere,
    validateColors,
    isAnyColorImageUploading,
  } = useColorBlocks(colorsArrayToBlocks(product));

  const [submitError, setSubmitError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [uploading, setUploading] = useState({});
  const [uploadErrors, setUploadErrors] = useState({});

  const nameRef = useRef(null);
  const priceRef = useRef(null);
  const categoryRef = useRef(null);
  const typeRef = useRef(null);
  const fieldRefs = { name: nameRef, price: priceRef, category: categoryRef, type: typeRef };

  const sizeOptions = sizeOptionsFor(form.type, form.category);

  const clearFieldError = (field) =>
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: false } : prev));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    clearFieldError(name);
  };

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

  const totalStock = colorBlocksTotalStock(colorBlocks, sizeOptions);

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = true;
    if (!form.price) errors.price = true;
    if (!form.category) errors.category = true;
    if (!form.type) errors.type = true;
    return errors;
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
    const { hasAtLeastOne, hasDuplicates } = validateColors();

    if (!hasAtLeastOne) {
      setFieldErrors(errors);
      setSubmitError("Please add at least one color.");
      return;
    }

    if (Object.keys(errors).length > 0 || hasDuplicates) {
      setFieldErrors(errors);
      focusFirstError(errors);
      setSubmitError(
        hasDuplicates
          ? "Duplicate colors selected — each color can only be added once."
          : "Please fill in the highlighted required fields."
      );
      return;
    }

    if (Object.values(uploading).some(Boolean) || isAnyColorImageUploading()) {
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
          <BasicInfoFields
            values={form}
            fieldErrors={fieldErrors}
            onChange={handleChange}
            onCategoryChange={handleCategoryChange}
            onTypeChange={handleTypeChange}
            refs={fieldRefs}
            stockBadge={<StockBadge stock={totalStock} />}
          />
          <ColorsSection
            colorBlocks={colorBlocks}
            colorErrors={colorErrors}
            sizeOptions={sizeOptions}
            colorImgUploading={colorImgUploading}
            colorImgErrors={colorImgErrors}
            colorsUsedElsewhere={colorsUsedElsewhere}
            onUpdateField={updateColorField}
            onRemoveBlock={removeColorBlock}
            onAddBlock={addColorBlock}
            onImageChange={handleColorImageChange}
            onFileSelect={handleColorFileSelect}
            onAddImageField={addColorImageField}
            onRemoveImageField={removeColorImageField}
            onToggleSize={toggleColorSize}
            onSetSizeQty={setColorSizeQuantity}
            totalStock={totalStock}
            accentColor={PRIMARY}
          />

          {submitError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {submitError}
            </p>
          )}

          {/* Mobile-first: stacked full-width buttons on phones, side by
              side from sm+ (Cancel/Save were already a 50/50 row — kept,
              since that already reads fine down to small phone widths). */}
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