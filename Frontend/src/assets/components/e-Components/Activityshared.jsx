import { useEffect, useState } from "react";
import { Star, ImageOff, Expand, X } from "lucide-react";


export const GLASS =
  "bg-white/40 backdrop-blur-2xl border border-white/60 shadow-[0_12px_40px_-10px_rgba(30,27,20,0.18),inset_0_1px_0_0_rgba(255,255,255,0.75)]";

export const STATUS_STYLES = {
  pending: "bg-gray-200/70 text-gray-700",
  placed: "bg-gray-200/70 text-gray-700",
  processing: "bg-sky-100/70 text-sky-700",
  shipped: "bg-indigo-100/70 text-indigo-700",
  out_for_delivery: "bg-amber-100/70 text-amber-700",
  delivered: "bg-emerald-100/70 text-emerald-700",
  cancelled: "bg-red-100/70 text-red-700",
};

export const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export const formatMoney = (n) => (typeof n === "number" ? `$${n.toFixed(2)}` : "—");

/** Pulls a usable thumbnail off either shape a product might come back in:
 *  a single `image` string, or the `images` array the Product schema
 *  actually stores. */
export const getProductThumb = (product) => product?.image || product?.images?.[0] || "";

/* -------------------------------------------------------------------- */
/*  Fonts                                                                */
/* -------------------------------------------------------------------- */

export const FontImports = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,450;9..144,560&family=Inter:wght@400;500;600&display=swap');
    .ia-display { font-family: 'Fraunces', Georgia, serif; font-feature-settings: 'ss01' 1; }
    .ia-body { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
  `}</style>
);

/* -------------------------------------------------------------------- */
/*  Small presentational helpers                                         */
/* -------------------------------------------------------------------- */

export const StatusBadge = ({ status }) => (
  <span
    className={`ia-body inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${
      STATUS_STYLES[status] || "bg-gray-200/70 text-gray-700"
    }`}
  >
    {status?.replace(/_/g, " ") || "Unknown"}
  </span>
);

export const StarRow = ({ value, size = 14 }) => (
  <div className="flex items-center gap-0.5" role="img" aria-label={`Rated ${value} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        size={size}
        strokeWidth={1.5}
        className={n <= Math.round(value) ? "fill-[#333333] text-[#333333]" : "text-gray-300"}
      />
    ))}
  </div>
);

export const StarPicker = ({ value, onChange }) => (
  <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        role="radio"
        aria-checked={n === value}
        onClick={() => onChange(n)}
        className="rounded p-0.5 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#333333]"
        aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
      >
        <Star
          size={22}
          strokeWidth={1.5}
          className={n <= value ? "fill-[#333333] text-[#333333]" : "text-gray-300"}
        />
      </button>
    ))}
  </div>
);

export const StatePanel = ({ icon: Icon, title, description, tone = "neutral" }) => (
  <div
    className={`flex flex-col items-center gap-2 rounded-[20px] border border-dashed py-14 text-center backdrop-blur-xl ${
      tone === "error" ? "border-red-200/80 bg-red-50/30" : "border-white/70 bg-white/25"
    }`}
  >
    <Icon size={20} className={tone === "error" ? "text-red-500" : "text-[#33333366]"} strokeWidth={1.5} />
    <p className={`ia-body text-sm font-medium ${tone === "error" ? "text-red-600" : "text-gray-700"}`}>{title}</p>
    {description && <p className="ia-body max-w-xs px-6 text-xs text-gray-500">{description}</p>}
  </div>
);

export const SkeletonRows = ({ count = 3 }) => (
  <div className="space-y-3" aria-hidden="true">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className={`${GLASS} animate-pulse rounded-[20px] p-4`}>
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 flex-shrink-0 rounded-2xl bg-gray-200/70" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-2/5 rounded bg-gray-200/70" />
            <div className="h-2.5 w-1/4 rounded bg-gray-200/70" />
          </div>
          <div className="h-6 w-14 flex-shrink-0 rounded-full bg-gray-200/70" />
        </div>
      </div>
    ))}
  </div>
);

export const SafeImage = ({ src, alt, className }) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 text-gray-300 ${className}`} aria-label={alt}>
        <ImageOff size={16} strokeWidth={1.5} />
      </div>
    );
  }

  return <img src={src} alt={alt} onError={() => setFailed(true)} className={`object-cover ${className}`} />;
};

/** Any clickable thumbnail — product or review photo — opens the same
 *  in-page lightbox instead of a broken image or an external redirect.
 *  A small expand glyph on hover signals it's viewable, without adding a
 *  second visual element next to the photo. */
export const ViewableThumb = ({ src, alt, className, onView }) => {
  const [failed, setFailed] = useState(false);
  const missing = !src || failed;

  return (
    <button
      type="button"
      onClick={() => !missing && onView(src, alt)}
      disabled={missing}
      className={`group relative flex-shrink-0 overflow-hidden ${missing ? "cursor-default" : "cursor-zoom-in"} ${className}`}
      aria-label={missing ? alt : `View ${alt}`}
    >
      {missing ? (
        <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-300">
          <ImageOff size={16} strokeWidth={1.5} />
        </div>
      ) : (
        <>
          <img
            src={src}
            alt={alt}
            onError={() => setFailed(true)}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-150 group-hover:bg-black/25 group-hover:opacity-100">
            <Expand size={14} className="text-white drop-shadow" strokeWidth={2} />
          </span>
        </>
      )}
    </button>
  );
};

/** Full-screen preview — opens and closes in place instead of navigating
 *  away to the raw image URL. */
export const ImageLightbox = ({ src, alt, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    const onKeyDown = (e) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 150);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm transition-opacity duration-150 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <button
        onClick={handleClose}
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
        aria-label="Close preview"
      >
        <X size={18} />
      </button>
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className={`max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl transition-all duration-200 ease-out ${
          visible ? "scale-100 opacity-100" : "scale-90 opacity-0"
        }`}
      />
    </div>
  );
};