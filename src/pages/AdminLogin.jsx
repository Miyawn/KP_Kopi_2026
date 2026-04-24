import { useEffect, useState } from "react"
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { supabase } from "../lib/supabase"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { getAdminAuthMessage, hasAdminAllowlist, validateAdminSession } from "../services/adminAuth"

export default function AdminLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [session, setSession] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()
  const unauthorizedMessage = location.state?.unauthorized
    ? "Akun ini berhasil login, tetapi belum diizinkan mengakses dashboard admin."
    : ""
  const expiredMessage = location.state?.expired
    ? "Session admin sudah berakhir atau tidak valid. Silakan login ulang."
    : ""

  useEffect(() => {
    let cancelled = false
    let authCheckTimeout = null

    const syncSession = async () => {
      const { session: nextSession } = await validateAdminSession()

      if (cancelled) {
        return
      }

      setSession(nextSession)
      setCheckingSession(false)
    }

    void syncSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (cancelled) {
        return
      }

      if (!nextSession) {
        setSession(null)
        setCheckingSession(false)
        return
      }

      if (authCheckTimeout) {
        window.clearTimeout(authCheckTimeout)
      }

      // Avoid awaiting Supabase auth calls directly inside onAuthStateChange.
      authCheckTimeout = window.setTimeout(() => {
        void syncSession()
      }, 0)
    })

    return () => {
      cancelled = true
      if (authCheckTimeout) {
        window.clearTimeout(authCheckTimeout)
      }
      listener.subscription.unsubscribe()
    }
  }, [])

  const handleLogin = async (event) => {
    event.preventDefault()
    setLoading(true)
    setErrorMessage("")

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      setLoading(false)
      setErrorMessage("Login gagal. Periksa email dan password admin Anda.")
      return
    }

    const { session: validatedSession, error: validationError } = await validateAdminSession()

    if (!validatedSession) {
      setLoading(false)
      setErrorMessage(validationError || "Akun ini bukan admin yang diizinkan.")
      return
    }

    setSession(validatedSession)
    navigate("/admin-dashboard", { replace: true })
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen grid place-items-center bg-coffee-900 text-white">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-coffee-300">Admin Access</p>
          <h1 className="mt-3 text-2xl font-bold">Memverifikasi sesi admin...</h1>
        </div>
      </div>
    )
  }

  if (session) {
    return <Navigate to="/admin-dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(161,98,7,0.20),_transparent_34%),linear-gradient(135deg,#3f2a1f_0%,#5d3b2a_45%,#8a5a3b_100%)] px-4 py-10">
      <div className="mx-auto max-w-xl">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-white/90 hover:text-white">
          <ArrowLeft size={18} />
          Kembali ke Home
        </Link>

        <Card className="rounded-[32px] border border-coffee-200 bg-white p-8 shadow-[0_30px_80px_rgba(60,40,20,0.14)]">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.3em] text-coffee-400">Secure Sign In</p>
            <h2 className="mt-3 text-3xl font-bold text-coffee-900">Admin Login</h2>
            <p className="mt-2 text-sm text-coffee-500">
              {hasAdminAllowlist()
                ? "Gunakan email admin yang sudah didaftarkan di konfigurasi aplikasi."
                : "Allowlist email admin belum diisi. Login admin akan ditolak sampai konfigurasi dilengkapi."}
            </p>
            <p className="mt-2 text-xs text-coffee-400">{getAdminAuthMessage()}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email Admin</Label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@kpkopi.com"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Masukkan password"
                autoComplete="current-password"
              />
            </div>

            {errorMessage && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            {!errorMessage && (unauthorizedMessage || expiredMessage) && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {unauthorizedMessage || expiredMessage}
              </div>
            )}

            <Button type="submit" disabled={loading} className="h-11 w-full bg-coffee-900 text-white hover:bg-coffee-800">
              {loading ? "Memproses login..." : "Masuk ke Dashboard"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
