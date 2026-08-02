import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchData } from "../../store/fetcherSlice";
import { addToCart } from "../../store/cartSlice";
import { fetchFavourites, toggleFavourite } from "../../store/favouriteslice";
import { IoArrowBack } from "react-icons/io5";
import ReviewSection from "../Reviewsection";
import { FREE_DELIVERY_THRESHOLD } from "../../../../utils/shipping";
import SEO from "../../common/SEO";

import {
  getItemId,
  getStockValue,
  normalizeSizes,
  normalizeColors,
  orderSizesByCategory,
  generateFakeReviews,
} from "../../../../utils/Detailpageutils";
import ProductGallery from "./ProductGallery";
import ProductInfo from "./ProductInfo";

const Detail_Page = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const products = useSelector((state) => state.FetchPrducts.products || []);
  const loading = useSelector((state) => state.FetchPrducts.loading);
  const favouriteItems = useSelector((state) => state.favourites.items || []);
  const favouriteLoading = useSelector((state) => state.favourites.loading);

  const cartItems = useSelector((state) => state.cart.items || []);

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

  const mainImage = hasColors
    ? selectedColorData?.images?.[0] || null
    : product?.image || product?.images?.[0] || null;

  const sizeList = useMemo(() => {
    const sourceSizes = hasColors
      ? selectedColorData?.sizes ?? product?.sizes
      : product?.sizes;
    const normalized = normalizeSizes(sourceSizes);
    return orderSizesByCategory(normalized, product?.type, product?.category);
  }, [hasColors, selectedColorData, product]);
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
    setImgLoaded(false);
    setQuantity(1);
    setSelectedSizes({});
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
    const image = mainImage;
    const productId = getItemId(product);
    const normColorVal = color || null;

    const existingLine = cartItems.find(
      (i) => getItemId(i) === productId && (i.color || null) === normColorVal
    );

    if (hasSizes) {
      const alreadyInCart = [];
      const toAdd = [];

      Object.entries(selectedSizes).forEach(([size, qty]) => {
        const alreadyHasSize = existingLine?.sizes?.some((s) => s.size === size);
        if (alreadyHasSize) {
          alreadyInCart.push(size);
        } else {
          toAdd.push([size, qty]);
        }
      });

      if (toAdd.length === 0) {
        alert("Your item is already in cart.");
        return;
      }

      toAdd.forEach(([size, qty]) => {
        const stock = sizeList.find((s) => s.size === size)?.stock;
        dispatch(addToCart({ product, size, quantity: qty, stock, color, image }));
      });

      if (alreadyInCart.length > 0) {
        alert(
          `Size${alreadyInCart.length > 1 ? "s" : ""} ${alreadyInCart.join(", ")} already in cart — the other selected size(s) were added.`
        );
      }
    } else {
      const alreadyAdded = existingLine?.sizes?.some((s) => s.size === null);
      if (alreadyAdded) {
        alert("Your item is already in cart.");
        return;
      }
      dispatch(addToCart({ product, size: null, quantity, stock: productStock, color, image }));
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
    mainImage,
    dispatch,
    cartItems,
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
        <SEO title="Loading Product... | STORE" noIndex />
        <p className="text-gray-500 text-sm">Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <SEO title="Product Not Found | STORE" noIndex />
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
      <SEO
        title={`${product.name} | STORE`}
        description={
          product.description
            ? product.description.slice(0, 150)
            : `Buy ${product.name} at STORE. Price: Rs. ${product.price}.`
        }
        keywords={`${product.name}, ${product.color || ""}, fashion, STORE`}
        image={mainImage || undefined}
        url={`https://e-commerce-portfolio-web.vercel.app/products/${getItemId(product)}`}
      />

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#333333] mb-4 sm:mb-6"
      >
        <IoArrowBack className="size-4" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
        <ProductGallery
          mainImage={mainImage}
          productName={product.name}
          imgLoaded={imgLoaded}
          onImageLoad={() => setImgLoaded(true)}
          isFavourite={isFavourite}
          favouriteLoading={favouriteLoading}
          onToggleFavourite={handleToggleFavourite}
          hasColors={hasColors}
          colorList={colorList}
          selectedColorIndex={selectedColorIndex}
          onSelectColor={selectColor}
        />

        <ProductInfo
          product={product}
          avgRating={avgRating}
          reviewsCount={reviews.length}
          isFreeDelivery={isFreeDelivery}
          amountLeftForFreeDelivery={amountLeftForFreeDelivery}
          hasColors={hasColors}
          selectedColorData={selectedColorData}
          allColorsOutOfStock={allColorsOutOfStock}
          hasSizes={hasSizes}
          sizeList={sizeList}
          selectedSizes={selectedSizes}
          allSizesOutOfStock={allSizesOutOfStock}
          pulsingSize={pulsingSize}
          onToggleSize={toggleSize}
          onSetSizeQuantity={setSizeQuantity}
          getRemainingStock={getRemainingStock}
          inStockCount={inStockSizes.length}
          outOfStockCount={outOfStockSizes.length}
          quantity={quantity}
          onDecreaseQty={decreaseQty}
          onIncreaseQty={increaseQty}
          productOutOfStock={productOutOfStock}
          remainingProductStock={remainingProductStock}
          qtyPulsing={qtyPulsing}
          onAddToCart={handleAddToCart}
          addToCartDisabled={addToCartDisabled}
          added={added}
          totalSelectedQty={totalSelectedQty}
          itemTotal={itemTotal}
        />
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
    </div>
  );
};

export default Detail_Page;