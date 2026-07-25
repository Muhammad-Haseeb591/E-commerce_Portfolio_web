import { useMemo } from "react";
import { useSelector } from "react-redux";


const getProductColorStrings = (product) => {
  const colors = Array.isArray(product.colors) ? product.colors : [];
  return colors.map((c) => c.color).filter(Boolean);
};


const getProductSizeStrings = (product) => {
  const colors = Array.isArray(product.colors) ? product.colors : [];
  const rawSizes = colors.flatMap((c) => (Array.isArray(c.sizes) ? c.sizes : []));

  return rawSizes
    .map((s) => {
      if (s && typeof s === "object") {
        return s.size != null ? String(s.size) : null;
      }
      return s != null ? String(s) : null;
    })
    .filter(Boolean);
};


const parsePrice = (value) => {
  if (typeof value === "number") return value;
  const cleaned = String(value ?? "").replace(/[^0-9.]/g, "");
  return cleaned === "" ? 0 : Number(cleaned);
};

export const useFilteredProducts = () => {
  const { catalog, filters } = useSelector((state) => state.FetchPrducts);

  return useMemo(() => {
    let result = catalog;

    // ── Category ──
    if (filters.category) {
      result = result.filter(
        (p) => (p.category || "").toLowerCase() === filters.category.toLowerCase()
      );
    }

    // ── Color ── (colors[] mein se KOI BHI ek color match kare to product qualify)
    if (filters.color) {
      const wanted = filters.color.toLowerCase();
      result = result.filter((p) =>
        getProductColorStrings(p).some((c) => c.toLowerCase() === wanted)
      );
    }

    // ── Sizes (multi-select, comma-separated) ── colors[].sizes[] ke across
    if (filters.sizes) {
      const wanted = filters.sizes.split(",").filter(Boolean);
      result = result.filter((p) => {
        const productSizes = getProductSizeStrings(p);
        return productSizes.some((s) => wanted.includes(s));
      });
    }

    // ── Price range ──
    if (filters.minPrice !== "" && filters.minPrice != null) {
      const min = Number(filters.minPrice);
      result = result.filter((p) => parsePrice(p.price) >= min);
    }
    if (filters.maxPrice !== "" && filters.maxPrice != null) {
      const max = Number(filters.maxPrice);
      result = result.filter((p) => parsePrice(p.price) <= max);
    }

    // ── Free-text search (name, description, ANY color) ──
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          (p.name || "").toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q) ||
          getProductColorStrings(p).some((c) => c.toLowerCase().includes(q))
      );
    }

    // ── Sort ──
    const sortField = filters.sortBy || "createdAt";
    const dir = filters.order === "asc" ? 1 : -1;

    result = [...result].sort((a, b) => {
      if (sortField === "name") {
        const av = (a.name || "").toLowerCase();
        const bv = (b.name || "").toLowerCase();
        return av > bv ? dir : av < bv ? -dir : 0;
      }

      if (sortField === "createdAt") {
        const av = new Date(a.createdAt || 0).getTime();
        const bv = new Date(b.createdAt || 0).getTime();
        return (av - bv) * dir;
      }

      if (sortField === "price") {
        return (parsePrice(a.price) - parsePrice(b.price)) * dir;
      }

      // rating | discount — numeric fields
      const av = Number(a[sortField] || 0);
      const bv = Number(b[sortField] || 0);
      return (av - bv) * dir;
    });

  
    result = result.map((p) => {
      const colors = Array.isArray(p.colors) ? p.colors : [];
      const matchedColor = filters.color
        ? colors.find((c) => (c.color || "").toLowerCase() === filters.color.toLowerCase())
        : null;
      const displayImage = matchedColor?.image || colors[0]?.image || null;
      return { ...p, displayImage };
    });

    return result;
  }, [catalog, filters]);
};