// 🔑 Single source of truth for color name → hex.
// Filter.jsx aur product listing pages (New/Women/Men/Kids...) dono
// isi map ko use karte hain — taake filter ka swatch aur product ka
// color-dot hamesha backend ke "color" field ke sath match karein.
export const COLOR_HEX = {
    black: "#000000",
    white: "#ffffff",
    red: "#cc0000",
    blue: "#1e3a8a",
    grey: "#9ca3af",
    brown: "#78350f",
    beige: "#e7d8c9",
    green: "#166534",
  };
  
  // Backend se jo bhi color string aaye (kabhi capitalized, kabhi spaces
  // ke saath), usko normalize kar ke hex nikalne ke liye helper.
  export const getColorHex = (color) => {
    if (!color) return null;
    const key = color.trim().toLowerCase();
    return COLOR_HEX[key] || color; // agar map mein nahi mila to raw value hi try karo (shayad backend hex bhej raha ho)
  };