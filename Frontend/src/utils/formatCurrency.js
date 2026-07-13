const USD_PER_PKR = 1 / 278; // ~1 USD = 278 PKR

export const getCurrencyForCountry = (countryCode) =>
  countryCode === "PK" ? "PKR" : "USD";

// COD is ONLY valid for Pakistan. Every other country = card only.
export const getAllowedPaymentMethods = (countryCode) =>
  countryCode === "PK" ? ["cod", "card"] : ["card"];

export const convertFromPKR = (amountPKR, currency = "PKR") => {
  const value = Number(amountPKR) || 0;
  return currency === "USD" ? value * USD_PER_PKR : value;
};

export const formatAmount = (amountPKR, currency = "PKR") => {
  const value = convertFromPKR(amountPKR, currency);

  if (currency === "PKR") {
    return `Rs. ${value.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
  }
  return `$${value.toFixed(2)}`;
};