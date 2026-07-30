export default function ProductMeta({ color, size }) {
    if (!color && !size) return null;
    return (
      <p className="text-gray-500 text-xs">
        {color && <span>{color}</span>}
        {color && size && <span> · </span>}
        {size && <span>Size {size}</span>}
      </p>
    );
  }