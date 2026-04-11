import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { Clock3, ShoppingCart } from "lucide-react"
import { useCart } from "../context/CartContext"
import { isAdminSession } from "../services/adminAuth"

export default function Navbar() {
  const [session, setSession] = useState(null)
  const navigate = useNavigate()

  const { getTotalItems } = useCart()
  const totalItems = getTotalItems()
  const adminSession = isAdminSession(session)

  // ===============================
  // AUTH LISTENER
  // ===============================
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  // ===============================
  // LOGOUT
  // ===============================
  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate("/")
  }

  return (
    <nav className="flex justify-between items-center px-8 py-4 bg-white shadow sticky top-0 z-50">
      
      {/* LOGO */}
      <Link to="/" className="text-xl font-bold text-stone-900">
        KP Kopi Web Order
      </Link>

      {/* MENU */}
      <div className="flex items-center gap-6">

        <Link to="/">Menu</Link>
        <Link to="/about">About</Link>
        <Link to="/contact">Contact</Link>
        <Link to="/orders" className="inline-flex items-center gap-2">
          <Clock3 size={16} />
          Order History
        </Link>

        {/* ===============================
            CUSTOMER CART
        =============================== */}
        {!session && (
          <Link to="/cart" className="relative">
            <ShoppingCart className="w-6 h-6 text-gray-700 hover:text-amber-700 transition" />

            {totalItems > 0 && (
              <span className="absolute -top-2 -right-3 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                {totalItems}
              </span>
            )}
          </Link>
        )}

        {/* ===============================
            ADMIN SECTION
        =============================== */}
        {!session ? (
          <button
            onClick={() => navigate("/admin-login")}
            className="bg-amber-900 text-white px-4 py-2 rounded"
          >
            Login
          </button>
        ) : (
          <>
            {adminSession && (
              <Link to="/admin-dashboard" className="relative flex items-center gap-2">
                Admin
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  )
}
