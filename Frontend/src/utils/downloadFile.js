import axios from "axios";
import { API_URL } from "../config/api"; // apna actual relative path check kar lein

const BASE_URL = `${API_URL.replace(/\/+$/, "")}/orders`;
const config = { withCredentials: true };

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

function extractFilename(response, fallback) {
  const disposition = response.headers?.["content-disposition"];
  const match = disposition && disposition.match(/filename="?([^"]+)"?/);
  return match ? match[1] : fallback;
}

export async function downloadGetFile(path, fallbackFilename, params = {}) {
  const response = await axios.get(`${BASE_URL}${path}`, {
    ...config,
    params,
    responseType: "blob",
  });
  const filename = extractFilename(response, fallbackFilename);
  triggerBrowserDownload(response.data, filename);
}

export async function downloadPostFile(path, fallbackFilename, body = {}) {
  const response = await axios.post(`${BASE_URL}${path}`, body, {
    ...config,
    responseType: "blob",
  });
  const filename = extractFilename(response, fallbackFilename);
  triggerBrowserDownload(response.data, filename);
}