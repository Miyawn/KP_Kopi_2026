import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { Clock3, ShoppingCart } from "lucide-react"
import { useCart } from "../context/CartContext"
import { isAdminSession } from "../services/adminAuth"
import logo from "../assets/LOGO_UCANDOIT_TRANS.png"

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
    <div className="fixed top-4 left-0 right-0 z-40 px-4" style={{ transition: "transform 0.6s ease, opacity 0.6s ease" }}>
      <nav
        className={
          "flex items-center justify-between w-full px-6 md:px-10 py-3 transform-gpu transition-[background-color,border-color,backdrop-filter,box-shadow,transform] duration-700 ease-[0.25,1,0.5,1] bg-white/70 backdrop-blur-2xl  shadow-xl shadow-coffee-900/10 rounded-2xl"
        }
      >
      
      {/* LOGO */}
      <Link to="/" className="flex items-center gap-3 text-xl font-bold">
        <img
          src={logo}
          className="h-15 w-15"
        />
        
      </Link>

      {/* MENU */}
      <div className="flex items-center gap-6 text-coffee-800">

        <Link className="hover:text-coffee-600 transition-colors" to="/">Menu</Link>
        <Link className="hover:text-coffee-600 transition-colors" to="/about">About</Link>
        <Link className="hover:text-coffee-600 transition-colors" to="/contact">Contact</Link>
        <Link className="hover:text-coffee-600 transition-colors" to="/orders" className="inline-flex items-center gap-2">
          <Clock3 size={16} />
          Order History
        </Link>

        {/* ===============================
            CUSTOMER CART
        =============================== */}
        {!session && (
          <Link to="/cart" className="relative">
            <ShoppingCart className="w-6 h-6 text-coffee-800 hover:text-coffee-600 transition" />

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
            className="bg-coffee-900 text-white px-4 py-2 rounded-md shadow-sm hover:bg-coffee-800 transition"
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
              className="bg-red-500 text-white px-4 py-2 rounded-md shadow-sm hover:bg-red-600 transition"
            >
              Logout
            </button>
          </>
        )}
      </div>
      </nav>
    </div>
  )
}
