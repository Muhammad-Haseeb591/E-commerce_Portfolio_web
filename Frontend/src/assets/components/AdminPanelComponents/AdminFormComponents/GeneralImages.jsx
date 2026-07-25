import React from "react";
import { X, Loader2, Plus } from "lucide-react";

const GeneralImages = ({
  images,
  uploading,
  uploadErrors,
  onImageChange,
  onFileSelect,
  onAdd,
  onRemove,
  fieldClass,
}) => {
  return (
    <section>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">
        General Images
      </label>
      <p className="text-xs text-gray-400 mb-2">
        Used as a fallback wherever a color below doesn't have its own image.
      </p>
      <div className="space-y-3">
        {images.map((img, i) => (
          <div key={i} className="border border-gray-100 rounded-xl p-3">
            <div className="flex items-center gap-3">
              {uploading[i] ? (
                <div className="w-16 h-16 flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 shrink-0">
                  <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                </div>
              ) : img ? (
                <img
                  src={img}
                  alt={`preview-${i}`}
                  className="w-16 h-16 object-cover rounded-lg border border-gray-200 shrink-0"
                />
              ) : (
                <div className="w-16 h-16 flex items-center justify-center rounded-lg border border-dashed border-gray-300 text-[10px] text-gray-400 text-center shrink-0">
                  No image
                </div>
              )}

              <div className="flex-1 space-y-1 min-w-0">
                <label className="inline-block text-xs text-gray-600 hover:text-gray-900 cursor-pointer bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg">
                  {img ? "Change Image" : "Upload Image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onFileSelect(i, e.target.files[0])}
                  />
                </label>
                {uploadErrors[i] && (
                  <p className="text-[11px] text-red-500">{uploadErrors[i]}</p>
                )}
              </div>

              {images.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 shrink-0"
                  aria-label="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <input
              type="text"
              placeholder="...or paste an image URL directly"
              value={img}
              onChange={(e) => onImageChange(i, e.target.value)}
              className={`${fieldClass("images")} mt-2`}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="mt-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 hover:underline"
      >
        <Plus className="w-3.5 h-3.5" /> Add Image
      </button>
    </section>
  );
};

export default GeneralImages;