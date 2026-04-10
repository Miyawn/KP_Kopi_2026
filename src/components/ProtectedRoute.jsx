import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { isAdminSession } from "../services/adminAuth"

export default function ProtectedRoute({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-stone-950 text-white">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-stone-500">Admin Access</p>
          <h1 className="mt-3 text-2xl font-bold">Memverifikasi sesi admin...</h1>
        </div>
      </div>
    )
  }

  if (!session) return <Navigate to="/admin-login" replace />
  if (!isAdminSession(session)) return <Navigate to="/admin-login" replace state={{ unauthorized: true }} />

  return children
}
