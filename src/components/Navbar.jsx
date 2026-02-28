import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { ShoppingCart } from "lucide-react"
import { useCart } from "../context/CartContext"

export default function Navbar() {
  const [session, setSession] = useState(null)
  const [pendingCount, setPendingCount] = useState(0)
  const navigate = useNavigate()

  const { cartItems } = useCart()

  const totalItems = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  )

  // ===============================
  // FETCH PENDING COUNT
  // ===============================
  const fetchPendingCount = async () => {
    const { count, error } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")

    if (!error) {
      setPendingCount(count || 0)
    }
  }

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
  // REALTIME PENDING LISTENER
  // ===============================
  useEffect(() => {
    if (!session) return

    fetchPendingCount()

    const channel = supabase
      .channel("pending-orders-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => fetchPendingCount()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session])

  // ===============================
  // LOGOUT
  // ===============================
  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate("/")
  }

  return (
    <nav className="flex justify-between items-center px-8 py-4 bg-white shadow">
      
      {/* LOGO */}
      <Link to="/" className="text-xl font-bold">
        U CAN DO IT! Coffee.
      </Link>

      {/* MENU */}
      <div className="flex items-center gap-6">

        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/contact">Contact</Link>

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
            <Link
              to="/admin-dashboard"
              className="relative flex items-center gap-2"
            >
              Admin

              {pendingCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </Link>

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
