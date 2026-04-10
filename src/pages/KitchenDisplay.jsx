import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, CheckCircle2, ChefHat, Clock3, RefreshCcw } from "lucide-react"
import { supabase } from "../lib/supabase"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Card } from "../components/ui/card"

const BOARD_COLUMNS = [
  { key: "pending", label: "Menunggu Bayar", tone: "border-yellow-400/30 bg-yellow-400/10 text-yellow-200" },
  { key: "paid", label: "Masuk Kitchen", tone: "border-blue-400/30 bg-blue-400/10 text-blue-200" },
  { key: "processing", label: "Sedang Dibuat", tone: "border-purple-400/30 bg-purple-400/10 text-purple-200" },
  { key: "done", label: "Siap Disajikan", tone: "border-green-400/30 bg-green-400/10 text-green-200" },
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
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [clock, setClock] = useState(new Date())

  const fetchOrders = async () => {
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            *,
            products (*)
          )
        `)
        .in("status", ["pending", "paid", "processing", "done"])
        .order("created_at", { ascending: true })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error("KITCHEN DISPLAY FETCH ERROR:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()

    const channel = supabase
      .channel("kitchen-display-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchOrders)
      .subscribe()

    const interval = window.setInterval(() => {
      setClock(new Date())
    }, 1000)

    return () => {
      supabase.removeChannel(channel)
      window.clearInterval(interval)
    }
  }, [])

  const columns = useMemo(() => {
    return BOARD_COLUMNS.map((column) => ({
      ...column,
      orders: orders.filter((order) => order.status === column.key),
    }))
  }, [orders])

  const updateStatus = async (id, status) => {
    try {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id)
      if (error) throw error
      fetchOrders()
    } catch (error) {
      console.error("KITCHEN DISPLAY STATUS ERROR:", error)
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(145deg,#0f172a_0%,#111827_45%,#1c1917_100%)] p-5 text-white md:p-7">
      <div className="mx-auto max-w-[1700px]">
        <div className="mb-6 flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/5 px-6 py-5 shadow-[0_25px_70px_rgba(15,23,42,0.35)] backdrop-blur lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-amber-300">Kitchen Display</p>
            <h1 className="mt-2 text-3xl font-bold">Realtime Production Board</h1>
            <p className="mt-2 text-sm text-stone-300">
              Monitor tiket masuk, proses pembuatan, dan order siap saji tanpa buka dashboard utama.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-[0.25em] text-stone-400">Live Clock</p>
              <p className="mt-1 text-xl font-semibold">{clock.toLocaleTimeString("id-ID")}</p>
            </div>
            <Button variant="outline" onClick={fetchOrders} className="border-white/15 bg-white/5 text-white hover:bg-white/10">
              <RefreshCcw />
              Refresh
            </Button>
            <Button asChild variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10">
              <Link to="/admin-dashboard">
                <ArrowLeft />
                Dashboard
              </Link>
            </Button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
          {columns.map((column) => (
            <Card key={column.key} className="border border-white/10 bg-white/5 p-5 text-white shadow-none">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-stone-400">{column.label}</p>
                  <p className="mt-2 text-3xl font-bold">{column.orders.length}</p>
                </div>
                <div className={`rounded-2xl border px-3 py-2 ${column.tone}`}>
                  <ChefHat size={18} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {loading ? (
          <Card className="border border-white/10 bg-white/5 p-16 text-center text-white shadow-none">
            <p className="text-lg font-medium">Memuat kitchen board...</p>
          </Card>
        ) : (
          <div className="grid gap-5 xl:grid-cols-4">
            {columns.map((column) => (
              <div key={column.key} className="rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.22)]">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">{column.label}</h2>
                    <p className="mt-1 text-sm text-stone-400">{column.orders.length} tiket aktif</p>
                  </div>
                  <Badge className={column.tone}>{column.orders.length}</Badge>
                </div>

                <div className="max-h-[calc(100vh-19rem)] space-y-4 overflow-y-auto pr-1">
                  {column.orders.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-white/10 bg-black/10 p-8 text-center">
                      <p className="font-medium text-stone-300">Tidak ada tiket.</p>
                    </div>
                  ) : (
                    column.orders.map((order) => (
                      <Card key={order.id} className="rounded-3xl border border-white/10 bg-[#111827] p-5 text-white shadow-none">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.25em] text-stone-500">Order ID</p>
                            <h3 className="mt-2 text-lg font-bold">{order.id}</h3>
                          </div>
                          <Badge className={column.tone}>{(order.status || "unknown").toUpperCase()}</Badge>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                          <div className="rounded-2xl bg-white/5 p-3">
                            <p className="text-stone-400">Customer</p>
                            <p className="mt-1 font-medium text-white">{order.customer_name || "Customer"}</p>
                          </div>
                          <div className="rounded-2xl bg-white/5 p-3">
                            <p className="text-stone-400">Waktu</p>
                            <p className="mt-1 font-medium text-white">{formatTime(order.created_at)}</p>
                          </div>
                        </div>

                        <div className="mt-4 space-y-3">
                          {(order.order_items || []).map((item) => (
                            <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="font-semibold">{item.products?.name || "Produk"}</p>
                                  <p className="mt-1 text-sm text-stone-400">Qty {item.quantity}</p>
                                </div>
                                <p className="text-sm font-medium text-stone-300">
                                  {formatCurrency(item.price * item.quantity)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          {order.status === "paid" && (
                            <Button onClick={() => updateStatus(order.id, "processing")} className="bg-blue-600 text-white hover:bg-blue-700">
                              <Clock3 />
                              Mulai Proses
                            </Button>
                          )}

                          {order.status === "processing" && (
                            <Button onClick={() => updateStatus(order.id, "done")} className="bg-green-600 text-white hover:bg-green-700">
                              <CheckCircle2 />
                              Tandai Siap
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
