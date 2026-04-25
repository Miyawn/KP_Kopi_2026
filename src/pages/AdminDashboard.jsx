import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  Activity,
  ArrowLeft,
  CalendarRange,
  CheckCircle2,
  ChefHat,
  Clock3,
  Download,
  ExternalLink,
  LogOut,
  Package,
  RefreshCcw,
  Search,
  ShoppingBag,
  Wallet,
} from "lucide-react"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Input } from "../components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog"
import RevenueChart from "../components/RevenueChart"
import BestSellingChart from "../components/BestSellingChart"
import AdminProductManagement from "../components/AdminProductManagement"
import { reviewOrderPayment } from "../services/adminOrderService"
import {
  fetchAdminDashboardData,
  updateAdminOrderStatus,
} from "../services/adminBackendService"
import {
  ADMIN_FUNCTION_ERROR_CODES,
  isAdminAuthError,
} from "../services/adminFunctionClient"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { supabase } from "../lib/supabase"
import {
  DATE_RANGE_PRESETS,
  formatDateRangeLabel,
  getDateRangeForPreset,
  isWithinDateRange,
} from "../services/adminReporting"

const DASHBOARD_TABS = [
  { value: "operations", label: "Operations", icon: Activity },
  { value: "reporting", label: "Reporting", icon: CalendarRange },
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
      return "bg-coffee-100 text-coffee-700 border-coffee-200"
  }
}

