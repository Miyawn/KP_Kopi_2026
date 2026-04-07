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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">

        <h1 className="text-3xl font-bold mb-6">
          Status Pesanan
        </h1>

        <Card className="p-6 mb-6">
          <p className="text-sm text-gray-500 mb-2">
            Nomor Meja: {order.table_number}
          </p>

          <p className={`text-xl font-bold ${getStatusColor()}`}>
            {order.status.toUpperCase()}
          </p>
        </Card>

        {/* ORDER ITEMS */}
        <Card className="p-6">
          <h2 className="font-bold mb-4">
            Detail Pesanan
          </h2>

          <div className="space-y-3">
            {order.order_items.map(item => (
              <div key={item.id} className="flex justify-between">
                <span>
                  {item.products.name} x {item.quantity}
                </span>
                <span>
                  Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t mt-4 pt-4 font-bold text-amber-900">
            Total: Rp {order.total_amount.toLocaleString("id-ID")}
          </div>
        </Card>

      </div>
    </div>
  )
}