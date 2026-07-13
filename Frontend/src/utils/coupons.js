export const COUPONS = {
    SAVE10: { type: "percent", value: 10, label: "10% off" },
    WELCOME15: { type: "percent", value: 15, label: "15% off — welcome offer" },
    FLAT500: { type: "flat", value: 500, label: "Rs. 500 off" },
  };
  
  export const getCouponDiscount = (code, subtotalPKR) => {
    const coupon = COUPONS[code?.trim().toUpperCase()];
    if (!coupon) return { valid: false, discount: 0, label: "" };
  
    const discount =
      coupon.type === "percent"
        ? Math.round((subtotalPKR * coupon.value) / 100)
        : Math.min(coupon.value, subtotalPKR);
  
    return { valid: true, discount, label: coupon.label, code: code.trim().toUpperCase() };
  };