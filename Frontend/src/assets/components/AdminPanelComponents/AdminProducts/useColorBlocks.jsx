import { useState } from "react";
import { uploadToCloudinary, emptyColorBlock } from "../AdminFormComponents/Productformhelpers";

// 🔑 ADDED — kisi bhi incoming color block ka `images` field ko hamesha
// array me normalize karta hai. Existing product data (EditModal ke
// initialBlocks) mein `images` missing/string/null ho sakta hai — isse
// crash hota tha jahan bhi `[...next[colorIndex].images]` spread hota tha.
const normalizeBlock = (c) => ({
  ...c,
  images: Array.isArray(c?.images) ? c.images : c?.images ? [c.images] : [],
});

export default function useColorBlocks(initialBlocks) {
  const [colorBlocks, setColorBlocks] = useState(() =>
    initialBlocks?.length ? initialBlocks.map(normalizeBlock) : [emptyColorBlock()]
  );
  const [colorErrors, setColorErrors] = useState({});
  const [colorImgUploading, setColorImgUploading] = useState({});
  const [colorImgErrors, setColorImgErrors] = useState({});

  const addColorBlock = () => setColorBlocks((prev) => [...prev, emptyColorBlock()]);

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
      // 🔑 CHANGED — guard: images kabhi bhi non-array na ho, spread se
      // pehle hamesha array confirm karo.
      const currentImages = Array.isArray(next[colorIndex].images) ? next[colorIndex].images : [];
      const images = [...currentImages];
      images[imgIndex] = value;
      next[colorIndex] = { ...next[colorIndex], images };
      return next;
    });
  };

  const addColorImageField = (colorIndex) =>
    setColorBlocks((prev) => {
      const next = [...prev];
      // 🔑 CHANGED — guard
      const currentImages = Array.isArray(next[colorIndex].images) ? next[colorIndex].images : [];
      next[colorIndex] = { ...next[colorIndex], images: [...currentImages, ""] };
      return next;
    });

  const removeColorImageField = (colorIndex, imgIndex) =>
    setColorBlocks((prev) => {
      const next = [...prev];
      // 🔑 CHANGED — guard
      const currentImages = Array.isArray(next[colorIndex].images) ? next[colorIndex].images : [];
      const images = currentImages.filter((_, i) => i !== imgIndex);
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

  // Toggling a size on seeds a quantity of 1 for THAT color only.
  const toggleColorSize = (colorIndex, size) =>
    setColorBlocks((prev) => {
      const next = [...prev];
      const sizes = { ...next[colorIndex].sizes };
      if (size in sizes) delete sizes[size];
      else sizes[size] = 1;
      next[colorIndex] = { ...next[colorIndex], sizes };
      return next;
    });

  const setColorSizeQuantity = (colorIndex, size, qty) =>
    setColorBlocks((prev) => {
      const next = [...prev];
      next[colorIndex] = {
        ...next[colorIndex],
        sizes: { ...next[colorIndex].sizes, [size]: qty },
      };
      return next;
    });

  // Category/Type together decide the size scale — changing either one
  // means every color's sizes+stock may no longer be valid, so all of
  // them get reset together.
  const resetAllColorSizesAndStock = () =>
    setColorBlocks((prev) => prev.map((c) => ({ ...c, sizes: {}, stock: "" })));

  // Colors already picked in OTHER blocks — lets each dropdown hide them
  // so accidental duplicates are harder to create in the first place.
  const colorsUsedElsewhere = (currentIndex) =>
    new Set(
      colorBlocks
        .filter((_, i) => i !== currentIndex)
        .map((c) => c.color)
        .filter(Boolean)
    );

  // Validates + sets colorErrors as a side effect, then reports back
  // whether the form can proceed and what kind of problem (if any) it hit.
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

    setColorErrors(errs);
    return { hasAtLeastOne, hasDuplicates: Object.keys(errs).length > 0 };
  };

  const isAnyColorImageUploading = () => Object.values(colorImgUploading).some(Boolean);

  return {
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
  };
}