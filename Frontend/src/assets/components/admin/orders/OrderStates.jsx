import { AlertCircle, PackageX } from "lucide-react";

const StateBlock = ({ children }) => (
  <div className="py-14 flex flex-col items-center gap-3 text-center px-4">{children}</div>
);

export const LoadingState = () => (
  <StateBlock>
    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
    <span className="text-sm text-gray-400">Loading orders...</span>
  </StateBlock>
);

export const ErrorState = ({ message, onRetry }) => (
  <StateBlock>
    <AlertCircle className="w-8 h-8 text-red-400" />
    <span className="text-sm font-medium text-red-400">Error: {message}</span>
    <button
      type="button"
      onClick={onRetry}
      className="text-sm text-gray-600 border border-gray-300 px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
    >
      Retry
    </button>
  </StateBlock>
);

export const EmptyState = () => (
  <StateBlock>
    <PackageX className="w-8 h-8 text-gray-400" />
    <span className="text-sm text-gray-400">No orders found</span>
  </StateBlock>
);