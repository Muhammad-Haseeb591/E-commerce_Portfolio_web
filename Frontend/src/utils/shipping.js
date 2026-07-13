export const FREE_DELIVERY_THRESHOLD = 5000; // PKR
export const SHIPPING_FEE = 200; // PKR — flat fee below threshold

export const getShippingFee = (subtotalPKR) =>
  subtotalPKR >= FREE_DELIVERY_THRESHOLD ? 0 : SHIPPING_FEE;

export const getAmountLeftForFreeDelivery = (subtotalPKR) =>
  Math.max(0, FREE_DELIVERY_THRESHOLD - subtotalPKR);