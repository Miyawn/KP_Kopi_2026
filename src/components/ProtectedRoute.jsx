import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { validateAdminSession } from "../services/adminAuth"

export default function ProtectedRoute({ children }) {
  const [session, setSession] = useState(null)
  const [redirectState, setRedirectState] = useState(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    let authCheckTimeout = null

    const syncSession = async () => {
      const { session: nextSession, error } = await validateAdminSession()

      if (cancelled) {
        return
      }

      setSession(nextSession)
      setRedirectState(
        error === "Akun ini tidak memiliki akses admin."
          ? { unauthorized: true }
          : error
            ? { expired: true }
            : undefined
      )
      setLoading(false)
    }

    void syncSession()

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (cancelled) {
          return
        }

        if (!nextSession) {
          setSession(null)
          setRedirectState(undefined)
          setLoading(false)
          return
        }

        setLoading(true)
        if (authCheckTimeout) {
          window.clearTimeout(authCheckTimeout)
        }

        // Avoid awaiting Supabase auth calls directly inside onAuthStateChange.
        authCheckTimeout = window.setTimeout(() => {
          void syncSession()
        }, 0)
      }
    )

    return () => {
      cancelled = true
      if (authCheckTimeout) {
        window.clearTimeout(authCheckTimeout)
      }
      listener.subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-coffee-900 text-white">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-coffee-300">Admin Access</p>
          <h1 className="mt-3 text-2xl font-bold">Memverifikasi sesi admin...</h1>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/admin-login" replace state={redirectState} />
  }

  return children
}
