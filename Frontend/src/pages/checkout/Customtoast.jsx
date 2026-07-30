export default function CustomToast({ toast, onClose }) {
    if (!toast) return null;
    return (
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] animate-[toastIn_0.25s_ease-out]">
        <style>{`
          @keyframes toastIn {
            from { opacity: 0; transform: translate(-50%, -12px); }
            to   { opacity: 1; transform: translate(-50%, 0); }
          }
        `}</style>
        <div className="bg-white border border-gray-200 shadow-xl rounded-2xl w-[300px] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 bg-white">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-white text-xs font-bold"
              style={{ backgroundColor: "#333333" }}
            >
              ✓
            </div>
            <span className="text-[11px] font-bold tracking-widest text-gray-800 uppercase">
              My Store
            </span>
          </div>
          <div className="px-4 py-3">
            <p className="text-sm text-gray-700 font-medium">{toast.message}</p>
          </div>
          <div className="px-4 pb-3">
            <button
              onClick={onClose}
              className="w-full py-2 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: "#333333" }}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    );
  }