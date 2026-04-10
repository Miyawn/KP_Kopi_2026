import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react"
import { Button } from "../components/ui/button"
import { Card } from "../components/ui/card"
import { useCart } from "../context/CartContext"

export default function Cart() {
  const { cartItems, updateQuantity, removeFromCart, getTotalPrice, getTotalItems } = useCart()
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
      <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
        <Card className="p-8 text-center border-0 shadow-sm">
          <p className="text-gray-500 mb-4">Keranjang Anda kosong</p>
          <Link to="/">
            <Button className="bg-amber-700 text-white hover:bg-amber-800">Kembali ke Menu</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-amber-900 mb-6 hover:opacity-80"
        >
          <ArrowLeft size={18} />
          Kembali ke Menu
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6">
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-stone-800">Keranjang Belanja</h1>
              <p className="text-stone-500 mt-2">Review item pesanan sebelum lanjut ke checkout.</p>
            </div>

            {cartItems.map((item) => (
              <Card
                key={item.id}
                className="p-5 border-0 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-5"
              >
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-amber-50 text-xs tracking-[0.35em] font-bold text-amber-900 px-4 py-5">
                    ITEM
                  </div>
                  <div>
                    <h2 className="font-bold text-stone-800">{item.name}</h2>
                    <p className="text-sm text-stone-500 mt-1">{item.category}</p>
                    <p className="text-sm text-stone-500">
                      Rp {item.price.toLocaleString("id-ID")} / item
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-5">
                  <div className="flex items-center gap-3">
                    <Button size="icon" variant="outline" onClick={() => handleDecrement(item)}>
                      <Minus size={16} />
                    </Button>
                    <span className="font-bold text-lg w-6 text-center">{item.quantity}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleIncrement(item)}
                      disabled={item.quantity >= item.stock}
                    >
                      <Plus size={16} />
                    </Button>
                  </div>

                  <div className="text-right min-w-36">
                    <p className="font-bold text-amber-700">
                      Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                    </p>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 text-sm inline-flex items-center gap-1 mt-2"
                    >
                      <Trash2 size={14} />
                      Hapus
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="space-y-6">
            <Card className="p-6 border-0 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="rounded-xl bg-stone-900 text-white p-3">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-stone-800">Ringkasan Belanja</h2>
                  <p className="text-sm text-stone-500">{getTotalItems()} item aktif di keranjang</p>
                </div>
              </div>

              <div className="space-y-3 border-t pt-4">
                <div className="flex justify-between text-stone-500">
                  <span>Subtotal</span>
                  <span>Rp {getTotalPrice().toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>Biaya layanan</span>
                  <span>Gratis</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-amber-900 pt-2">
                  <span>Total</span>
                  <span>Rp {getTotalPrice().toLocaleString("id-ID")}</span>
                </div>
              </div>

              <Button
                onClick={() => navigate("/checkout")}
                className="w-full mt-6 bg-amber-700 hover:bg-amber-800 text-white py-6 text-base font-bold"
              >
                Lanjut ke Checkout
              </Button>
            </Card>

            <Card className="p-6 border-0 shadow-sm bg-stone-100">
              <h3 className="font-bold text-stone-800">Alur Pemesanan</h3>
              <p className="text-sm text-stone-600 mt-3">
                Setelah checkout, Anda bisa memilih metode pembayaran lalu memantau status pesanan
                dari halaman order history.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
