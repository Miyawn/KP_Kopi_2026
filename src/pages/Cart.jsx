import { Link, useNavigate } from "react-router-dom"
import { Minus, Plus, Trash2 } from "lucide-react"
import { Button } from "../components/ui/button"
import { Card } from "../components/ui/card"
import { useCart } from "../context/CartContext"

export default function Cart() {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    getTotalPrice,
  } = useCart()

  const navigate = useNavigate()

  const handleIncrement = (item) => {
    if (item.quantity < item.stock) {
      updateQuantity(item.id, item.quantity + 1)
    }
  }

  const handleDecrement = (item) => {
    updateQuantity(item.id, item.quantity - 1)
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-gray-500 mb-4">
            Keranjang Anda kosong
          </p>
          <Link to="/">
            <Button className="bg-amber-700 text-white">
              Kembali ke Menu
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-6">
        Keranjang Belanja
      </h1>

      <div className="space-y-4">
        {cartItems.map(item => (
          <Card key={item.id} className="p-4 flex justify-between items-center">

            {/* Info */}
            <div>
              <h2 className="font-bold">
                {item.name}
              </h2>
              <p className="text-sm text-gray-500">
                Rp {item.price.toLocaleString("id-ID")}
              </p>
            </div>

            {/* Quantity Control */}
            <div className="flex items-center gap-3">

              <Button
                size="icon"
                variant="outline"
                onClick={() => handleDecrement(item)}
              >
                <Minus size={16} />
              </Button>

              <span className="font-bold text-lg w-6 text-center">
                {item.quantity}
              </span>

              <Button
                size="icon"
                variant="outline"
                onClick={() => handleIncrement(item)}
                disabled={item.quantity >= item.stock}
              >
                <Plus size={16} />
              </Button>
            </div>

            {/* Subtotal */}
            <div className="text-right">
              <p className="font-bold text-amber-700">
                Rp {(item.price * item.quantity).toLocaleString("id-ID")}
              </p>

              <button
                onClick={() => removeFromCart(item.id)}
                className="text-red-500 text-sm flex items-center gap-1 mt-1"
              >
                <Trash2 size={14} />
                Hapus
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Total Section */}
      <Card className="p-6 mt-6">
        <div className="flex justify-between text-xl font-bold">
          <span>Total:</span>
          <span>
            Rp {getTotalPrice().toLocaleString("id-ID")}
          </span>
        </div>

        <Button
          onClick={() => navigate("/checkout")}
          className="w-full mt-4 bg-amber-700 text-white"
        >
          Lanjut ke Checkout
        </Button>
      </Card>
    </div>
  )
}
