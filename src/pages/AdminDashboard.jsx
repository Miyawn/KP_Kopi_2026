import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  Activity,
  BarChart3,
  CalendarRange,
  CheckCircle2,
  ChefHat,
  Clock3,
  Download,
  ExternalLink,
  LayoutGrid,
  Package,
  RefreshCcw,
  Search,
  ShoppingBag,
  Wallet,
} from "lucide-react"
import { supabase } from "../lib/supabase"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Input } from "../components/ui/input"
import RevenueChart from "../components/RevenueChart"
import BestSellingChart from "../components/BestSellingChart"
import AdminProductManagement from "../components/AdminProductManagement"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import {
  DATE_RANGE_PRESETS,
  formatDateRangeLabel,
  getDateRangeForPreset,
  isWithinDateRange,
} from "../services/adminReporting"

const DASHBOARD_TABS = [
  { value: "overview", label: "Overview", icon: LayoutGrid },
  { value: "orders", label: "Order Queue", icon: ShoppingBag },
  { value: "inventory", label: "Inventory", icon: Package },
]

const ORDER_FILTERS = [
  { value: "all", label: "Semua" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "processing", label: "Processing" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
]

const formatCurrency = (amount) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount ?? 0)

const formatDate = (value) => {
  if (!value) return "-"

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

const getStatusClasses = (status) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "paid":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "processing":
      return "bg-purple-100 text-purple-800 border-purple-200"
    case "done":
      return "bg-green-100 text-green-800 border-green-200"
    case "expired":
      return "bg-orange-100 text-orange-800 border-orange-200"
    case "cancelled":
      return "bg-red-100 text-red-800 border-red-200"
    default:
      return "bg-stone-100 text-stone-700 border-stone-200"
  }
}

const getPaymentVerificationLabel = (order) => {
  if (order?.payment_last_status === "awaiting_confirmation") {
    return "Menunggu verifikasi bayar"
  }

  return null
}

