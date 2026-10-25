export const CLOUDINARY_SIZES = { thumb: 200, card: 600, detail: 1000 };

export function optimizedImage(url, width = 600) {
  if (!url || typeof url !== "string") return url || "/placeholder.png";
  if (!url.includes("res.cloudinary.com")) return url;
  if (url.includes("f_auto")) return url;
  const marker = "/image/upload/";
  const idx = url.indexOf(marker);
  if (idx === -1) return url;
  return `${url.slice(0, idx + marker.length)}f_auto,q_auto,w_${width},c_limit/${url.slice(idx + marker.length)}`;
}

export const cardImage = (url) => optimizedImage(url, 600);
export const thumbImage = (url) => optimizedImage(url, 200);
export const detailImage = (url) => optimizedImage(url, 1000);
