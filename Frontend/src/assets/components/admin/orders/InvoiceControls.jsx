import { useState } from "react";
import { FileDown, FileSpreadsheet, FileText } from "lucide-react";
import { downloadGetFile, downloadPostFile } from "../../../utils/downloadFile";

export const InvoiceButton = ({ orderId }) => {
  const [downloading, setDownloading] = useState(false);
  const handleDownload = async (e) => {
    e.stopPropagation();
    setDownloading(true);
    try {
      // 🔑 CORRECTED: no "/orders" prefix here — downloadFile.js's BASE_URL
      // already equals `${API_URL}/orders`. Adding it again here would have
      // requested /orders/orders/:id/invoice, which is wrong.
      await downloadGetFile(`/${orderId}/invoice`, `invoice-${orderId}.pdf`);
    } catch (err) {
      console.error("Invoice download failed:", err);
    } finally {
      setDownloading(false);
    }
  };
  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-40"
      aria-label="Download invoice"
      title="Download invoice"
    >
      <FileDown className="w-4 h-4" />
    </button>
  );
};

export const BulkInvoiceButton = ({ selectedOrderIds }) => {
  const [downloading, setDownloading] = useState(false);
  const handleBulkDownload = async () => {
    setDownloading(true);
    try {
      await downloadPostFile("/invoices/bulk", "invoices-bulk.pdf", {
        orderIds: selectedOrderIds,
      });
    } catch (err) {
      console.error("Bulk invoice download failed:", err);
    } finally {
      setDownloading(false);
    }
  };
  return (
    <button
      onClick={handleBulkDownload}
      disabled={!selectedOrderIds.length || downloading}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      <FileDown className="w-4 h-4" />
      {downloading ? "Downloading..." : `Invoices (${selectedOrderIds.length})`}
    </button>
  );
};

export const ExportButtons = ({ currentFilters }) => (
  <div className="flex items-center gap-2">
    <button
      onClick={() => downloadGetFile("/export/excel", "orders.xlsx", currentFilters)}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
    >
      <FileSpreadsheet className="w-4 h-4" />
      Excel
    </button>
    <button
      onClick={() => downloadGetFile("/export/csv", "orders.csv", currentFilters)}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
    >
      <FileText className="w-4 h-4" />
      CSV
    </button>
  </div>
);