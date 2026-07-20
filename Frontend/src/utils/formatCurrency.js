// client/src/utils/formatCurrency.js

// ── Approximate conversion rates FROM PKR — update periodically ──
// All amounts in the app are stored/calculated in PKR (base currency).
// These rates only affect DISPLAY, never what's sent to the backend.
const RATES_FROM_PKR = {
  PKR: 1,
  USD: 1 / 278,   // ~1 USD = 278 PKR
  EUR: 1 / 300,   // ~1 EUR = 300 PKR
  GBP: 1 / 350,   // ~1 GBP = 350 PKR
};

const CURRENCY_FORMAT = {
  PKR: { symbol: "Rs.", locale: "en-PK" },
  USD: { symbol: "$", locale: "en-US" },
  EUR: { symbol: "€", locale: "de-DE" },
  GBP: { symbol: "£", locale: "en-GB" },
};

export const getCurrencyForCountry = (countryCode) => {
  const map = {
    PK: "PKR",
    US: "USD",
    GB: "GBP",
    DE: "EUR",
    FR: "EUR",
  };
  return map[countryCode] || "USD";
};

// COD is ONLY valid for Pakistan. Every other country = card only.
export const getAllowedPaymentMethods = (countryCode) =>
  countryCode === "PK" ? ["cod", "card"] : ["card"];

export const convertFromPKR = (amountPKR, currency = "PKR") => {
  const value = Number(amountPKR) || 0;
  const rate = RATES_FROM_PKR[currency] ?? 1;
  return value * rate;
};

export const formatAmount = (amountPKR, currency = "PKR") => {
  const value = convertFromPKR(amountPKR, currency);
  const config = CURRENCY_FORMAT[currency] || CURRENCY_FORMAT.PKR;

  if (currency === "PKR") {
    return `${config.symbol} ${value.toLocaleString("en-PK", {
      maximumFractionDigits: 0,
    })}`;
  }

  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};