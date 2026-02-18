import { Minus, Plus } from "lucide-react";

interface CartQuantityControlsProps {
  quantity: number;
  onUpdate: (newQty: number) => void;
  className?: string;
  spanClassName?: string;
}

export function CartQuantityControls({
  quantity,
  onUpdate,
  className = "",
  spanClassName = "w-6 text-center text-xs",
}: CartQuantityControlsProps) {
  return (
    <div className={`flex items-center border border-border rounded ${className}`}>
      <button
        onClick={() => onUpdate(quantity - 1)}
        className="p-1 hover:bg-muted transition-colors"
        aria-label="Decrease quantity"
      >
        <Minus className="h-3 w-3" />
      </button>
      <span className={spanClassName}>{quantity}</span>
      <button
        onClick={() => onUpdate(quantity + 1)}
        className="p-1 hover:bg-muted transition-colors"
        aria-label="Increase quantity"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}
