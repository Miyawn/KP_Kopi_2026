import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function CartItem({ item }) {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-4">
      <div className="flex-1">
        <h3 className="font-bold text-gray-800">{item.name}</h3>
        <p className="text-sm text-gray-600">Rp {item.price.toLocaleString('id-ID')}</p>
      </div>

      <div className="flex items-center gap-2 bg-gray-100 rounded">
        <button
          onClick={() => updateQuantity(item.id, item.quantity - 1)}
          className="p-2 hover:bg-gray-200 transition"
        >
          <Minus size={16} />
        </button>
        <span className="px-3 font-bold">{item.quantity}</span>
        <button
          onClick={() => updateQuantity(item.id, item.quantity + 1)}
          className="p-2 hover:bg-gray-200 transition"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="text-right">
        <p className="font-bold text-amber-900">
          Rp {(item.price * item.quantity).toLocaleString('id-ID')}
        </p>
        <button
          onClick={() => removeFromCart(item.id)}
          className="text-red-500 hover:text-red-700 mt-1"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}
