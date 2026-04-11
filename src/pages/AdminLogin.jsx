import { useEffect, useState } from "react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import { LockKeyhole, ShieldCheck } from "lucide-react"
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
      <div className="min-h-screen grid place-items-center bg-stone-950 text-white">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-stone-500">Admin Access</p>
          <h1 className="mt-3 text-2xl font-bold">Memverifikasi sesi admin...</h1>
        </div>
      </div>
    )
  }

  if (session) {
    return <Navigate to="/admin-dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(217,119,6,0.14),_transparent_32%),linear-gradient(135deg,#0f172a_0%,#111827_45%,#292524_100%)] px-4 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.35)] backdrop-blur">
          <p className="text-xs uppercase tracking-[0.35em] text-amber-300">Admin Workspace</p>
          <h1 className="mt-4 max-w-xl text-4xl font-bold leading-tight">
            Login dashboard operasional yang lebih rapi untuk kasir, bar, dan kitchen.
          </h1>
          <p className="mt-4 max-w-2xl text-stone-300">
            Akses admin sekarang dipisahkan lebih jelas dari halaman customer, dengan proteksi session dan validasi akun admin.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <ShieldCheck className="text-amber-300" />
              <h2 className="mt-4 text-lg font-semibold">Akses Admin</h2>
              <p className="mt-2 text-sm text-stone-300">
                {getAdminAuthMessage()}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <LockKeyhole className="text-amber-300" />
              <h2 className="mt-4 text-lg font-semibold">Session Terproteksi</h2>
              <p className="mt-2 text-sm text-stone-300">
                Route admin dan kitchen display hanya bisa dibuka lewat session admin yang valid.
              </p>
            </div>
          </div>
        </div>

        <Card className="self-center rounded-[32px] border border-stone-200 bg-white p-8 shadow-[0_30px_80px_rgba(15,23,42,0.16)]">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Secure Sign In</p>
            <h2 className="mt-3 text-3xl font-bold text-stone-900">Admin Login</h2>
            <p className="mt-2 text-sm text-stone-500">
              {hasAdminAllowlist()
                ? "Gunakan email admin yang sudah didaftarkan di konfigurasi aplikasi."
                : "Allowlist email admin belum diisi. Login admin akan ditolak sampai konfigurasi dilengkapi."}
            </p>
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

            <Button type="submit" disabled={loading} className="h-11 w-full bg-stone-900 text-white hover:bg-stone-800">
              {loading ? "Memproses login..." : "Masuk ke Dashboard"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
