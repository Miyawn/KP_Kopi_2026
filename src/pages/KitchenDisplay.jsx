import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, CheckCircle2, ChefHat, Clock3, RefreshCcw } from "lucide-react"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Card } from "../components/ui/card"
import {
  fetchAdminDashboardData,
  updateAdminOrderStatus,
} from "../services/adminBackendService"
import {
  ADMIN_FUNCTION_ERROR_CODES,
  isAdminAuthError,
} from "../services/adminFunctionClient"
import { supabase } from "../lib/supabase"

const BOARD_COLUMNS = [
  { key: "pending", label: "Menunggu Bayar", tone: "border-amber-300 bg-amber-50 text-amber-800" },
  { key: "paid", label: "Masuk Kitchen", tone: "border-coffee-300 bg-coffee-100 text-coffee-800" },
  { key: "processing", label: "Sedang Dibuat", tone: "border-orange-300 bg-orange-50 text-orange-800" },
  { key: "done", label: "Siap Disajikan", tone: "border-green-300 bg-green-50 text-green-800" },
]

const formatCurrency = (amount) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount ?? 0)

const formatTime = (value) =>
  new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))

export default function KitchenDisplay() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [clock, setClock] = useState(new Date())
  const [loadError, setLoadError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [orderActionState, setOrderActionState] = useState({ orderId: null, action: "" })

  const handleAdminAuthFailure = useCallback(async (error) => {
    if (!isAdminAuthError(error)) {
      return false
    }

    await supabase.auth.signOut()
    navigate("/admin-login", {
      replace: true,
      state: error?.code === ADMIN_FUNCTION_ERROR_CODES.ACCESS_DENIED ? { unauthorized: true } : { expired: true },
    })
    return true
  }, [navigate])

  const fetchOrders = useCallback(async () => {
    setLoading(true)

    try {
      const data = await fetchAdminDashboardData()
      const queueOrders = (data.orders || [])
        .filter((order) => ["pending", "paid", "processing", "done"].includes(order.status))
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

      setOrders(queueOrders)
      setLoadError("")
    } catch (error) {
      console.error("KITCHEN DISPLAY FETCH ERROR:", error)
      if (await handleAdminAuthFailure(error)) {
        return
      }
      setLoadError(error.message || "Gagal memuat kitchen board.")
    } finally {
      setLoading(false)
    }
  }, [handleAdminAuthFailure])

  useEffect(() => {
    void fetchOrders()

    const clockInterval = window.setInterval(() => {
      setClock(new Date())
    }, 1000)

    const refreshInterval = window.setInterval(() => {
      void fetchOrders()
    }, 15000)

    return () => {
      window.clearInterval(clockInterval)
      window.clearInterval(refreshInterval)
    }
  }, [fetchOrders])

  useEffect(() => {
    if (!successMessage) return

    const timeoutId = window.setTimeout(() => {
      setSuccessMessage("")
    }, 4000)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [successMessage])

  const columns = useMemo(() => {
    return BOARD_COLUMNS.map((column) => ({
      ...column,
      orders: orders.filter((order) => order.status === column.key),
    }))
  }, [orders])

  const updateStatus = async (id, status) => {
    if (!id || !status) return

    try {
      setOrderActionState({ orderId: id, action: status })
      setLoadError("")
      setSuccessMessage("")
      await updateAdminOrderStatus({ orderId: id, status })
      await fetchOrders()
      setSuccessMessage(
        status === "processing"
          ? "Order berhasil dipindahkan ke proses kitchen."
          : "Order berhasil ditandai siap disajikan."
      )
    } catch (error) {
      console.error("KITCHEN DISPLAY STATUS ERROR:", error)
      if (await handleAdminAuthFailure(error)) {
        return
      }
      setLoadError(error.message || "Gagal mengubah status order.")
    } finally {
      setOrderActionState({ orderId: null, action: "" })
    }
  }

  return (
    <div className="min-h-screen bg-coffee-50 p-5 text-coffee-900 md:p-7">
      <div className="mx-auto max-w-[1700px]">
        <div className="mb-6 flex flex-col gap-4 rounded-[28px] border border-coffee-200 bg-white px-6 py-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-coffee-500">Kitchen Display</p>
            <h1 className="mt-2 text-3xl font-bold">Realtime Production Board</h1>
            <p className="mt-2 text-sm text-coffee-500">
              Monitor tiket masuk, proses pembuatan, dan order siap saji tanpa buka dashboard utama.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-coffee-200 bg-coffee-50 px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-[0.25em] text-coffee-400">Live Clock</p>
              <p className="mt-1 text-xl font-semibold">{clock.toLocaleTimeString("id-ID")}</p>
            </div>
            <Button variant="outline" onClick={fetchOrders} className="border-coffee-200 bg-white text-coffee-800 hover:bg-coffee-50">
              <RefreshCcw />
              Refresh
            </Button>
            <Button asChild variant="outline" className="border-coffee-200 bg-white text-coffee-800 hover:bg-coffee-50">
              <Link to="/admin-dashboard">
                <ArrowLeft />
                Dashboard
              </Link>
            </Button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
          {columns.map((column) => (
            <Card key={column.key} className="border border-coffee-200 bg-white p-5 shadow-none">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-coffee-500">{column.label}</p>
                  <p className="mt-2 text-3xl font-bold">{column.orders.length}</p>
                </div>
                <div className={`rounded-2xl border px-3 py-2 ${column.tone}`}>
                  <ChefHat size={18} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {successMessage && (
          <Card className="mb-6 border border-green-300 bg-green-50 p-5 shadow-none">
            <p className="font-medium text-green-800">{successMessage}</p>
            <p className="mt-2 text-sm text-green-700">
              Kitchen board sudah disegarkan dengan status terbaru.
            </p>
          </Card>
        )}

        {loadError && (
          <Card className="mb-6 border border-red-300 bg-red-50 p-5 shadow-none">
            <p className="font-medium text-red-800">{loadError}</p>
            <p className="mt-2 text-sm text-red-700">
              Coba refresh board. Jika masih gagal, login ulang agar session admin diperbarui.
            </p>
          </Card>
        )}

        {loading ? (
          <Card className="border border-coffee-200 bg-white p-16 text-center shadow-none">
            <p className="text-lg font-medium">Memuat kitchen board...</p>
          </Card>
        ) : (
          <div className="grid gap-5 xl:grid-cols-4">
            {columns.map((column) => (
              <div key={column.key} className="rounded-[28px] border border-coffee-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">{column.label}</h2>
                    <p className="mt-1 text-sm text-coffee-400">{column.orders.length} tiket aktif</p>
                  </div>
                  <Badge className={column.tone}>{column.orders.length}</Badge>
                </div>

                <div className="max-h-[calc(100vh-19rem)] space-y-4 overflow-y-auto pr-1">
                  {column.orders.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-coffee-300 bg-coffee-50 p-8 text-center">
                      <p className="font-medium text-coffee-500">Tidak ada tiket.</p>
                    </div>
                  ) : (
                    column.orders.map((order) => (
                      <Card key={order.id} className="rounded-3xl border border-coffee-200 bg-coffee-50 p-5 shadow-none">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.25em] text-coffee-500">Order ID</p>
                            <h3 className="mt-2 text-lg font-bold">{order.id}</h3>
                          </div>
                          <Badge className={column.tone}>{(order.status || "unknown").toUpperCase()}</Badge>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                          <div className="rounded-2xl bg-white p-3 border border-coffee-200">
                            <p className="text-coffee-400">Customer</p>
                            <p className="mt-1 font-medium text-coffee-900">{order.customer_name || "Customer"}</p>
                          </div>
                          <div className="rounded-2xl bg-white p-3 border border-coffee-200">
                            <p className="text-coffee-400">Waktu</p>
                            <p className="mt-1 font-medium text-coffee-900">{formatTime(order.created_at)}</p>
                          </div>
                        </div>

                        <div className="mt-4 space-y-3">
                          {(order.order_items || []).map((item) => (
                            <div key={item.id} className="rounded-2xl border border-coffee-200 bg-white px-4 py-3">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="font-semibold">{item.products?.name || "Produk"}</p>
                                  <p className="mt-1 text-sm text-coffee-500">Qty {item.quantity}</p>
                                </div>
                                <p className="text-sm font-medium text-coffee-600">
                                  {formatCurrency(item.price * item.quantity)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          {order.status === "paid" && (
                            <Button
                              type="button"
                              onClick={() => updateStatus(order.id, "processing")}
                              disabled={orderActionState.orderId === order.id}
                              className="bg-blue-600 text-white hover:bg-blue-700"
                            >
                              <Clock3 />
                              {orderActionState.orderId === order.id ? "Memproses..." : "Mulai Proses"}
                            </Button>
                          )}

                          {order.status === "processing" && (
                            <Button
                              type="button"
                              onClick={() => updateStatus(order.id, "done")}
                              disabled={orderActionState.orderId === order.id}
                              className="bg-green-600 text-white hover:bg-green-700"
                            >
                              <CheckCircle2 />
                              {orderActionState.orderId === order.id ? "Memproses..." : "Tandai Siap"}
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
