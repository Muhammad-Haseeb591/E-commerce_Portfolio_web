import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchData } from "../redux_Toolkit/fetcherSlice";
import { addToCart } from "../redux_Toolkit/cartSlice";
import { fetchFavourites, toggleFavourite } from "../redux_Toolkit/Favouriteslice";
import { IoArrowBack, IoStar, IoStarHalf, IoStarOutline } from "react-icons/io5";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import ReviewSection from "../e-Components/Reviewsection";
import { FREE_DELIVERY_THRESHOLD } from "../../../utils/shipping";

const getItemId = (item) => item?._id ?? item?.id;

// ⚠️ CRITICAL — stock field ka naam backend mein consistent nahi tha
// (kabhi `stock`, kabhi `quantity` waghera), isi wajah se "out of stock"
// ghalat show ho raha tha. Ye function stock ke multiple possible field
// names try karta hai. Agar in mein se koi match nahi karta, browser
// console mein `console.log(product)` karke exact field name check karo
// aur yahan neeche wali list mein add kar do.
const getStockValue = (source) => {
  const raw =
    source?.stock ??
    source?.quantity ??
    source?.qty ??
    source?.available ??
    source?.inStock;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
};

// Combined size strings ("40,41,42,43,44") ko individual
// { size, stock } entries mein todta hai, taake har size apna
// selectable option ban sake.
const normalizeSizes = (rawSizes) => {
  if (!Array.isArray(rawSizes)) return [];

  const expanded = [];
  const seen = new Set();

  rawSizes.forEach((entry) => {
    if (!entry?.size) return;

    const sizeParts = String(entry.size)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const rawStock = entry?.stock ?? entry?.quantity ?? entry?.qty ?? entry?.available;
    const stockParts =
      typeof rawStock === "string" && rawStock.includes(",")
        ? rawStock.split(",").map((s) => Number(s.trim()))
        : null;

    sizeParts.forEach((size, i) => {
      if (seen.has(size)) return;
      seen.add(size);
      const stock = stockParts ? stockParts[i] ?? 0 : getStockValue(entry);
      expanded.push({ size, stock: Number.isFinite(stock) ? stock : 0 });
    });
  });

  return expanded;
};

// Color variants ko normalize karta hai. Har entry apni `images` array +
// apna `stock` la sakta hai. `color`/`stock`/`images` field names
// flexible hain (jo bhi backend bheje, us shape mein fit ho jata hai).
const normalizeColors = (rawColors) => {
  if (!Array.isArray(rawColors)) return [];

  const seen = new Set();
  const expanded = [];

  rawColors.forEach((entry) => {
    const colorName =
      typeof entry === "string" ? entry : entry?.color ?? entry?.name ?? entry?.title;
    if (!colorName || seen.has(colorName)) return;
    seen.add(colorName);

    let imgs = entry?.images ?? entry?.image ?? entry?.img ?? [];
    if (!Array.isArray(imgs)) imgs = imgs ? [imgs] : [];
    imgs = imgs.filter(Boolean);

    expanded.push({
      color: colorName,
      images: imgs,
      stock: getStockValue(entry),
      hex: entry?.hex || entry?.code || null, // optional, swatch dot ke liye
    });
  });

  return expanded;
};

// Multicolor jaisi values ke liye gradient support — agar color ka naam
// "Multicolor" hai aur hex nahi diya gaya, to bhi ek default rainbow
// gradient dikha dete hain (text label ab kahin show nahi hota, sirf
// swatch, is liye visually distinguish karna zaroori hai).
const getSwatchStyle = (colorEntry) => {
  if (colorEntry.hex) {
    return colorEntry.hex.startsWith("linear")
      ? { background: colorEntry.hex }
      : { backgroundColor: colorEntry.hex };
  }
  if (String(colorEntry.color).toLowerCase() === "multicolor") {
    return { background: "linear-gradient(135deg, red, orange, yellow, green, blue, violet)" };
  }
  return { background: "#e5e7eb" };
};

