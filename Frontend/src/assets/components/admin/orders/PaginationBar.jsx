import { ChevronLeft, ChevronRight } from "lucide-react";

export const PaginationBar = ({ page, pages, total, onPageChange }) => {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 sm:px-6">
      <span className="text-xs text-gray-400">
        Page {page} of {pages} · {total} orders
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default PaginationBar;