// utils/downloadFile.js
//
// Generic helper for endpoints that return a file (PDF/Excel/CSV) instead
// of JSON. Deliberately NOT a Redux thunk — nothing here needs to live in
// global state; each call is a one-shot "fetch blob → trigger browser
// download" action local to whichever button triggered it.
//
// ⚠️ Adjust the import below to match your actual axios instance
// (the one that already has baseURL + withCredentials configured).
import api from "../config/api";

function triggerBrowserDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// Tries to pull the real filename Express sent via Content-Disposition,
// falling back to whatever the caller passed in.
function extractFilename(response, fallback) {
  const disposition = response.headers?.["content-disposition"];
  const match = disposition && disposition.match(/filename="?([^"]+)"?/);
  return match ? match[1] : fallback;
}

// GET download — e.g. single invoice, excel export, csv export.
// params become query string (?from=&to=&status=...).
export async function downloadGetFile(url, fallbackFilename, params = {}) {
  const response = await api.get(url, {
    params,
    responseType: "blob",
  });
  const filename = extractFilename(response, fallbackFilename);
  triggerBrowserDownload(response.data, filename);
}

// POST download — e.g. bulk invoice, which needs an orderIds array in the body.
export async function downloadPostFile(url, fallbackFilename, body = {}) {
  const response = await api.post(url, body, {
    responseType: "blob",
  });
  const filename = extractFilename(response, fallbackFilename);
  triggerBrowserDownload(response.data, filename);
}