const FAKE_NAMES = [
  "Ayesha K.", "Bilal R.", "Sana M.", "Hamza A.", "Zainab T.",
  "Usman F.", "Mahnoor S.", "Ali H.", "Fatima N.", "Talha Q.",
];
const FAKE_COMMENTS = [
  "Great quality, exceeded my expectations.",
  "Perfect fit, and delivery was on time.",
  "Good product, worth the price.",
  "Color was exactly as shown in the picture.",
  "Packaging was solid, product arrived in perfect condition.",
  "Runs a bit small, but otherwise everything is fine.",
  "Will definitely order again, great service.",
  "Good quality material, very comfortable too.",
];

const generateFakeReviews = (seedId) => {
  let seed = 0;
  for (let i = 0; i < String(seedId).length; i++) seed += String(seedId).charCodeAt(i);

  const count = 4 + (seed % 4);
  const reviews = [];
  for (let i = 0; i < count; i++) {
    const nameIdx = (seed + i * 3) % FAKE_NAMES.length;
    const commentIdx = (seed + i * 5) % FAKE_COMMENTS.length;
    const rating = 3 + ((seed + i) % 3);
    reviews.push({
      id: `${seedId}-${i}`,
      name: FAKE_NAMES[nameIdx],
      rating,
      comment: FAKE_COMMENTS[commentIdx],
      daysAgo: 2 + ((seed + i * 7) % 40),
    });
  }
  return reviews;
};

const StarRow = ({ rating, size = "text-sm" }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) stars.push(<IoStar key={i} className={`${size} text-yellow-500`} />);
    else if (rating >= i - 0.5) stars.push(<IoStarHalf key={i} className={`${size} text-yellow-500`} />);
    else stars.push(<IoStarOutline key={i} className={`${size} text-gray-300`} />);
  }
  return <div className="flex items-center gap-0.5">{stars}</div>;
};

