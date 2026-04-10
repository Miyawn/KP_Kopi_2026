import { Plus } from "lucide-react"
import { Button } from "./ui/button"
import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import { useCart } from "../context/CartContext"

export default function MenuCard({ menu }) {
  const { addToCart } = useCart()

  const isOutOfStock = !menu.is_available || menu.stock === 0

  const handleAddToCart = () => {
    if (!isOutOfStock) {
      addToCart(menu)
    }
  }

  return (
    <Card className="group overflow-hidden border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 bg-white rounded-xl">
      <div className="relative h-48 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 overflow-hidden flex items-center justify-center border-b border-gray-100">
        <div className="text-xl tracking-[0.35em] font-bold text-amber-900/35 group-hover:text-amber-900/50 transition-colors">
          MENU
        </div>
      </div>

      <div className="p-5">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{menu.name}</h3>

          <Badge variant="default" className="font-medium">
            {menu.category}
          </Badge>
        </div>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">{menu.description}</p>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-amber-700">
              Rp {menu.price.toLocaleString("id-ID")}
            </span>

            {menu.stock > 0 && menu.stock <= 5 && (
              <span className="text-xs text-red-500">Stok tersisa {menu.stock}</span>
            )}
          </div>

          <Button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            size="sm"
            className={`transition-all ${
              isOutOfStock
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-amber-700 hover:bg-amber-800 text-white rounded-full px-4"
            }`}
          >
            <Plus className="w-4 h-4" />
            Tambah
          </Button>
        </div>

        {isOutOfStock && <p className="text-xs text-gray-500 text-center mt-2">Stok Habis</p>}
      </div>
    </Card>
  )
}
