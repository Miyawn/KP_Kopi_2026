import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useCart } from '../context/CartContext';
import { supabase } from "../lib/supabase"

export default function Checkout() {
  const { cartItems, getTotalPrice, clearCart } = useCart();
  const [tableNumber, setTableNumber] = useState('');
  const [orderSubmitted, setOrderSubmitted] = useState(false);

  const handleSubmitOrder = async (e) => {
  e.preventDefault()

    try {

      const formattedItems = cartItems.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price
      }))

      const { data, error } = await supabase.rpc(
        "create_order_with_items",
        {
          p_table: tableNumber,
          p_customer_name: "Customer",
          p_customer_phone: "-",
          p_order_type: "dine-in",
          p_items: formattedItems,
        }
      )

      if (error) throw error

      setOrderSubmitted(true)
      clearCart()

    } catch (err) {
      console.error("ORDER ERROR:", err)
      alert(err.message || "Terjadi kesalahan")
    }
  }

  if (cartItems.length === 0 && !orderSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md border-0">
          <p className="text-gray-500 text-lg mb-4">Tidak ada pesanan</p>
          <Link to="/">
            <Button className="bg-amber-900 text-white hover:bg-amber-800">
              Kembali ke Menu
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (orderSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md border-0">
          <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Pesanan Berhasil!</h1>
          <p className="text-gray-600 mb-6">
            Pesanan Anda telah diterima dan akan segera disiapkan.
          </p>
          <Link to="/">
            <Button className="w-full bg-amber-900 text-white hover:bg-amber-800">
              Kembali ke Menu
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/cart" className="flex items-center gap-2 text-amber-900 mb-6 hover:opacity-80">
          <ArrowLeft size={20} />
          Kembali ke Keranjang
        </Link>

        <h1 className="text-3xl font-bold text-gray-800 mb-6">Checkout</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Order Summary */}
          <div className="md:col-span-2">
            <Card className="p-6 border-0">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Ringkasan Pesanan</h2>
              <div className="space-y-3 mb-4 border-b pb-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span className="text-gray-700">
                      {item.name} x {item.quantity}
                    </span>
                    <span className="font-semibold text-gray-800">
                      Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-lg font-bold text-amber-900">
                <span>Total:</span>
                <span>Rp {getTotalPrice().toLocaleString('id-ID')}</span>
              </div>
            </Card>
          </div>

          {/* Form */}
          <div className="md:col-span-1">
            <Card className="p-6 border-0">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Detail Pesanan</h2>

              <form onSubmit={handleSubmitOrder}>
                <div className="mb-6">
                  <Label htmlFor="tableNumber">Nomor Meja</Label>
                  <Input
                    id="tableNumber"
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Contoh: A1"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-amber-900 text-white hover:bg-amber-800 py-6 text-base font-bold"
                >
                  Pesan Sekarang
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
