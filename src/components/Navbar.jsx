import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Button } from './ui/button';

export default function Navbar({ isAdmin, setIsAdmin }) {
  const { cartItems } = useCart();
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center gap-8">
          {/* Logo */}
          <Link to={isAdmin ? '/admin-dashboard' : '/'} className="text-2xl font-bold text-gray-900 hover:text-amber-700 transition">
            ☕ Latte & Co.
          </Link>

          {/* Navigation Links */}
          {!isAdmin && (
            <div className="hidden md:flex gap-8">
              <Link to="/" className="text-gray-700 hover:text-amber-700 font-medium transition">
                Home
              </Link>
              <Link to="/#menu" className="text-gray-700 hover:text-amber-700 font-medium transition">
                Menu
              </Link>
              <Link to="/about" className="text-gray-700 hover:text-amber-700 font-medium transition">
                About
              </Link>
              <Link to="/contact" className="text-gray-700 hover:text-amber-700 font-medium transition">
                Contact
              </Link>
            </div>
          )}

          {/* Right Side Actions */}
          <div className="flex gap-4 items-center">
            {!isAdmin && (
              <Link to="/cart" className="relative hover:opacity-70 transition">
                <ShoppingCart size={24} className="text-gray-700" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-amber-700 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {!isAdmin ? (
              <Button
                onClick={() => setIsAdmin(true)}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                Admin
              </Button>
            ) : (
              <Button
                onClick={() => setIsAdmin(false)}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                Customer
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
