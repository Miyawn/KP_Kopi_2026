import { ShoppingCart, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useCart } from '../context/CartContext';

export default function MenuCard({ menu }) {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart(menu);
  };

  return (
    <Card className="group overflow-hidden border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 bg-white rounded-xl">
      {/* Image Container */}
      <div className="relative h-48 bg-gradient-to-br from-amber-50 to-orange-50 overflow-hidden flex items-center justify-center border-b border-gray-100">
        <div className="text-6xl opacity-50 group-hover:opacity-70 transition-opacity">☕</div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Header */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
            {menu.name}
          </h3>
          <p className="text-xs font-medium text-amber-700 bg-amber-50 inline-block px-2.5 py-1 rounded-full">
            {menu.category}
          </p>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
          {menu.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-gray-900">
              Rp {menu.price.toLocaleString('id-ID')}
            </span>
          </div>
          <Button
            onClick={handleAddToCart}
            disabled={!menu.available}
            variant={menu.available ? 'default' : 'secondary'}
            size="sm"
            className={`rounded-lg transition-all ${
              menu.available
                ? 'bg-amber-700 hover:bg-amber-800 text-white'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {menu.available ? (
              <ShoppingCart className="w-4 h-4" />
            ) : (
              <Check className="w-4 h-4" />
            )}
          </Button>
        </div>

        {!menu.available && (
          <p className="text-xs text-gray-500 text-center mt-2">Not Available</p>
        )}
      </div>
    </Card>
  );
}
