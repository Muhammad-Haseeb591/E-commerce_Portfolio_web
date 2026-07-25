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
        <div className="border border-gray-100 rounded-xl p-3">
        <div className="flex items-center gap-3">
          {/* {uploading ? (
            <div className="w-16 h-16 flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 shrink-0">
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            </div>
          ) : image ? (
            <img
              src={image}
              alt="general-preview"
              className="w-16 h-16 object-cover rounded-lg border border-gray-200 shrink-0"
            />
          ) : (
            <div className="w-16 h-16 flex items-center justify-center rounded-lg border border-dashed border-gray-300 text-[10px] text-gray-400 text-center shrink-0">
              No image
            </div>
          )} */}
 
          <div className="flex-1 space-y-1 min-w-0">
            <label className="inline-block text-xs text-gray-600 hover:text-gray-900 cursor-pointer bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg">
              {image ? "Change Image" : "Upload Image"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onFileSelect(e.target.files[0])}
              />
            </label>
            {uploadError && <p className="text-[11px] text-red-500">{uploadError}</p>}
          </div>
        </div>
 
        <input
          type="text"
          placeholder="...or paste an image URL directly"
          value={image}
          onChange={(e) => onImageChange(e.target.value)}
          className={`${fieldClass("image")} mt-2`}
        />
      </div>
    </section>
  );
};

export default GeneralImages;