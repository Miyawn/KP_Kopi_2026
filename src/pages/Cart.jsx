import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import CartItem from '../components/CartItem';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const { cartItems, getTotalPrice } = useCart();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/" className="flex items-center gap-2 text-amber-900 mb-6 hover:opacity-80">
          <ArrowLeft size={20} />
          Kembali ke Menu
        </Link>

        <h1 className="text-3xl font-bold text-gray-800 mb-6">Keranjang Belanja</h1>

        {cartItems.length === 0 ? (
          <Card className="p-8 text-center border-0">
            <p className="text-gray-500 text-lg mb-4">Keranjang Anda kosong</p>
            <Link
              to="/"
              className="inline-block"
            >
              <Button className="bg-amber-900 text-white hover:bg-amber-800">
                Lanjutkan Belanja
              </Button>
            </Link>
          </Card>
        ) : (
          <div>
            <div className="space-y-3 mb-6">
              {cartItems.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>

            <Card className="p-6 border-0">
              <div className="flex justify-between items-center mb-6 border-t-2 pt-4">
                <h2 className="text-2xl font-bold text-gray-800">Total:</h2>
                <p className="text-3xl font-bold text-amber-900">
                  Rp {getTotalPrice().toLocaleString('id-ID')}
                </p>
              </div>

              <Link
                to="/checkout"
                className="block"
              >
                <Button className="w-full bg-amber-900 text-white hover:bg-amber-800 py-6 text-lg">
                  Lanjut ke Checkout
                </Button>
              </Link>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