const getPaymentVerificationLabel = (order) => {
  if (order?.payment_last_status === "awaiting_confirmation") {
    return "Menunggu verifikasi bayar"
  }

  if (order?.payment_last_status === "rejected") {
    return "Pembayaran ditolak, menunggu kirim ulang"
  }

  return null
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const initialRange = getDateRangeForPreset("today")
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("operations")
  const [filterStatus, setFilterStatus] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [paymentActionDialog, setPaymentActionDialog] = useState(null)
  const [paymentActionReason, setPaymentActionReason] = useState("")
  const [paymentActionLoading, setPaymentActionLoading] = useState(false)
  const [datePreset, setDatePreset] = useState("today")
  const [startDate, setStartDate] = useState(initialRange.startDate)
  const [endDate, setEndDate] = useState(initialRange.endDate)
  const [loadError, setLoadError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [orderActionState, setOrderActionState] = useState({ orderId: null, action: "" })

  const handleAdminAuthFailure = async (error) => {
    if (!isAdminAuthError(error)) {
      return false
    }

    await supabase.auth.signOut()
    navigate("/admin-login", {
      replace: true,
      state: error?.code === ADMIN_FUNCTION_ERROR_CODES.ACCESS_DENIED ? { unauthorized: true } : { expired: true },
    })
    return true
  }

  const syncDashboardData = async () => {
    const data = await fetchAdminDashboardData()
    const nextOrders = data.orders || []
    const nextProducts = data.products || []

    setOrders(nextOrders)
    setProducts(nextProducts)
    setSelectedOrderId((currentValue) =>
      nextOrders.some((order) => order.id === currentValue) ? currentValue : nextOrders[0]?.id ?? null
    )
  }

  const fetchDashboardData = async () => {
    setLoading(true)

    try {
      await syncDashboardData()
      setLoadError("")
    } catch (error) {
      console.error("ADMIN DASHBOARD FETCH ERROR:", error)
      if (await handleAdminAuthFailure(error)) {
        return
      }
      setLoadError(error.message || "Gagal memuat dashboard admin.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    const refreshDashboard = async () => {
      try {
        const data = await fetchAdminDashboardData()

        if (cancelled) return

        const nextOrders = data.orders || []
        const nextProducts = data.products || []

        setOrders(nextOrders)
        setProducts(nextProducts)
        setSelectedOrderId((currentValue) =>
          nextOrders.some((order) => order.id === currentValue) ? currentValue : nextOrders[0]?.id ?? null
        )
        setLoadError("")
      } catch (error) {
        if (!cancelled) {
          console.error("ADMIN DASHBOARD FETCH ERROR:", error)
          if (await handleAdminAuthFailure(error)) {
            return
          }
          setLoadError(error.message || "Gagal memuat dashboard admin.")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void refreshDashboard()
    const interval = window.setInterval(() => {
      void refreshDashboard()
    }, 15000)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (!successMessage) return

    const timeoutId = window.setTimeout(() => {
      setSuccessMessage("")
    }, 4000)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [successMessage])

  const reportOrders = useMemo(
    () => orders.filter((order) => isWithinDateRange(order.created_at, startDate, endDate)),
    [orders, startDate, endDate]
  )

  const reportSummary = useMemo(() => {
    const paidOrders = reportOrders.filter((order) => ["paid", "processing", "done"].includes(order.status))
    const grossRevenue = paidOrders.reduce((sum, order) => sum + Number(order.total_amount ?? 0), 0)

    return {
      periodOrdersCount: reportOrders.length,
      paidOrdersCount: paidOrders.length,
      grossRevenue,
      averageTicket: paidOrders.length ? grossRevenue / paidOrders.length : 0,
    }
  }, [reportOrders])

  const operationsSummary = useMemo(
    () => ({
      queueCount: orders.filter((order) => ["pending", "paid", "processing"].includes(order.status)).length,
      pendingCount: orders.filter((order) => order.status === "pending").length,
      paidCount: orders.filter((order) => order.status === "paid").length,
      processingCount: orders.filter((order) => order.status === "processing").length,
      paymentConfirmationCount: orders.filter(
        (order) => order.status === "pending" && order.payment_last_status === "awaiting_confirmation"
      ).length,
    }),
    [orders]
  )

  const inventorySummary = useMemo(
    () => ({
      lowStockCount: products.filter((product) => Number(product.stock ?? 0) <= 5).length,
    }),
    [products]
  )

  const liveQueueOrders = useMemo(() => {
    return orders.filter((order) => {
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
  }, [orders, filterStatus, searchQuery])

  const reportRangeLabel = useMemo(
    () => formatDateRangeLabel(startDate, endDate),
    [startDate, endDate]
  )

  const pendingPaymentConfirmations = useMemo(
    () =>
      orders.filter(
        (order) => order.status === "pending" && order.payment_last_status === "awaiting_confirmation"
      ),
    [orders]
  )

  const liveRecentOrders = useMemo(() => orders.slice(0, 5), [orders])
  const reportRecentOrders = useMemo(() => reportOrders.slice(0, 5), [reportOrders])

  const selectedOrder = useMemo(
    () => liveQueueOrders.find((order) => order.id === selectedOrderId) ?? liveQueueOrders[0] ?? null,
    [liveQueueOrders, selectedOrderId]
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
    if (!id || !status) return

    try {
      setOrderActionState({ orderId: id, action: status })
      setLoadError("")
      setSuccessMessage("")
      await updateAdminOrderStatus({ orderId: id, status })
      await fetchDashboardData()
      setSuccessMessage(
        status === "paid"
          ? "Order berhasil ditandai paid."
          : status === "processing"
            ? "Order berhasil dipindahkan ke proses kitchen."
            : status === "done"
              ? "Order berhasil ditandai selesai."
              : "Status order berhasil diperbarui."
      )
    } catch (error) {
      console.error("ADMIN STATUS UPDATE ERROR:", error)
      if (await handleAdminAuthFailure(error)) {
        return
      }
      setLoadError(error.message || "Gagal mengubah status order.")
    } finally {
      setOrderActionState({ orderId: null, action: "" })
    }
  }

  const reviewPayment = async (order, decision) => {
    if (!order?.id) return

    try {
      setOrderActionState({ orderId: order.id, action: decision })
      setLoadError("")
      setSuccessMessage("")
      await reviewOrderPayment({
        orderId: order.id,
        decision,
        reason:
          decision === "reject"
            ? "Bukti pembayaran belum sesuai atau tidak dapat diverifikasi."
            : "",
      })
      await fetchDashboardData()
      setSuccessMessage(
        decision === "accept"
          ? "Pembayaran manual berhasil diverifikasi."
          : decision === "reject"
            ? "Pembayaran manual berhasil ditolak."
            : "Order berhasil dibatalkan."
      )
    } catch (error) {
      console.error("ADMIN PAYMENT REVIEW ERROR:", error)
      if (await handleAdminAuthFailure(error)) {
        return
      }
      setLoadError(error.message || "Gagal memproses review pembayaran.")
    } finally {
      setOrderActionState({ orderId: null, action: "" })
    }
  }

  const submitPaymentAction = async () => {
    if (!paymentActionDialog?.order?.id || !paymentActionDialog?.action) return

    try {
      setPaymentActionLoading(true)
      setLoadError("")
      setSuccessMessage("")
      await reviewOrderPayment({
        orderId: paymentActionDialog.order.id,
        decision: paymentActionDialog.action,
        reason: paymentActionReason.trim(),
      })
      setPaymentActionDialog(null)
      setPaymentActionReason("")
      await fetchDashboardData()
      setSuccessMessage(
        paymentActionDialog.action === "reject"
          ? "Pembayaran manual berhasil ditolak."
          : "Order berhasil dibatalkan."
      )
    } catch (error) {
      console.error("ADMIN PAYMENT ACTION ERROR:", error)
      if (await handleAdminAuthFailure(error)) {
        return
      }
      setLoadError(error.message || "Gagal memproses aksi pembayaran.")
    } finally {
      setPaymentActionLoading(false)
    }
  }

  const openPaymentActionDialog = (order, action) => {
    setPaymentActionDialog({ order, action })
    setPaymentActionReason("")
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
    doc.text(`Total Revenue: ${formatCurrency(reportSummary.grossRevenue)}`, 14, finalY + 10)
    doc.save(`laporan-${startDate}-${endDate}.pdf`)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate("/admin-login", { replace: true })
  }

  const renderOrderAction = (order) => {
    const isOrderActionLoading = orderActionState.orderId === order.id

    if (order.status === "pending" && order.payment_last_status === "awaiting_confirmation") {
      return (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => reviewPayment(order, "accept")}
            disabled={isOrderActionLoading}
            className="bg-yellow-500 text-white hover:bg-yellow-600"
          >
            {isOrderActionLoading ? "Memproses..." : "Verifikasi Pembayaran"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => openPaymentActionDialog(order, "reject")}
            disabled={isOrderActionLoading}
            className="border-red-200 text-red-700 hover:bg-red-50"
          >
            Tolak Pembayaran
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => openPaymentActionDialog(order, "cancel")}
            disabled={isOrderActionLoading}
            className="border-red-300 text-red-800 hover:bg-red-50"
          >
            Batalkan Order
          </Button>
        </div>
      )
    }

    if (order.status === "pending" && order.payment_last_status === "rejected") {
      return (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => reviewPayment(order, "accept")}
            disabled={isOrderActionLoading}
            className="bg-yellow-500 text-white hover:bg-yellow-600"
          >
            {isOrderActionLoading ? "Memproses..." : "Terima Manual"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => openPaymentActionDialog(order, "cancel")}
            disabled={isOrderActionLoading}
            className="border-red-300 text-red-800 hover:bg-red-50"
          >
            Batalkan Order
          </Button>
        </div>
      )
    }

    if (order.status === "pending") {
      return (
        <Button
          type="button"
          onClick={() => updateStatus(order.id, "paid")}
          disabled={isOrderActionLoading}
          className="bg-yellow-500 text-white hover:bg-yellow-600"
        >
          {isOrderActionLoading ? "Memproses..." : "Tandai Paid"}
        </Button>
      )
    }

    if (order.status === "paid") {
      return (
        <Button
          type="button"
          onClick={() => updateStatus(order.id, "processing")}
          disabled={isOrderActionLoading}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          {isOrderActionLoading ? "Memproses..." : "Mulai Proses"}
        </Button>
      )
    }

    if (order.status === "processing") {
      return (
        <Button
          type="button"
          onClick={() => updateStatus(order.id, "done")}
          disabled={isOrderActionLoading}
          className="bg-green-600 text-white hover:bg-green-700"
        >
          {isOrderActionLoading ? "Memproses..." : "Selesaikan Order"}
        </Button>
      )
    }

    return null
  }

  return (
    <div className="min-h-screen bg-coffee-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-[32px] border border-coffee-200 bg-white shadow-[0_30px_80px_rgba(60,40,20,0.12)] overflow-hidden">
          <div className="border-b border-coffee-200 bg-coffee-900 text-white px-8 py-7">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-coffee-200">U Can Do It! Coffee Shop</p>
                <h1 className="text-3xl font-bold mt-2">U Can Do It! Workspace</h1>
                <p className="text-coffee-100 mt-2 max-w-2xl">
                  Monitor order queue, revenue, inventory, dan akses kitchen board.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate("/")}
                  className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                >
                  <ArrowLeft />
                  Kembali ke Landing
                </Button>
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
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="border-red-400/30 bg-red-500/10 text-red-100 hover:bg-red-500/20 hover:text-white"
                >
                  <LogOut />
                  Logout
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
                    className={isActive ? "bg-coffee-900 text-white hover:bg-coffee-800 rounded-full" : "rounded-full border-coffee-200 text-coffee-700"}
                  >
                    <Icon />
                    {tab.label}
                  </Button>
                )
              })}
            </div>

            {activeTab === "reporting" && (
              <Card className="mb-8 border border-coffee-200 bg-white p-5 shadow-none">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-coffee-900">
                      <CalendarRange size={18} />
                      <h2 className="text-lg font-bold">Filter Periode Laporan</h2>
                    </div>
                    <p className="text-sm text-coffee-500 mt-1">
                      Filter ini hanya memengaruhi data analitik, chart, dan export PDF.
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
                              ? "rounded-full bg-coffee-900 text-white hover:bg-coffee-800"
                              : "rounded-full border-coffee-200 text-coffee-700"
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

                    <p className="text-sm font-medium text-coffee-600">Periode aktif: {reportRangeLabel}</p>
                  </div>
                </div>
              </Card>
            )}

            {loading ? (
              <Card className="border border-coffee-200 bg-coffee-50 p-10 text-center shadow-none">
                <p className="text-coffee-600 text-lg font-medium">Memuat dashboard admin...</p>
              </Card>
            ) : (
              <>
                {successMessage && (
                  <Card className="mb-6 border border-green-200 bg-green-50 p-5 shadow-none">
                    <p className="font-medium text-green-800">{successMessage}</p>
                    <p className="mt-2 text-sm text-green-700">
                      Perubahan sudah tersimpan dan data dashboard telah diperbarui.
                    </p>
                  </Card>
                )}

                {loadError && (
                  <Card className="mb-6 border border-red-200 bg-red-50 p-5 shadow-none">
                    <p className="font-medium text-red-800">{loadError}</p>
                    <p className="mt-2 text-sm text-red-700">
                      Coba refresh halaman. Jika masih gagal, login ulang agar token admin diperbarui.
                    </p>
                  </Card>
                )}

                {activeTab === "operations" && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                      <Card className="border border-coffee-200 bg-white p-5 shadow-none">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-coffee-500">Active Queue</p>
                            <p className="text-3xl font-bold text-coffee-900 mt-2">{operationsSummary.queueCount}</p>
                          </div>
                          <div className="rounded-2xl bg-blue-50 p-3 text-blue-700"><Clock3 size={22} /></div>
                        </div>
                      </Card>

                      <Card className="border border-coffee-200 bg-white p-5 shadow-none">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-coffee-500">Menunggu Verifikasi</p>
                            <p className="text-3xl font-bold text-coffee-900 mt-2">{operationsSummary.paymentConfirmationCount}</p>
                          </div>
                          <div className="rounded-2xl bg-amber-50 p-3 text-amber-700"><Wallet size={22} /></div>
                        </div>
                      </Card>

                      <Card className="border border-coffee-200 bg-white p-5 shadow-none">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-coffee-500">Paid Siap Diproses</p>
                            <p className="text-3xl font-bold text-coffee-900 mt-2">{operationsSummary.paidCount}</p>
                          </div>
                          <div className="rounded-2xl bg-green-50 p-3 text-green-700"><CheckCircle2 size={22} /></div>
                        </div>
                      </Card>

                      <Card className="border border-coffee-200 bg-white p-5 shadow-none">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-coffee-500">Sedang Diproses</p>
                            <p className="text-3xl font-bold text-coffee-900 mt-2">{operationsSummary.processingCount}</p>
                          </div>
                          <div className="rounded-2xl bg-purple-50 p-3 text-purple-700"><ChefHat size={22} /></div>
                        </div>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-6">
                      <div className="space-y-6">
                        <Card className="border border-coffee-200 bg-white p-6 shadow-none">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <h2 className="text-lg font-bold text-coffee-900">Konfirmasi Pembayaran</h2>
                              <p className="text-sm text-coffee-500 mt-1">
                                Order yang sudah kirim bukti bayar dan menunggu keputusan admin.
                              </p>
                            </div>
                            <Badge variant="outline" className="text-coffee-600">
                              {pendingPaymentConfirmations.length} menunggu
                            </Badge>
                          </div>

                          <div className="space-y-3 mt-5">
                            {pendingPaymentConfirmations.slice(0, 4).map((order) => (
                              <div key={order.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-semibold text-coffee-900">
                                      {order.customer_name || "Customer"} - {order.table_number || order.order_type}
                                    </p>
                                    <p className="text-sm text-coffee-500 mt-1">{formatDate(order.created_at)}</p>
                                    <p className="text-xs text-amber-800 mt-2">
                                      {order.payment_reference || "Referensi pembayaran belum diisi"}
                                    </p>
                                  </div>
                                  <span className="font-bold text-amber-900">{formatCurrency(order.total_amount)}</span>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                  <Button
                                    onClick={() => reviewPayment(order, "accept")}
                                    className="bg-yellow-500 text-white hover:bg-yellow-600"
                                  >
                                    Terima Pembayaran
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => openPaymentActionDialog(order, "reject")}
                                    className="border-red-200 text-red-700 hover:bg-red-50"
                                  >
                                    Tolak
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => openPaymentActionDialog(order, "cancel")}
                                    className="border-red-300 text-red-800 hover:bg-red-50"
                                  >
                                    Batalkan Order
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedOrderId(order.id)
                                      setActiveTab("orders")
                                    }}
                                    className="border-coffee-200 text-coffee-700"
                                  >
                                    Lihat Detail
                                  </Button>
                                </div>
                              </div>
                            ))}

                            {pendingPaymentConfirmations.length === 0 && (
                              <div className="rounded-2xl border border-dashed border-coffee-300 bg-coffee-50 p-8 text-center">
                                <p className="font-medium text-coffee-700">Tidak ada pembayaran yang menunggu verifikasi.</p>
                              </div>
                            )}
                          </div>
                        </Card>
                      </div>

                      <div className="space-y-6">
                        <Card className="border border-coffee-200 bg-white p-6 shadow-none">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <h2 className="text-lg font-bold text-coffee-900">Recent Orders</h2>
                              <p className="text-sm text-coffee-500 mt-1">Order terbaru real-time</p>
                            </div>
                            <Badge variant="outline" className="text-coffee-600">{liveRecentOrders.length} order</Badge>
                          </div>
                          <div className="space-y-3 mt-5">
                            {liveRecentOrders.map((order) => (
                              <div key={order.id} className="rounded-2xl border border-coffee-200 bg-coffee-50 p-4">
                                <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-coffee-900">{order.customer_name || "Customer"} - {order.table_number || order.order_type}</p>
                                  <p className="text-sm text-coffee-500 mt-1">{formatDate(order.created_at)}</p>
                                  {getPaymentVerificationLabel(order) && (
                                    <p className="text-xs text-amber-700 mt-2">{getPaymentVerificationLabel(order)}</p>
                                  )}
                                </div>
                                  <Badge className={getStatusClasses(order.status)}>{(order.status || "unknown").toUpperCase()}</Badge>
                                </div>
                                <div className="mt-3 flex items-center justify-between">
                                  <span className="text-sm text-coffee-500">{order.order_items?.length || 0} item</span>
                                  <span className="font-bold text-amber-900">{formatCurrency(order.total_amount)}</span>
                                </div>
                              </div>
                            ))}

                            {liveRecentOrders.length === 0 && (
                              <div className="rounded-2xl border border-dashed border-coffee-300 bg-coffee-50 p-8 text-center">
                                <p className="font-medium text-coffee-700">Belum ada order terbaru.</p>
                              </div>
                            )}
                          </div>
                        </Card>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "reporting" && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                      <Card className="border border-coffee-200 bg-white p-5 shadow-none">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-coffee-500">Order Periode</p>
                            <p className="text-3xl font-bold text-coffee-900 mt-2">{reportSummary.periodOrdersCount}</p>
                          </div>
                          <div className="rounded-2xl bg-amber-50 p-3 text-amber-800"><ShoppingBag size={22} /></div>
                        </div>
                      </Card>

                      <Card className="border border-coffee-200 bg-white p-5 shadow-none">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-coffee-500">Revenue Periode</p>
                            <p className="text-2xl font-bold text-coffee-900 mt-2">{formatCurrency(reportSummary.grossRevenue)}</p>
                          </div>
                          <div className="rounded-2xl bg-green-50 p-3 text-green-700"><Wallet size={22} /></div>
                        </div>
                      </Card>

                      <Card className="border border-coffee-200 bg-white p-5 shadow-none">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-coffee-500">Order Paid</p>
                            <p className="text-3xl font-bold text-coffee-900 mt-2">{reportSummary.paidOrdersCount}</p>
                          </div>
                          <div className="rounded-2xl bg-blue-50 p-3 text-blue-700"><CheckCircle2 size={22} /></div>
                        </div>
                      </Card>

                      <Card className="border border-coffee-200 bg-white p-5 shadow-none">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-coffee-500">Average Ticket</p>
                            <p className="text-2xl font-bold text-coffee-900 mt-2">{formatCurrency(reportSummary.averageTicket)}</p>
                          </div>
                          <div className="rounded-2xl bg-purple-50 p-3 text-purple-700"><Activity size={22} /></div>
                        </div>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-6">
                      <div className="space-y-6">
                        <RevenueChart orders={reportOrders} startDate={startDate} endDate={endDate} />
                        <BestSellingChart orders={reportOrders} />
                      </div>

                      <div className="space-y-6">
                        <Card className="border border-coffee-200 bg-white p-6 shadow-none">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <h2 className="text-lg font-bold text-coffee-900">Order Dalam Periode</h2>
                              <p className="text-sm text-coffee-500 mt-1">{reportRangeLabel}</p>
                            </div>
                            <Badge variant="outline" className="text-coffee-600">{reportRecentOrders.length} order</Badge>
                          </div>
                          <div className="space-y-3 mt-5">
                            {reportRecentOrders.map((order) => (
                              <div key={order.id} className="rounded-2xl border border-coffee-200 bg-coffee-50 p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-semibold text-coffee-900">{order.customer_name || "Customer"} - {order.table_number || order.order_type}</p>
                                    <p className="text-sm text-coffee-500 mt-1">{formatDate(order.created_at)}</p>
                                  </div>
                                  <Badge className={getStatusClasses(order.status)}>{(order.status || "unknown").toUpperCase()}</Badge>
                                </div>
                                <div className="mt-3 flex items-center justify-between">
                                  <span className="text-sm text-coffee-500">{order.order_items?.length || 0} item</span>
                                  <span className="font-bold text-amber-900">{formatCurrency(order.total_amount)}</span>
                                </div>
                              </div>
                            ))}

                            {reportRecentOrders.length === 0 && (
                              <div className="rounded-2xl border border-dashed border-coffee-300 bg-coffee-50 p-8 text-center">
                                <p className="font-medium text-coffee-700">Belum ada order pada periode laporan ini.</p>
                              </div>
                            )}
                          </div>
                        </Card>

                        <Card className="border border-coffee-200 bg-white p-6 shadow-none">
                          <h2 className="text-lg font-bold text-coffee-900">Konteks Laporan</h2>
                          <div className="space-y-4 mt-5">
                            <div className="rounded-2xl bg-coffee-50 p-4 flex items-center justify-between">
                              <div className="flex items-center gap-3"><CalendarRange className="text-coffee-700" size={18} /><span className="text-coffee-700">Periode aktif</span></div>
                              <span className="font-semibold text-coffee-900">{reportRangeLabel}</span>
                            </div>
                            <div className="rounded-2xl bg-coffee-50 p-4 flex items-center justify-between">
                              <div className="flex items-center gap-3"><Download className="text-amber-700" size={18} /><span className="text-coffee-700">Export PDF</span></div>
                              <span className="font-semibold text-coffee-900">Siap digunakan</span>
                            </div>
                            <div className="rounded-2xl bg-coffee-50 p-4 flex items-center justify-between">
                              <div className="flex items-center gap-3"><Package className="text-red-700" size={18} /><span className="text-coffee-700">Low stock saat ini</span></div>
                              <span className="font-semibold text-coffee-900">{inventorySummary.lowStockCount}</span>
                            </div>
                          </div>
                        </Card>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "orders" && (
                  <div className="space-y-6">
                    <Card className="border border-coffee-200 bg-white p-5 shadow-none">
                      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                        <div>
                          <h2 className="text-xl font-bold text-coffee-900">Order Queue</h2>
                          <p className="text-sm text-coffee-500 mt-1">
                            Antrian order realtime untuk kasir dan operasional. Tab ini tidak mengikuti filter periode laporan.
                          </p>
                        </div>

                        <div className="flex flex-col md:flex-row gap-3">
                          <div className="relative min-w-[280px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-coffee-400" size={16} />
                            <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Cari order, customer, meja, atau kontak" className="pl-9" />
                          </div>
                          <Button variant="outline" onClick={fetchDashboardData} className="border-coffee-200">
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
                            className={filterStatus === filter.value ? "bg-coffee-900 text-white rounded-full" : "rounded-full border-coffee-200 text-coffee-700"}
                          >
                            {filter.label}
                          </Button>
                        ))}
                      </div>
                    </Card>

                    <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
                      <Card className="border border-coffee-200 bg-white p-4 shadow-none">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-coffee-900">Daftar Order</h3>
                          <Badge variant="outline" className="text-coffee-600">{liveQueueOrders.length} order</Badge>
                        </div>

                        <div className="space-y-3 max-h-[780px] overflow-y-auto pr-1">
                          {liveQueueOrders.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-coffee-300 bg-coffee-50 p-8 text-center">
                              <p className="font-medium text-coffee-700">Tidak ada order yang cocok.</p>
                              <p className="text-sm text-coffee-500 mt-2">Ubah filter status atau kata kunci pencarian.</p>
                            </div>
                          ) : (
                            liveQueueOrders.map((order) => (
                              <button
                                key={order.id}
                                type="button"
                                onClick={() => setSelectedOrderId(order.id)}
                                className={`w-full rounded-2xl border p-4 text-left transition ${
                                  selectedOrder?.id === order.id ? "border-coffee-900 bg-coffee-900 text-white" : "border-coffee-200 bg-coffee-50 hover:border-amber-300"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-semibold">{order.customer_name || "Customer"} - {order.table_number || order.order_type}</p>
                                    <p className={`text-sm mt-1 ${selectedOrder?.id === order.id ? "text-coffee-300" : "text-coffee-500"}`}>
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
                                  <span className={`text-sm ${selectedOrder?.id === order.id ? "text-coffee-300" : "text-coffee-500"}`}>
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
                            <Card className="border border-coffee-200 bg-white p-6 shadow-none">
                              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                                <div>
                                  <p className="text-xs uppercase tracking-[0.25em] text-coffee-400">Selected Order</p>
                                  <h3 className="text-2xl font-bold text-coffee-900 mt-2">{selectedOrder.customer_name || "Customer"}</h3>
                                  <p className="text-coffee-500 mt-2">{selectedOrder.customer_phone || "-"} - {selectedOrder.table_number || selectedOrder.order_type || "-"}</p>
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
                                <div className="rounded-2xl bg-coffee-50 p-4">
                                  <p className="text-sm text-coffee-500">Order ID</p>
                                  <p className="font-semibold text-coffee-900 mt-1">{selectedOrder.id}</p>
                                </div>
                                <div className="rounded-2xl bg-coffee-50 p-4">
                                  <p className="text-sm text-coffee-500">Tipe Order</p>
                                  <p className="font-semibold text-coffee-900 mt-1 capitalize">{selectedOrder.order_type || "-"}</p>
                                </div>
                                <div className="rounded-2xl bg-coffee-50 p-4">
                                  <p className="text-sm text-coffee-500">Waktu Order</p>
                                  <p className="font-semibold text-coffee-900 mt-1">{formatDate(selectedOrder.created_at)}</p>
                                </div>
                                <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
                                  <p className="text-sm text-coffee-500">Total</p>
                                  <p className="font-bold text-amber-900 mt-1">{formatCurrency(selectedOrder.total_amount)}</p>
                                </div>
                              </div>

                              {(selectedOrder.payment_rejection_reason || selectedOrder.cancel_reason) && (
                                <div className="grid grid-cols-1 gap-4 mt-4">
                                  {selectedOrder.payment_rejection_reason && (
                                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                                      <p className="text-sm text-red-700">Alasan Penolakan Pembayaran</p>
                                      <p className="font-semibold text-red-800 mt-1">{selectedOrder.payment_rejection_reason}</p>
                                    </div>
                                  )}
                                  {selectedOrder.cancel_reason && (
                                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                                      <p className="text-sm text-red-700">Alasan Pembatalan</p>
                                      <p className="font-semibold text-red-800 mt-1">{selectedOrder.cancel_reason}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </Card>

                            <Card className="border border-coffee-200 bg-white p-6 shadow-none">
                              <h3 className="font-bold text-coffee-900">Detail Item</h3>
                              <div className="space-y-3 mt-5">
                                {(selectedOrder.order_items || []).map((item) => (
                                  <div key={item.id} className="rounded-2xl border border-coffee-200 bg-coffee-50 p-4 flex items-center justify-between gap-4">
                                    <div>
                                      <p className="font-semibold text-coffee-900">{item.products?.name || "Produk"}</p>
                                      <p className="text-sm text-coffee-500">Qty {item.quantity} - Rp {Number(item.price).toLocaleString("id-ID")} / item</p>
                                    </div>
                                    <p className="font-semibold text-coffee-900">{formatCurrency(item.price * item.quantity)}</p>
                                  </div>
                                ))}
                              </div>
                            </Card>

                            {(selectedOrder.payment_payload?.manual_payment?.proof_url || selectedOrder.payment_payload?.manual_payment?.proof_data_url) && (
                              <Card className="border border-coffee-200 bg-white p-6 shadow-none">
                                <h3 className="font-bold text-coffee-900">Bukti Pembayaran</h3>
                                <p className="mt-2 text-sm text-coffee-500">
                                  {selectedOrder.payment_payload.manual_payment.proof_name || "manual-proof"}
                                </p>

                                <div className="mt-5 overflow-hidden rounded-3xl border border-coffee-200 bg-coffee-50 p-4">
                                  <img
                                    src={selectedOrder.payment_payload.manual_payment.proof_url || selectedOrder.payment_payload.manual_payment.proof_data_url}
                                    alt="Bukti pembayaran customer"
                                    className="max-h-[420px] w-full rounded-2xl object-contain bg-white"
                                  />
                                </div>
                              </Card>
                            )}
                          </>
                        ) : (
                          <Card className="border border-dashed border-coffee-300 bg-coffee-50 p-10 text-center shadow-none">
                            <p className="font-medium text-coffee-700">Pilih order dari daftar sebelah kiri.</p>
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

      <Dialog
        open={Boolean(paymentActionDialog)}
        onOpenChange={(open) => {
          if (!open && !paymentActionLoading) {
            setPaymentActionDialog(null)
            setPaymentActionReason("")
          }
        }}
      >
        <DialogContent className="border border-coffee-200 bg-white sm:rounded-3xl">
          <DialogHeader>
            <DialogTitle>
              {paymentActionDialog?.action === "reject" ? "Tolak Pembayaran Ini?" : "Batalkan Order Ini?"}
            </DialogTitle>
            <DialogDescription className="text-coffee-500">
              {paymentActionDialog?.action === "reject"
                ? "Pembayaran akan dikembalikan ke status ditolak dan customer harus mengirim ulang bukti pembayaran."
                : "Order akan dipindahkan ke status `cancelled` dan customer tidak bisa lagi mengirim bukti pembayaran untuk pesanan ini."}
            </DialogDescription>
          </DialogHeader>

          {paymentActionDialog?.order && (
            <div className="rounded-2xl border border-coffee-200 bg-coffee-50 p-4">
              <p className="font-semibold text-coffee-900">
                {paymentActionDialog.order.customer_name || "Customer"} - {paymentActionDialog.order.table_number || paymentActionDialog.order.order_type}
              </p>
              <p className="mt-1 text-sm text-coffee-500">{formatDate(paymentActionDialog.order.created_at)}</p>
              <p className="mt-3 text-sm text-coffee-700">Order ID: {paymentActionDialog.order.id}</p>
              <p className="mt-1 text-sm font-semibold text-amber-900">
                {formatCurrency(paymentActionDialog.order.total_amount)}
              </p>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-coffee-800 mb-2">
              {paymentActionDialog?.action === "reject" ? "Alasan penolakan" : "Alasan pembatalan"}
            </p>
            <textarea
              value={paymentActionReason}
              onChange={(event) => setPaymentActionReason(event.target.value)}
              rows={4}
              placeholder={
                paymentActionDialog?.action === "reject"
                  ? "Contoh: nominal transfer tidak sesuai, bukti buram, atau transaksi tidak ditemukan."
                  : "Contoh: pembayaran tidak masuk dalam batas waktu atau customer menghubungi kasir untuk batal."
              }
              className="flex min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPaymentActionDialog(null)
                setPaymentActionReason("")
              }}
              disabled={paymentActionLoading}
              className="border-coffee-200"
            >
              Kembali
            </Button>
            <Button
              type="button"
              onClick={submitPaymentAction}
              disabled={paymentActionLoading || !paymentActionDialog || !paymentActionReason.trim()}
              className="bg-red-700 text-white hover:bg-red-800"
            >
              {paymentActionLoading
                ? "Menyimpan..."
                : paymentActionDialog?.action === "reject"
                  ? "Ya, Tolak Pembayaran"
                  : "Ya, Batalkan Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