const Detail_Page = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const products = useSelector((state) => state.FetchPrducts.products || []);
  const loading = useSelector((state) => state.FetchPrducts.loading);
  const favouriteItems = useSelector((state) => state.favourites.items || []);
  const favouriteLoading = useSelector((state) => state.favourites.loading);

  const [selectedImage, setSelectedImage] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);

  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedSizes, setSelectedSizes] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [pulsingSize, setPulsingSize] = useState(null);
  const [qtyPulsing, setQtyPulsing] = useState(false);

  useEffect(() => {
    if (!products || products.length === 0) {
      dispatch(fetchData());
    }
  }, [dispatch, products.length]);

  useEffect(() => {
    dispatch(fetchFavourites());
  }, [dispatch]);

  const product = useMemo(
    () => products.find((p) => getItemId(p) === id),
    [products, id]
  );

  useEffect(() => {
    setSelectedImage(0);
    setSelectedColorIndex(0);
    setSelectedSizes({});
    setQuantity(1);
    setAdded(false);
    setImgLoaded(false);
  }, [id]);

  const reviews = useMemo(() => generateFakeReviews(id), [id]);
  const avgRating = useMemo(
    () => (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1),
    [reviews]
  );

  const isFavourite = useMemo(
    () => favouriteItems.some((item) => getItemId(item) === id),
    [favouriteItems, id]
  );

  const colorList = useMemo(() => normalizeColors(product?.colors), [product]);
  const hasColors = colorList.length > 0;
  const allColorsOutOfStock = hasColors && colorList.every((c) => c.stock === 0);
  const selectedColorData = hasColors ? colorList[selectedColorIndex] || colorList[0] : null;

  const images = hasColors && selectedColorData?.images?.length
    ? selectedColorData.images
    : product?.images?.length
    ? product.images
    : [""];

  const sizeList = useMemo(() => normalizeSizes(product?.sizes), [product]);
  const hasSizes = sizeList.length > 0;
  const allSizesOutOfStock = hasSizes && sizeList.every((s) => s.stock === 0);
  const inStockSizes = sizeList.filter((s) => s.stock > 0);
  const outOfStockSizes = sizeList.filter((s) => s.stock === 0);

  const productStock = hasColors
    ? Number(selectedColorData?.stock) || 0
    : getStockValue(product);
  const productOutOfStock = !hasSizes && productStock <= 0;
  const remainingProductStock = Math.max(0, productStock - quantity);

  const totalSelectedQty = useMemo(
    () => Object.values(selectedSizes).reduce((sum, q) => sum + (Number(q) || 0), 0),
    [selectedSizes]
  );

  const effectiveQuantity = hasSizes ? totalSelectedQty : quantity;
  const itemTotal = product ? Number(product.price) * (effectiveQuantity || 0) : 0;
  const isFreeDelivery = itemTotal >= FREE_DELIVERY_THRESHOLD;
  const amountLeftForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - itemTotal);

  const getRemainingStock = (size, stock) => {
    const taken = selectedSizes[size] || 0;
    return Math.max(0, stock - taken);
  };

  const triggerPulse = (size) => {
    setPulsingSize(size);
    setTimeout(() => {
      setPulsingSize((current) => (current === size ? null : current));
    }, 280);
  };

  const selectColor = (index, stock) => {
    if (stock === 0) return;
    setSelectedColorIndex(index);
    setSelectedImage(0);
    setImgLoaded(false);
    setQuantity(1);
  };

  const toggleSize = (size, stock) => {
    if (stock === 0) return;
    setSelectedSizes((prev) => {
      const next = { ...prev };
      if (size in next) {
        delete next[size];
      } else {
        next[size] = 1;
      }
      return next;
    });
    triggerPulse(size);
  };

  const setSizeQuantity = (size, qty, stock) => {
    const requested = Number(qty) || 1;

    if (requested > stock) {
      alert(`Quantity is out of stock for size ${size}. Only ${stock} available.`);
      setSelectedSizes((prev) => ({ ...prev, [size]: stock > 0 ? stock : 1 }));
      triggerPulse(size);
      return;
    }

    const clamped = Math.max(1, Math.min(requested, stock || 1));
    setSelectedSizes((prev) => ({ ...prev, [size]: clamped }));
    triggerPulse(size);
  };

  const handleAddToCart = useCallback(() => {
    if (hasColors && allColorsOutOfStock) {
      alert("This product is out of stock in all colors.");
      return;
    }

    if (hasSizes && Object.keys(selectedSizes).length === 0) {
      alert("Please select at least one size.");
      return;
    }

    if (!hasSizes && productOutOfStock) {
      alert(
        hasColors
          ? `Quantity is out of stock for color ${selectedColorData?.color}.`
          : "Quantity is out of stock."
      );
      return;
    }

    const color = hasColors ? selectedColorData?.color : undefined;

    if (hasSizes) {
      Object.entries(selectedSizes).forEach(([size, qty]) => {
        const stock = sizeList.find((s) => s.size === size)?.stock;
        dispatch(addToCart({ product, size, quantity: qty, stock, color }));
      });
    } else {
      dispatch(addToCart({ product, size: null, quantity, stock: productStock, color }));
    }

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }, [
    hasSizes,
    hasColors,
    allColorsOutOfStock,
    selectedColorData,
    selectedSizes,
    product,
    quantity,
    productOutOfStock,
    productStock,
    sizeList,
    dispatch,
  ]);

  const handleToggleFavourite = useCallback(() => {
    const wasAlreadyFavourite = isFavourite;
    dispatch(toggleFavourite(getItemId(product)));
    if (!wasAlreadyFavourite) {
      alert("Favourite added successfully");
    }
  }, [isFavourite, dispatch, product]);

  const decreaseQty = useCallback(() => {
    setQuantity((q) => Math.max(1, q - 1));
    setQtyPulsing(true);
    setTimeout(() => setQtyPulsing(false), 280);
  }, []);

  const increaseQty = useCallback(() => {
    setQuantity((q) => {
      if (q + 1 > productStock) {
        alert(`Quantity is out of stock. Only ${productStock} available.`);
        return productStock > 0 ? productStock : 1;
      }
      return q + 1;
    });
    setQtyPulsing(true);
    setTimeout(() => setQtyPulsing(false), 280);
  }, [productStock]);

  if (loading && !product) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-gray-500 text-sm text-center">Product not found.</p>
        <button
          onClick={() => navigate("/")}
          className="bg-[#333333] text-white px-6 py-3 rounded-xl text-sm font-semibold"
        >
          Go to Home
        </button>
      </div>
    );
  }

  const addToCartDisabled =
    allSizesOutOfStock ||
    allColorsOutOfStock ||
    productOutOfStock ||
    (hasSizes && totalSelectedQty === 0);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-[30px] py-4 sm:py-6 font-sans pb-28 sm:pb-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#333333] mb-4 sm:mb-6"
      >
        <IoArrowBack className="size-4" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
        {/* ── Images ──
            🔑 COVER MODE: container ki height fixed hai per breakpoint,
            image object-cover se box ko PURA bharti hai (crop ho sakta
            hai agar image ka aspect-ratio box se match na kare, letterbox
            nahi hoga). ── */}
        <div>
          <div className="relative w-full h-[320px] sm:h-[420px] lg:h-[480px] bg-[#ececec] rounded-xl overflow-hidden">
            {images[selectedImage] ? (
              <img
                key={images[selectedImage]}
                src={images[selectedImage]}
                alt={product.name}
                onLoad={() => setImgLoaded(true)}
                className={`w-full h-full object-cover transition-opacity duration-200 ${
                  imgLoaded ? "opacity-100" : "opacity-0"
                }`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gray-400 text-sm">No image</span>
              </div>
            )}

            <button
              onClick={handleToggleFavourite}
              disabled={favouriteLoading}
              aria-label={isFavourite ? "Remove from wishlist" : "Add to wishlist"}
              className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-md active:scale-95 transition disabled:opacity-60"
            >
              {isFavourite ? (
                <FaHeart className="text-red-500 text-lg" />
              ) : (
                <FaRegHeart className="text-[#333333] text-lg" />
              )}
            </button>

            {images.length > 1 && (
              <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                {selectedImage + 1} / {images.length}
              </span>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedImage(i);
                    setImgLoaded(false);
                  }}
                  className={`w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-lg overflow-hidden border-2 snap-start bg-[#ececec] transition ${
                    selectedImage === i ? "border-[#333333]" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Info ── */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#333333]">{product.name}</h1>

          <div className="flex items-center gap-2 mt-2">
            <StarRow rating={Number(avgRating)} />
            <span className="text-sm text-gray-500">
              {avgRating} ({reviews.length} reviews)
            </span>
          </div>

          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <p className="text-xl font-semibold text-red-700">Rs. {product.price}</p>
            {product.oldPrice ? (
              <del className="text-gray-400">Rs. {product.oldPrice}</del>
            ) : null}
            {product.discount && (
              <span className="bg-[#cc0000] text-white text-xs px-2 py-1 rounded">
                {product.discount}
              </span>
            )}
          </div>

          <div
            className={`mt-3 text-sm font-medium rounded-lg px-3 py-2 inline-block ${
              isFreeDelivery ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
            }`}
          >
            {isFreeDelivery
              ? "🎉 You've unlocked free delivery on this quantity!"
              : `Add Rs. ${amountLeftForFreeDelivery.toFixed(0)} more to unlock FREE delivery`}
          </div>

          {/* ── Colors (only if product has colors) —
              🔑 SWATCH ONLY, no text label next to it. ── */}
          {hasColors ? (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-[#333333]">
                  Color:{" "}
                  <span className="font-normal text-gray-500">
                    {selectedColorData?.color}
                  </span>
                </p>
                {allColorsOutOfStock && (
                  <span className="text-xs text-red-600 font-medium">Out of stock</span>
                )}
              </div>

              <div className="flex flex-wrap gap-2.5">
                {colorList.map((c, i) => {
                  const outOfStock = c.stock === 0;
                  const isSelected = selectedColorIndex === i;
                  const isWhite = String(c.color).toLowerCase() === "white";
                  return (
                    <button
                      key={c.color}
                      type="button"
                      disabled={outOfStock}
                      onClick={() => selectColor(i, c.stock)}
                      title={outOfStock ? `${c.color} — Out of stock` : c.color}
                      className={`w-[30px] h-[30px] rounded-full flex items-center justify-center transition-all duration-200 shrink-0 ${
                        isSelected
                          ? "ring-2 ring-black ring-offset-2"
                          : "ring-1 ring-gray-200 ring-offset-1 hover:ring-gray-400"
                      } ${outOfStock ? "opacity-40 cursor-not-allowed" : ""}`}
                      style={getSwatchStyle(c)}
                    >
                      {isSelected && !outOfStock && (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke={isWhite ? "black" : "white"}
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            product.color && (
              <p className="text-sm text-gray-500 mt-4">
                Color: <span className="text-[#333333] font-medium">{product.color}</span>
              </p>
            )
          )}

          {/* ── Sizes (only if product has sizes) — MULTI-select ── */}
          {hasSizes && (
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-[#333333]">
                  Sizes{" "}
                  <span className="font-normal text-gray-500">
                    (tap to select, choose as many as you like)
                  </span>
                </p>
                {allSizesOutOfStock && (
                  <span className="text-xs text-red-600 font-medium">Out of stock</span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {sizeList.map((s) => {
                  const outOfStock = s.stock === 0;
                  const isSelected = s.size in selectedSizes;
                  return (
                    <button
                      key={s.size}
                      type="button"
                      disabled={outOfStock}
                      onClick={() => toggleSize(s.size, s.stock)}
                      title={outOfStock ? "Out of stock" : `${s.stock} in stock`}
                      className={`min-w-[3rem] px-4 py-2 rounded-lg border text-sm font-medium transition ${
                        isSelected
                          ? "bg-[#333333] text-white border-[#333333]"
                          : "border-gray-300 text-[#333333] hover:border-[#333333]"
                      } ${outOfStock ? "opacity-40 cursor-not-allowed line-through" : ""}`}
                    >
                      {s.size}
                    </button>
                  );
                })}
              </div>

              {Object.keys(selectedSizes).length > 0 && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(selectedSizes)
                    .sort((a, b) => (isNaN(a[0]) || isNaN(b[0]) ? 0 : Number(a[0]) - Number(b[0])))
                    .map(([size, qty]) => {
                      const stock = sizeList.find((s) => s.size === size)?.stock ?? 0;
                      const remaining = getRemainingStock(size, stock);
                      const isPulsing = pulsingSize === size;
                      return (
                        <div
                          key={size}
                          className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2"
                        >
                          <span className="w-14 shrink-0 text-sm font-medium text-gray-700">
                            Size {size}
                          </span>
                          <div className="flex items-center border border-gray-300 rounded-lg shrink-0">
                            <button
                              type="button"
                              onClick={() => setSizeQuantity(size, qty - 1, stock)}
                              aria-label={`Decrease quantity for size ${size}`}
                              className="w-7 h-7 flex items-center justify-center text-base"
                            >
                              −
                            </button>
                            <span className="w-6 text-center text-sm">{qty}</span>
                            <button
                              type="button"
                              onClick={() => setSizeQuantity(size, qty + 1, stock)}
                              aria-label={`Increase quantity for size ${size}`}
                              className="w-7 h-7 flex items-center justify-center text-base"
                            >
                              +
                            </button>
                          </div>
                          <span
                            className={`text-xs font-semibold ml-auto shrink-0 transition-transform duration-300 ease-out inline-block ${
                              isPulsing ? "scale-125" : "scale-100"
                            } ${
                              remaining === 0
                                ? "text-red-500"
                                : remaining <= 5
                                ? "text-orange-500"
                                : "text-green-600"
                            }`}
                          >
                            {remaining} left
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleSize(size, stock)}
                            aria-label={`Remove size ${size}`}
                            className="text-gray-400 hover:text-red-500 text-lg leading-none px-1 shrink-0"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                </div>
              )}

              <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                  <p className="text-xs font-semibold text-gray-600">Stock per size</p>
                </div>
                <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 gap-px bg-gray-100">
                  {sizeList.map((s) => {
                    const remaining = getRemainingStock(s.size, s.stock);
                    const isPulsing = pulsingSize === s.size;
                    return (
                      <div
                        key={s.size}
                        className="bg-white px-2 py-2 flex flex-col items-center"
                      >
                        <span className="text-sm font-semibold text-[#333333]">{s.size}</span>
                        <span
                          className={`text-xs mt-0.5 inline-block transition-transform duration-300 ease-out ${
                            isPulsing ? "scale-125" : "scale-100"
                          } ${
                            remaining === 0
                              ? "text-red-500"
                              : remaining <= 5
                              ? "text-orange-500"
                              : "text-green-600"
                          }`}
                        >
                          {remaining === 0 ? "Out" : `${remaining} left`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-2">
                In stock sizes: {inStockSizes.length} · Out of stock: {outOfStockSizes.length}
              </p>
            </div>
          )}

          {/* ── Quantity stepper — only for products WITHOUT sizes ── */}
          {!hasSizes && (
            <div className="mt-5">
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-[#333333]">Quantity</p>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={decreaseQty}
                    disabled={productOutOfStock}
                    aria-label="Decrease quantity"
                    className="w-9 h-9 flex items-center justify-center text-lg disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    −
                  </button>
                  <span className="w-8 text-center">{quantity}</span>
                  <button
                    onClick={increaseQty}
                    disabled={productOutOfStock}
                    aria-label="Increase quantity"
                    className="w-9 h-9 flex items-center justify-center text-lg disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
                <span
                  className={`text-xs font-semibold transition-transform duration-300 ease-out inline-block ${
                    qtyPulsing ? "scale-125" : "scale-100"
                  } ${
                    remainingProductStock === 0
                      ? "text-red-500"
                      : remainingProductStock <= 5
                      ? "text-orange-500"
                      : "text-green-600"
                  }`}
                >
                  {remainingProductStock === 0 ? "Out of stock" : `${remainingProductStock} left`}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleAddToCart}
            disabled={addToCartDisabled}
            className="hidden sm:block w-full mt-6 bg-[#333333] hover:bg-[#1f1f1f] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition"
          >
            {added
              ? "Added to cart ✓"
              : hasSizes && totalSelectedQty > 0
              ? `Add to Cart (${totalSelectedQty})`
              : "Add to Cart"}
          </button>

          <Link
            to="/cart"
            className="block text-center text-sm text-gray-500 hover:text-[#333333] mt-3 underline underline-offset-4"
          >
            View Cart
          </Link>
        </div>
      </div>

      {/* ── Product Details ── */}
      {product.description && (
        <section className="mt-10 lg:mt-14 border-t border-gray-200 pt-6 lg:pt-8">
          <h2 className="text-lg sm:text-xl font-bold text-[#333333] mb-3">Product Details</h2>
          <p className="text-gray-600 leading-relaxed text-sm sm:text-base whitespace-pre-line">
            {product.description}
          </p>
        </section>
      )}

      {/* ── Reviews ── */}
      <section className="mt-10 lg:mt-14 border-t border-gray-200 pt-6 lg:pt-8">
        <ReviewSection productId={getItemId(product)} />
      </section>

      {/* ── Fixed bottom action bar — mobile only ── */}
      <div
        className="sm:hidden fixed inset-x-0 bottom-0 z-30 bg-white/95 backdrop-blur border-t border-gray-200 px-4 pt-3 flex gap-3"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <button
          onClick={handleAddToCart}
          disabled={addToCartDisabled}
          className="flex-1 bg-[#333333] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all text-sm"
        >
          {added
            ? "Added ✓"
            : hasSizes && totalSelectedQty > 0
            ? `Add to Cart (${totalSelectedQty}) · Rs. ${itemTotal}`
            : `Add to Cart · Rs. ${product.price}`}
        </button>
      </div>
    </div>
  );
};

export default Detail_Page;