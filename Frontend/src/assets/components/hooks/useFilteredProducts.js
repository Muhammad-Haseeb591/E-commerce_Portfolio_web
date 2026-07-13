import { useMemo } from "react";
import { useSelector } from "react-redux";

// 🔑 Product.sizes do shapes mein aa sakta hai:
//   1. Simple strings: ["38", "40", "42"]
//   2. Objects (jaise cart mein): [{ size: "38", stock: 5 }, ...]
// Ye helper dono cases se sirf size strings nikal ke deta hai.
const getProductSizeStrings = (product) => {
  const rawSizes = product.sizes;
  if (!Array.isArray(rawSizes)) return [];

  return rawSizes
    .map((s) => {
      if (s && typeof s === "object") {
        return s.size != null ? String(s.size) : null;
      }
      return s != null ? String(s) : null;
    })
    .filter(Boolean);
};

// 🔑 Price kabhi kabhi string format mein aata hai jaise "12,500" ya
// "Rs. 12500" — commas/currency symbols hata ke number banate hain,
// warna Number() seedha NaN de deta hai aur filter sab kuch hata deta hai.
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

    // ── Color ──
    if (filters.color) {
      result = result.filter(
        (p) => (p.color || "").toLowerCase() === filters.color.toLowerCase()
      );
    }

    // ── Sizes (multi-select, comma-separated) ──
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

    // ── Free-text search (name, description, color) ──
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          (p.name || "").toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q) ||
          (p.color || "").toLowerCase().includes(q)
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

    return result;
  }, [catalog, filters]);
};