export default function AdminDashboard() {
  const initialRange = getDateRangeForPreset("today")
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [filterStatus, setFilterStatus] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [datePreset, setDatePreset] = useState("today")
  const [startDate, setStartDate] = useState(initialRange.startDate)
  const [endDate, setEndDate] = useState(initialRange.endDate)

  const fetchDashboardData = async () => {
    setLoading(true)

    try {
      const [ordersResult, productsResult] = await Promise.all([
        supabase
          .from("orders")
          .select(`
            *,
            order_items (
              *,
              products (*)
            )
          `)
          .order("created_at", { ascending: false }),
        supabase.from("products").select("*").order("created_at", { ascending: false }),
      ])

      if (ordersResult.error) throw ordersResult.error
      if (productsResult.error) throw productsResult.error

      const nextOrders = ordersResult.data || []
      const nextProducts = productsResult.data || []

      setOrders(nextOrders)
      setProducts(nextProducts)

      if (!nextOrders.some((order) => order.id === selectedOrderId)) {
        setSelectedOrderId(nextOrders[0]?.id ?? null)
      }
    } catch (error) {
      console.error("ADMIN DASHBOARD FETCH ERROR:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()

    const orderChannel = supabase
      .channel("admin-orders-channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchDashboardData)
      .subscribe()

    const productChannel = supabase
      .channel("admin-products-channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, fetchDashboardData)
      .subscribe()

    return () => {
      supabase.removeChannel(orderChannel)
      supabase.removeChannel(productChannel)
    }
  }, [])

  const reportOrders = useMemo(
    () => orders.filter((order) => isWithinDateRange(order.created_at, startDate, endDate)),
    [orders, startDate, endDate]
  )

  const summary = useMemo(() => {
    const paidOrders = reportOrders.filter((order) => ["paid", "processing", "done"].includes(order.status))
    const grossRevenue = paidOrders.reduce((sum, order) => sum + Number(order.total_amount ?? 0), 0)

    return {
      periodOrdersCount: reportOrders.length,
      grossRevenue,
      queueCount: reportOrders.filter((order) => ["pending", "paid", "processing"].includes(order.status)).length,
      pendingCount: reportOrders.filter((order) => order.status === "pending").length,
      processingCount: reportOrders.filter((order) => order.status === "processing").length,
      completedCount: reportOrders.filter((order) => order.status === "done").length,
      lowStockCount: products.filter((product) => Number(product.stock ?? 0) <= 5).length,
      averageTicket: paidOrders.length ? grossRevenue / paidOrders.length : 0,
    }
  }, [reportOrders, products])

  const filteredOrders = useMemo(() => {
    return reportOrders.filter((order) => {
      const matchesStatus = filterStatus === "all" ? true : order.status === filterStatus
      const query = searchQuery.trim().toLowerCase()

      const matchesSearch =
        query.length === 0
          ? true
          : [order.id, order.customer_name, order.customer_phone, order.table_number, order.order_type]
              .filter(Boolean)
              .some((value) => String(value).toLowerCase().includes(query))

      return matchesStatus && matchesSearch
    })
  }, [reportOrders, filterStatus, searchQuery])

  const reportRangeLabel = useMemo(
    () => formatDateRangeLabel(startDate, endDate),
    [startDate, endDate]
  )

  const selectedOrder = useMemo(
    () => filteredOrders.find((order) => order.id === selectedOrderId) ?? filteredOrders[0] ?? null,
    [filteredOrders, selectedOrderId]
  )

  useEffect(() => {
    if (selectedOrder && selectedOrder.id !== selectedOrderId) {
      setSelectedOrderId(selectedOrder.id)
    }
  }, [selectedOrder, selectedOrderId])

  const applyDatePreset = (preset) => {
    setDatePreset(preset)

    if (preset !== "custom") {
      const nextRange = getDateRangeForPreset(preset)
      setStartDate(nextRange.startDate)
      setEndDate(nextRange.endDate)
    }
  }

  const handleStartDateChange = (value) => {
    setDatePreset("custom")
    setStartDate(value)

    if (endDate && value > endDate) {
      setEndDate(value)
    }
  }

  const handleEndDateChange = (value) => {
    setDatePreset("custom")
    setEndDate(value)

    if (startDate && value < startDate) {
      setStartDate(value)
    }
  }

  const updateStatus = async (id, status) => {
    try {
      const updatePayload = { status }

      if (status === "paid") {
        updatePayload.paid_at = new Date().toISOString()
        updatePayload.payment_last_status = "verified"
      }

      const { error } = await supabase.from("orders").update(updatePayload).eq("id", id)
      if (error) throw error
      fetchDashboardData()
    } catch (error) {
      console.error("ADMIN STATUS UPDATE ERROR:", error)
    }
  }

  const exportReport = () => {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text("Sales Report", 14, 16)
    doc.setFontSize(10)
    doc.text(`Period: ${reportRangeLabel}`, 14, 23)

    const rows = []

    reportOrders.forEach((order) => {
      ;(order.order_items || []).forEach((item) => {
        rows.push([
          order.id,
          order.customer_name || "-",
          item.products?.name || "Produk",
          item.quantity,
          `Rp ${(item.price * item.quantity).toLocaleString("id-ID")}`,
          order.status,
        ])
      })
    })

    autoTable(doc, {
      startY: 30,
      head: [["Order ID", "Customer", "Produk", "Qty", "Subtotal", "Status"]],
      body: rows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 37, 36] },
    })

    const finalY = doc.lastAutoTable?.finalY || 30
    doc.text(`Total Revenue: ${formatCurrency(summary.grossRevenue)}`, 14, finalY + 10)
    doc.save(`laporan-${startDate}-${endDate}.pdf`)
  }

  const renderOrderAction = (order) => {
    if (order.status === "pending") {
      return (
        <Button onClick={() => updateStatus(order.id, "paid")} className="bg-yellow-500 text-white hover:bg-yellow-600">
          {order.payment_last_status === "awaiting_confirmation" ? "Verifikasi Pembayaran" : "Tandai Paid"}
        </Button>
      )
    }

    if (order.status === "paid") {
      return (
        <Button onClick={() => updateStatus(order.id, "processing")} className="bg-blue-600 text-white hover:bg-blue-700">
          Mulai Proses
        </Button>
      )
    }

    if (order.status === "processing") {
      return (
        <Button onClick={() => updateStatus(order.id, "done")} className="bg-green-600 text-white hover:bg-green-700">
          Selesaikan Order
        </Button>
      )
    }

    return null
  }

  return (
    <div className="min-h-screen bg-[#f4f1ea] p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-[32px] border border-stone-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.08)] overflow-hidden">
          <div className="border-b border-stone-200 bg-stone-950 text-white px-8 py-7">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Admin Workspace</p>
                <h1 className="text-3xl font-bold mt-2">Operations Dashboard</h1>
                <p className="text-stone-400 mt-2 max-w-2xl">
                  Monitor order queue, revenue, inventory, dan akses kitchen board dari satu workspace operasional.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={fetchDashboardData} className="border-white/15 bg-white/5 text-white hover:bg-white/10">
                  <RefreshCcw />
                  Refresh
                </Button>
                <Button asChild variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10">
                  <Link to="/kitchen-display">
                    <ChefHat />
                    Kitchen Display
                    <ExternalLink />
                  </Link>
                </Button>
                <Button onClick={exportReport} className="bg-amber-700 text-white hover:bg-amber-800">
                  <Download />
                  Export Report
                </Button>
              </div>
            </div>
          </div>

          <div className="px-8 py-6">
            <div className="flex flex-wrap gap-3 mb-8">
              {DASHBOARD_TABS.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.value

                return (
                  <Button
                    key={tab.value}
                    variant={isActive ? "default" : "outline"}
                    onClick={() => setActiveTab(tab.value)}
                    className={isActive ? "bg-stone-900 text-white hover:bg-stone-800 rounded-full" : "rounded-full border-stone-200 text-stone-700"}
                  >
                    <Icon />
                    {tab.label}
                  </Button>
                )
              })}
            </div>

            <Card className="mb-8 border border-stone-200 bg-white p-5 shadow-none">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-stone-900">
                    <CalendarRange size={18} />
                    <h2 className="text-lg font-bold">Filter Periode Laporan</h2>
                  </div>
                  <p className="text-sm text-stone-500 mt-1">
                    Semua metrik, order queue, chart, dan export PDF mengikuti periode ini.
                  </p>
                </div>

                <div className="flex flex-col gap-3 xl:items-end">
                  <div className="flex flex-wrap gap-2">
                    {DATE_RANGE_PRESETS.map((preset) => (
                      <Button
                        key={preset.value}
                        variant={datePreset === preset.value ? "default" : "outline"}
                        onClick={() => applyDatePreset(preset.value)}
                        className={
                          datePreset === preset.value
                            ? "rounded-full bg-stone-900 text-white hover:bg-stone-800"
                            : "rounded-full border-stone-200 text-stone-700"
                        }
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(event) => handleStartDateChange(event.target.value)}
                      className="min-w-[180px]"
                    />
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(event) => handleEndDateChange(event.target.value)}
                      className="min-w-[180px]"
                    />
                  </div>

                  <p className="text-sm font-medium text-stone-600">Periode aktif: {reportRangeLabel}</p>
                </div>
              </div>
            </Card>

            {loading ? (
              <Card className="border border-stone-200 bg-stone-50 p-10 text-center shadow-none">
                <p className="text-stone-600 text-lg font-medium">Memuat dashboard admin...</p>
              </Card>
            ) : (
              <>
                {activeTab === "overview" && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                      <Card className="border border-stone-200 bg-white p-5 shadow-none">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-stone-500">Order Periode</p>
                            <p className="text-3xl font-bold text-stone-900 mt-2">{summary.periodOrdersCount}</p>
                          </div>
                          <div className="rounded-2xl bg-amber-50 p-3 text-amber-800"><ShoppingBag size={22} /></div>
                        </div>
                      </Card>

                      <Card className="border border-stone-200 bg-white p-5 shadow-none">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-stone-500">Revenue Periode</p>
                            <p className="text-2xl font-bold text-stone-900 mt-2">{formatCurrency(summary.grossRevenue)}</p>
                          </div>
                          <div className="rounded-2xl bg-green-50 p-3 text-green-700"><Wallet size={22} /></div>
                        </div>
                      </Card>

                      <Card className="border border-stone-200 bg-white p-5 shadow-none">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-stone-500">Active Queue</p>
                            <p className="text-3xl font-bold text-stone-900 mt-2">{summary.queueCount}</p>
                          </div>
                          <div className="rounded-2xl bg-blue-50 p-3 text-blue-700"><Clock3 size={22} /></div>
                        </div>
                      </Card>

                      <Card className="border border-stone-200 bg-white p-5 shadow-none">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-stone-500">Low Stock</p>
                            <p className="text-3xl font-bold text-stone-900 mt-2">{summary.lowStockCount}</p>
                          </div>
                          <div className="rounded-2xl bg-red-50 p-3 text-red-700"><Package size={22} /></div>
                        </div>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-6">
                      <div className="space-y-6">
                        <RevenueChart orders={reportOrders} startDate={startDate} endDate={endDate} />
                        <BestSellingChart orders={reportOrders} />
                      </div>

                      <div className="space-y-6">
                        <Card className="border border-stone-200 bg-white p-6 shadow-none">
                          <h2 className="text-lg font-bold text-stone-900">Operasional Periode</h2>
                          <div className="space-y-4 mt-5">
                            <div className="rounded-2xl bg-stone-50 p-4 flex items-center justify-between">
                              <div className="flex items-center gap-3"><Activity className="text-yellow-600" size={18} /><span className="text-stone-700">Pending payment</span></div>
                              <span className="font-bold text-stone-900">{summary.pendingCount}</span>
                            </div>
                            <div className="rounded-2xl bg-stone-50 p-4 flex items-center justify-between">
                              <div className="flex items-center gap-3"><ChefHat className="text-purple-600" size={18} /><span className="text-stone-700">Sedang diproses</span></div>
                              <span className="font-bold text-stone-900">{summary.processingCount}</span>
                            </div>
                            <div className="rounded-2xl bg-stone-50 p-4 flex items-center justify-between">
                              <div className="flex items-center gap-3"><CheckCircle2 className="text-green-600" size={18} /><span className="text-stone-700">Selesai</span></div>
                              <span className="font-bold text-stone-900">{summary.completedCount}</span>
                            </div>
                            <div className="rounded-2xl bg-stone-50 p-4 flex items-center justify-between">
                              <div className="flex items-center gap-3"><BarChart3 className="text-blue-600" size={18} /><span className="text-stone-700">Average ticket</span></div>
                              <span className="font-bold text-stone-900">{formatCurrency(summary.averageTicket)}</span>
                            </div>
                          </div>
                        </Card>

                        <Card className="border border-stone-200 bg-white p-6 shadow-none">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <h2 className="text-lg font-bold text-stone-900">Recent Orders</h2>
                              <p className="text-sm text-stone-500 mt-1">{reportRangeLabel}</p>
                            </div>
                            <Badge variant="outline" className="text-stone-600">{reportOrders.length} order</Badge>
                          </div>
                          <div className="space-y-3 mt-5">
                            {reportOrders.slice(0, 5).map((order) => (
                              <div key={order.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                                <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-stone-900">{order.customer_name || "Customer"} - {order.table_number || order.order_type}</p>
                                  <p className="text-sm text-stone-500 mt-1">{formatDate(order.created_at)}</p>
                                  {getPaymentVerificationLabel(order) && (
                                    <p className="text-xs text-amber-700 mt-2">{getPaymentVerificationLabel(order)}</p>
                                  )}
                                </div>
                                  <Badge className={getStatusClasses(order.status)}>{(order.status || "unknown").toUpperCase()}</Badge>
                                </div>
                                <div className="mt-3 flex items-center justify-between">
                                  <span className="text-sm text-stone-500">{order.order_items?.length || 0} item</span>
                                  <span className="font-bold text-amber-900">{formatCurrency(order.total_amount)}</span>
                                </div>
                              </div>
                            ))}

                            {reportOrders.length === 0 && (
                              <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
                                <p className="font-medium text-stone-700">Belum ada order pada periode ini.</p>
                              </div>
                            )}
                          </div>
                        </Card>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "orders" && (
                  <div className="space-y-6">
                    <Card className="border border-stone-200 bg-white p-5 shadow-none">
                      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                        <div>
                          <h2 className="text-xl font-bold text-stone-900">Order Queue</h2>
                          <p className="text-sm text-stone-500 mt-1">
                            Filter antrian order, pantau detail, dan ubah status operasional untuk periode {reportRangeLabel}.
                          </p>
                        </div>

                        <div className="flex flex-col md:flex-row gap-3">
                          <div className="relative min-w-[280px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                            <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Cari order, customer, meja, atau kontak" className="pl-9" />
                          </div>
                          <Button variant="outline" onClick={fetchDashboardData} className="border-stone-200">
                            <RefreshCcw />
                            Refresh
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-5">
                        {ORDER_FILTERS.map((filter) => (
                          <Button
                            key={filter.value}
                            variant={filterStatus === filter.value ? "default" : "outline"}
                            onClick={() => setFilterStatus(filter.value)}
                            className={filterStatus === filter.value ? "bg-stone-900 text-white rounded-full" : "rounded-full border-stone-200 text-stone-700"}
                          >
                            {filter.label}
                          </Button>
                        ))}
                      </div>
                    </Card>

                    <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
                      <Card className="border border-stone-200 bg-white p-4 shadow-none">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-stone-900">Daftar Order</h3>
                          <Badge variant="outline" className="text-stone-600">{filteredOrders.length} order</Badge>
                        </div>

                        <div className="space-y-3 max-h-[780px] overflow-y-auto pr-1">
                          {filteredOrders.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
                              <p className="font-medium text-stone-700">Tidak ada order yang cocok.</p>
                              <p className="text-sm text-stone-500 mt-2">Ubah filter, tanggal, atau kata kunci pencarian.</p>
                            </div>
                          ) : (
                            filteredOrders.map((order) => (
                              <button
                                key={order.id}
                                type="button"
                                onClick={() => setSelectedOrderId(order.id)}
                                className={`w-full rounded-2xl border p-4 text-left transition ${
                                  selectedOrder?.id === order.id ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-stone-50 hover:border-amber-300"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-semibold">{order.customer_name || "Customer"} - {order.table_number || order.order_type}</p>
                                    <p className={`text-sm mt-1 ${selectedOrder?.id === order.id ? "text-stone-300" : "text-stone-500"}`}>
                                      {formatDate(order.created_at)}
                                    </p>
                                    {getPaymentVerificationLabel(order) && (
                                      <p className={`text-xs mt-2 ${selectedOrder?.id === order.id ? "text-amber-200" : "text-amber-700"}`}>
                                        {getPaymentVerificationLabel(order)}
                                      </p>
                                    )}
                                  </div>
                                  <Badge className={selectedOrder?.id === order.id ? "bg-white/10 text-white border-white/10" : getStatusClasses(order.status)}>
                                    {(order.status || "unknown").toUpperCase()}
                                  </Badge>
                                </div>

                                <div className="flex items-center justify-between mt-4">
                                  <span className={`text-sm ${selectedOrder?.id === order.id ? "text-stone-300" : "text-stone-500"}`}>
                                    {order.order_items?.length || 0} item
                                  </span>
                                  <span className="font-bold">{formatCurrency(order.total_amount)}</span>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </Card>

                      <div className="space-y-6">
                        {selectedOrder ? (
                          <>
                            <Card className="border border-stone-200 bg-white p-6 shadow-none">
                              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                                <div>
                                  <p className="text-xs uppercase tracking-[0.25em] text-stone-400">Selected Order</p>
                                  <h3 className="text-2xl font-bold text-stone-900 mt-2">{selectedOrder.customer_name || "Customer"}</h3>
                                  <p className="text-stone-500 mt-2">{selectedOrder.customer_phone || "-"} - {selectedOrder.table_number || selectedOrder.order_type || "-"}</p>
                                  {getPaymentVerificationLabel(selectedOrder) && (
                                    <p className="text-sm text-amber-700 mt-3">{getPaymentVerificationLabel(selectedOrder)}</p>
                                  )}
                                </div>

                                <div className="flex flex-wrap gap-3">
                                  <Badge className={getStatusClasses(selectedOrder.status)}>{(selectedOrder.status || "unknown").toUpperCase()}</Badge>
                                  {renderOrderAction(selectedOrder)}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
                                <div className="rounded-2xl bg-stone-50 p-4">
                                  <p className="text-sm text-stone-500">Order ID</p>
                                  <p className="font-semibold text-stone-900 mt-1">{selectedOrder.id}</p>
                                </div>
                                <div className="rounded-2xl bg-stone-50 p-4">
                                  <p className="text-sm text-stone-500">Tipe Order</p>
                                  <p className="font-semibold text-stone-900 mt-1 capitalize">{selectedOrder.order_type || "-"}</p>
                                </div>
                                <div className="rounded-2xl bg-stone-50 p-4">
                                  <p className="text-sm text-stone-500">Waktu Order</p>
                                  <p className="font-semibold text-stone-900 mt-1">{formatDate(selectedOrder.created_at)}</p>
                                </div>
                                <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
                                  <p className="text-sm text-stone-500">Total</p>
                                  <p className="font-bold text-amber-900 mt-1">{formatCurrency(selectedOrder.total_amount)}</p>
                                </div>
                              </div>
                            </Card>

                            <Card className="border border-stone-200 bg-white p-6 shadow-none">
                              <h3 className="font-bold text-stone-900">Detail Item</h3>
                              <div className="space-y-3 mt-5">
                                {(selectedOrder.order_items || []).map((item) => (
                                  <div key={item.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4 flex items-center justify-between gap-4">
                                    <div>
                                      <p className="font-semibold text-stone-900">{item.products?.name || "Produk"}</p>
                                      <p className="text-sm text-stone-500">Qty {item.quantity} - Rp {Number(item.price).toLocaleString("id-ID")} / item</p>
                                    </div>
                                    <p className="font-semibold text-stone-900">{formatCurrency(item.price * item.quantity)}</p>
                                  </div>
                                ))}
                              </div>
                            </Card>

                            {selectedOrder.payment_payload?.manual_payment?.proof_data_url && (
                              <Card className="border border-stone-200 bg-white p-6 shadow-none">
                                <h3 className="font-bold text-stone-900">Bukti Pembayaran</h3>
                                <p className="mt-2 text-sm text-stone-500">
                                  {selectedOrder.payment_payload.manual_payment.proof_name || "manual-proof"}
                                </p>

                                <div className="mt-5 overflow-hidden rounded-3xl border border-stone-200 bg-stone-50 p-4">
                                  <img
                                    src={selectedOrder.payment_payload.manual_payment.proof_data_url}
                                    alt="Bukti pembayaran customer"
                                    className="max-h-[420px] w-full rounded-2xl object-contain bg-white"
                                  />
                                </div>
                              </Card>
                            )}
                          </>
                        ) : (
                          <Card className="border border-dashed border-stone-300 bg-stone-50 p-10 text-center shadow-none">
                            <p className="font-medium text-stone-700">Pilih order dari daftar sebelah kiri.</p>
                          </Card>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "inventory" && (
                  <AdminProductManagement products={products} onRefresh={fetchDashboardData} />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
