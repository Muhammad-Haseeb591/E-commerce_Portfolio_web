import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchData } from "../redux_Toolkit/fetcherSlice";
import { addToCart } from "../redux_Toolkit/cartSlice";
import { fetchFavourites, toggleFavourite } from "../redux_Toolkit/Favouriteslice";
import { IoArrowBack, IoStar, IoStarHalf, IoStarOutline } from "react-icons/io5";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import ReviewSection from "../e-Components/Reviewsection";
import { FREE_DELIVERY_THRESHOLD } from "../utils/shipping";

const getItemId = (item) => item?._id ?? item?.id;

// Detail_Page.jsx — top imports me add karo

// Some products come with combined size strings like "40,41,42,43,44"
// on a single entry (optionally with a matching comma-separated stock string).
// This expands that into individual { size, stock } entries so each size
// renders and behaves as its own selectable option.
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

    const stockParts =
      typeof entry.stock === "string" && entry.stock.includes(",")
        ? entry.stock.split(",").map((s) => Number(s.trim()))
        : null;

    sizeParts.forEach((size, i) => {
      if (seen.has(size)) return;
      seen.add(size);
      const stock = stockParts ? stockParts[i] ?? 0 : Number(entry.stock ?? 0);
      expanded.push({ size, stock: Number.isFinite(stock) ? stock : 0 });
    });
  });

  return expanded;
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

  // 🔑 Multi-size selection: { "40": 2, "42": 1 } — key = size, value = qty
  // chosen for that size. Replaces the old single `selectedSize` string so
  // more than one size can be added to cart in the same "Add to Cart" click.
  const [selectedSizes, setSelectedSizes] = useState({});

  // Quantity stepper only used for products that DON'T have sizes at all.
  const [quantity, setQuantity] = useState(1);

  const [added, setAdded] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  // 🔑 Tracks which size's remaining-stock number should "pop" right now.
  // Set true for a size when its selected qty changes, cleared shortly after —
  // drives the scale/color pulse animation on the stock display.
  const [pulsingSize, setPulsingSize] = useState(null);

  // Same pulse idea, but for the plain quantity stepper on non-sized products.
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

  const images = product?.images?.length ? product.images : [""];
  const sizeList = useMemo(() => normalizeSizes(product?.sizes), [product]);
  const hasSizes = sizeList.length > 0;
  const allSizesOutOfStock = hasSizes && sizeList.every((s) => s.stock === 0);
  const inStockSizes = sizeList.filter((s) => s.stock > 0);
  const outOfStockSizes = sizeList.filter((s) => s.stock === 0);

  // Live stock for products that DON'T use sizes — same "stock going up/down"
  // idea as the per-size steppers above, just against product.stock directly.
  const productStock = Number(product?.stock) || 0;
  const productOutOfStock = !hasSizes && productStock <= 0;
  const remainingProductStock = Math.max(0, productStock - quantity);

  // Total pieces selected across all chosen sizes (used for the price preview
  // and to know whether the Add to Cart button should be enabled).
  const totalSelectedQty = useMemo(
    () => Object.values(selectedSizes).reduce((sum, q) => sum + (Number(q) || 0), 0),
    [selectedSizes]
  );

  const effectiveQuantity = hasSizes ? totalSelectedQty : quantity;
  const itemTotal = product ? Number(product.price) * (effectiveQuantity || 0) : 0;
  const isFreeDelivery = itemTotal >= FREE_DELIVERY_THRESHOLD;
  const amountLeftForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - itemTotal);

  // Live "left in stock" for a size = its original stock minus whatever
  // quantity is currently selected for it. Plus button → this goes down.
  // Minus button (or deselecting) → this goes back up.
  const getRemainingStock = (size, stock) => {
    const taken = selectedSizes[size] || 0;
    return Math.max(0, stock - taken);
  };

  // Briefly flags a size as "pulsing" so its remaining-stock number animates
  // (pop + color flash) every time the selected quantity changes.
  const triggerPulse = (size) => {
    setPulsingSize(size);
    setTimeout(() => {
      setPulsingSize((current) => (current === size ? null : current));
    }, 280);
  };

  // Toggle a size on/off. Turning it on seeds a quantity of 1 (capped to
  // whatever stock is actually available for that size).
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

    // 🔑 Trying to go above what's actually in stock → alert instead of
    // silently capping it, so the user knows exactly why it stopped.
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
    if (hasSizes && Object.keys(selectedSizes).length === 0) {
      alert("Please select at least one size.");
      return;
    }

    if (!hasSizes && productOutOfStock) {
      alert("Quantity is out of stock.");
      return;
    }

    // 🔑 Merging by product+size lives INSIDE the cartSlice reducer (single
    // source of truth — Cart page's +/- buttons use the exact same
    // reducer). We dispatch one addToCart call per selected size; the
    // reducer guarantees each (productId, size) pair only ever has one line.
    //
    // 🔧 We also pass `stock` explicitly here — sizeList is already the
    // NORMALIZED, split-out size list (see normalizeSizes above), so its
    // stock numbers are correct per individual size. If we didn't pass it,
    // the reducer would have to re-derive stock from the raw product.sizes,
    // which may still contain the original combined "40,41,42" string and
    // wouldn't match — passing it directly avoids that mismatch entirely.
    if (hasSizes) {
      Object.entries(selectedSizes).forEach(([size, qty]) => {
        const stock = sizeList.find((s) => s.size === size)?.stock;
        dispatch(addToCart({ product, size, quantity: qty, stock }));
      });
    } else {
      dispatch(addToCart({ product, size: null, quantity, stock: productStock }));
    }

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }, [hasSizes, selectedSizes, product, quantity, productOutOfStock, productStock, sizeList, dispatch]);

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
    allSizesOutOfStock || productOutOfStock || (hasSizes && totalSelectedQty === 0);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-[30px] py-4 sm:py-6 font-sans pb-28 sm:pb-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#333333] mb-4 sm:mb-6"
      >
        <IoArrowBack className="size-4" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
        {/* ── Images ── */}
        <div>
          <div className="relative w-full aspect-square max-w-[480px] mx-auto lg:max-w-none bg-[#ececec] rounded-xl overflow-hidden">
            {images[selectedImage] ? (
              <img
                key={images[selectedImage]}
                src={images[selectedImage]}
                alt={product.name}
                onLoad={() => setImgLoaded(true)}
                className={`w-full h-full object-contain transition-opacity duration-200 ${
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
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1 max-w-[480px] mx-auto lg:max-w-none snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
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

          {product.color && (
            <p className="text-sm text-gray-500 mt-4">
              Color: <span className="text-[#333333] font-medium">{product.color}</span>
            </p>
          )}

          {/* ── Sizes (only if product has sizes) — MULTI-select now, each
               chosen size gets its own quantity stepper ── */}
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

              {/* Per-size quantity steppers for whichever sizes are selected */}
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
                          {/* Live remaining stock — shrinks on +, grows back on −,
                              with a quick pop + color flash each time it changes. */}
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

              {/* ── Stock table — every size with its available stock ── */}
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

          {/* ── Quantity stepper — only shown for products WITHOUT sizes,
               since sized products get a quantity per size above ── */}
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
                {/* Live remaining stock — same pop + color-flash animation as
                    the per-size steppers, just tracking product.stock directly. */}
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