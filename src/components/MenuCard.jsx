import { ShoppingCart } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { useCart } from "../context/CartContext";

export default function MenuCard({ menu }) {
  const { addToCart } = useCart();
  const menuImage = menu.image_url || menu.imageUrl

  const isOutOfStock = !menu.is_available || menu.stock === 0

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (!isOutOfStock) addToCart(menu);
  };

  return (
    <Card className="group flex flex-col h-full overflow-hidden rounded-2xl border border-coffee-100 bg-white shadow-card hover:shadow-soft hover:-translate-y-1.5 transition-all duration-500 ease-out">
      <div className="relative w-full h-[220px] bg-cream-100 overflow-hidden flex-shrink-0 border-b border-white/70">
        {menuImage ? (
          <img
            src={menuImage}
            alt={menu.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-7xl group-hover:scale-110 transition-transform duration-700 ease-in-out opacity-60">
            {menu.icon || "☕"}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-transparent pointer-events-none z-10" />

        <div className="absolute top-4 left-4 z-20">
          <Badge
            variant="default"
            className="bg-white/95 text-coffee-700 hover:bg-white backdrop-blur-md shadow-sm font-semibold text-[11px] uppercase tracking-[0.15em] px-3.5 py-1.5 rounded-lg border-none"
          >
            {menu.category}
          </Badge>
        </div>

        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/55 backdrop-blur-[3px] flex items-center justify-center z-30">
            <span className="bg-coffee-900 text-cream text-xs font-bold uppercase tracking-[0.2em] px-5 py-2.5 rounded-full shadow-xl">
              Stok Habis
            </span>
          </div>
        )}
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <div className="flex-grow mb-6">
          <h3 className="text-[22px] font-bold text-coffee-900 leading-tight mb-2 tracking-tight group-hover:text-coffee-600 transition-colors line-clamp-2">
            {menu.name}
          </h3>
          <p className="text-[15px] text-coffee-600 line-clamp-2 leading-relaxed font-medium">
            {menu.description}
          </p>
        </div>

        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            {menu.stock > 0 && menu.stock <= 5 && (
              <span className="text-[11px] font-bold text-red-500 mb-1 animate-pulse">
                Stok Tersisa {menu.stock}
              </span>
            )}

            <span className="text-2xl font-black text-coffee-700 tracking-tight">
              Rp {menu.price.toLocaleString("id-ID")}
            </span>
          </div>

          <Button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            size="sm"
            className={`h-12 w-12 rounded-xl p-0 flex items-center justify-center shadow-md transition-all duration-300 focus:outline-none ${
              isOutOfStock
                ? "bg-cream-100 text-coffee-400 cursor-not-allowed shadow-none"
                : "bg-coffee-700 hover:bg-coffee-600 hover:shadow-lg hover:-translate-y-1 text-cream active:scale-95"
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
          </Button>
        </div>

        {isOutOfStock && <p className="text-xs text-coffee-500 text-center mt-2">Stok Habis</p>}
      </div>
    </Card>
  );
}
