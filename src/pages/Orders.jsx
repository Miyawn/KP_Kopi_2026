import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { Card } from "../components/ui/card"

export default function Orders() {
  const [order, setOrder] = useState(null)

  const orderId = localStorage.getItem("lastOrderId")

  // ===============================
  // FETCH ORDER
  // ===============================
  const fetchOrder = async () => {
    if (!orderId) return

    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          *,
          products (*)
        )
      `)
      .eq("id", orderId)
      .single()

    if (!error) setOrder(data)
  }

  // ===============================
  // REALTIME LISTENER
  // ===============================
  useEffect(() => {
    fetchOrder()

    const channel = supabase
      .channel("order-tracking")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`
        },
        () => {
          fetchOrder()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // ===============================
  // UI
  // ===============================
  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Tidak ada pesanan</p>
      </div>
    )
  }

  const getStatusColor = () => {
    switch (order.status) {
      case "pending":
        return "text-yellow-500"
      case "paid":
        return "text-blue-500"
      case "processing":
        return "text-purple-500"
      case "done":
        return "text-green-600"
      default:
        return "text-gray-500"
    }
  }

  const steps = [
    { key: "pending", label: "Menunggu pembayaran" },
    { key: "paid", label: "Sudah dibayar" },
    { key: "processing", label: "Sedang diproses" },
    { key: "done", label: "Siap dinikmati" },
  ];

  return (
    <div className="min-h-screen bg-coffee-50 p-6 md:p-10">
      <div className="max-w-3xl mx-auto space-y-8">

        <div className="bg-gradient-to-r from-cream-100 via-coffee-100 to-coffee-200 rounded-3xl p-8 shadow-soft border border-coffee-100">
          <p className="uppercase tracking-[0.2em] text-xs text-coffee-600 mb-2">
            Pesanan #{order.id}
          </p>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-coffee-900">
            Status Pesanan
          </h1>
          <p className="text-coffee-700 mt-2">Nomor meja: {order.table_number || "-"}</p>
        </div>

        <Card className="p-6 space-y-6 border border-coffee-100 shadow-soft">
          <div className="flex items-center justify-between">
            <div className="text-sm text-coffee-600">Status terkini</div>
            <div className={`text-lg font-bold ${getStatusColor()}`}>
              {order.status.toUpperCase()}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {steps.map((step) => {
              const active = steps.findIndex(s => s.key === order.status) >= steps.findIndex(s => s.key === step.key);
              return (
                <div
                  key={step.key}
                  className={`flex flex-col items-center gap-2 text-center p-3 rounded-xl border ${
                    active ? "bg-white border-coffee-200 text-coffee-900" : "border-coffee-100 text-coffee-500"
                  }`}
                >
                  <div className={`h-3 w-3 rounded-full ${active ? "bg-coffee-800" : "bg-coffee-200"}`} />
                  <span className="text-xs font-semibold uppercase tracking-[0.12em]">{step.label}</span>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="p-6 border border-coffee-100 shadow-soft">
          <h2 className="font-display text-2xl font-bold text-coffee-900 mb-4">
            Detail Pesanan
          </h2>

          <div className="space-y-3">
            {order.order_items.map(item => (
              <div key={item.id} className="flex justify-between text-coffee-800">
                <span>
                  {item.products.name} x {item.quantity}
                </span>
                <span className="font-semibold">
                  Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t mt-4 pt-4 font-bold text-coffee-900 flex justify-between">
            <span>Total</span>
            <span>Rp {order.total_amount.toLocaleString("id-ID")}</span>
          </div>
        </Card>

      </div>
    </div>
  )
}
