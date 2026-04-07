import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import RevenueChart from "../components/RevenueChart"
import BestSellingChart from "../components/BestSellingChart"
import AdminProductManagement from "../components/AdminProductManagement"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export default function AdminDashboard() {
  const [orders, setOrders] = useState([])
  const [filterStatus, setFilterStatus] = useState("all")
  const [activeTab, setActiveTab] = useState("orders")

  const [totalToday, setTotalToday] = useState(0)
  const [revenueToday, setRevenueToday] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)

  // ===============================
  // FETCH ORDERS
  // ===============================
  const fetchOrders = async () => {
    try {
      let query = supabase
        .from("orders")
        .select(`
          *,
          order_items (
            *,
            products (*)
          )
        `)
        .order("created_at", { ascending: false })

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus)
      }

      const { data, error } = await query
      if (error) throw error

      setOrders(data || [])
      calculateSummary(data || [])
    } catch (err) {
      console.error("FETCH ERROR:", err)
    }
  }

  const calculateSummary = (data) => {
    const today = new Date().toISOString().split("T")[0]

    const todayOrders = data.filter(order =>
      order.created_at.startsWith(today)
    )

    setTotalToday(todayOrders.length)

    const revenue = todayOrders.reduce(
      (sum, order) => sum + order.total_amount,
      0
    )

    setRevenueToday(revenue)

    const pending = data.filter(order => order.status === "pending")
    setPendingCount(pending.length)
  }

  useEffect(() => {
    fetchOrders()

    const channel = supabase
      .channel("orders-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => fetchOrders()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [filterStatus])

  const updateStatus = async (id, status) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", id)

      if (error) throw error
      fetchOrders()
    } catch (err) {
      console.error("UPDATE ERROR:", err)
    }
  }

  // ===============================
  // EXPORT REPORT
  // ===============================
  const exportTodayReport = async () => {
    const today = new Date().toISOString().split("T")[0]

    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          *,
          products (*)
        )
      `)
      .gte("created_at", today + "T00:00:00")
      .lte("created_at", today + "T23:59:59")

    if (error) return console.error(error)

    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text("Laporan Penjualan Harian", 14, 15)
    doc.setFontSize(10)
    doc.text(`Tanggal: ${today}`, 14, 22)

    const tableData = []
    let totalRevenue = 0

    data.forEach(order => {
      totalRevenue += order.total_amount

      order.order_items.forEach(item => {
        tableData.push([
          order.table_number,
          item.products.name,
          item.quantity,
          "Rp " + (item.price * item.quantity).toLocaleString("id-ID"),
        ])
      })
    })

    autoTable(doc, {
      startY: 30,
      head: [["Meja", "Produk", "Qty", "Total"]],
      body: tableData,
    })

    doc.text(
      `Total Revenue: Rp ${totalRevenue.toLocaleString("id-ID")}`,
      14,
      doc.lastAutoTable.finalY + 10
    )

    doc.save(`laporan-${today}.pdf`)
  }

  // ===============================
  // UI
  // ===============================
  return (
    <div className="min-h-screen bg-gray-50 p-8">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex gap-4 mb-6">
        <Button
          variant={activeTab === "orders" ? "default" : "outline"}
          onClick={() => setActiveTab("orders")}
        >
          Orders
        </Button>

        <Button
          variant={activeTab === "products" ? "default" : "outline"}
          onClick={() => setActiveTab("products")}
        >
          Products
        </Button>
      </div>

      {/* ========================= */}
      {/* ORDERS TAB */}
      {/* ========================= */}
      {activeTab === "orders" && (
        <>
          <Button
            onClick={exportTodayReport}
            className="bg-amber-900 text-white mb-6"
          >
            Export Laporan Hari Ini (PDF)
          </Button>

          <RevenueChart />
          <BestSellingChart />

          {/* SUMMARY */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-4">
              <p className="text-sm text-gray-500">Total Order Hari Ini</p>
              <p className="text-xl font-bold">{totalToday}</p>
            </Card>

            <Card className="p-4">
              <p className="text-sm text-gray-500">Revenue Hari Ini</p>
              <p className="text-xl font-bold">
                Rp {revenueToday.toLocaleString("id-ID")}
              </p>
            </Card>

            <Card className="p-4">
              <p className="text-sm text-gray-500">Pending Orders</p>
              <p className="text-xl font-bold text-red-600">
                {pendingCount}
              </p>
            </Card>
          </div>

          {/* ORDER LIST */}
          <div className="space-y-6">
            {orders.map(order => (
              <Card key={order.id} className="p-6">
                <div className="flex justify-between mb-4">
                  <div>
                    <p className="font-bold">Meja: {order.table_number}</p>
                    <p className="text-sm text-gray-500">
                      Status: {order.status}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {order.status === "pending" && (
                      <Button
                        onClick={() => updateStatus(order.id, "paid")}
                        className="bg-yellow-500 text-white"
                      >
                        Bayar
                      </Button>
                    )}

                    {order.status === "paid" && (
                      <Button
                        onClick={() => updateStatus(order.id, "processing")}
                        className="bg-blue-500 text-white"
                      >
                        Proses
                      </Button>
                    )}

                    {order.status === "processing" && (
                      <Button
                        onClick={() => updateStatus(order.id, "done")}
                        className="bg-green-600 text-white"
                      >
                        Selesai
                      </Button>
                    )}
                  </div>
                </div>

                <div className="border-t pt-3 space-y-2">
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

                <div className="border-t pt-3 mt-3 font-bold text-amber-900">
                  Total: Rp {order.total_amount.toLocaleString("id-ID")}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* ========================= */}
      {/* PRODUCTS TAB */}
      {/* ========================= */}
      {activeTab === "products" && (
        <AdminProductManagement />
      )}
    </div>
  )
}
