const StockBadge = ({ stock }) => {
    const qty = Number(stock);
    let style, label;
  
    if (!stock && stock !== 0) {
      style = "bg-gray-100 text-gray-500";
      label = "—";
    } else if (qty === 0) {
      style = "bg-red-100 text-red-700";
      label = "0 — Out of Stock";
    } else if (qty <= 10) {
      style = "bg-yellow-100 text-yellow-700";
      label = `${qty} — Low Stock`;
    } else {
      style = "bg-green-100 text-green-700";
      label = `${qty} — In Stock`;
    }
  
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${style}`}>
        {label}
      </span>
    );
  };
  
  export default StockBadge;