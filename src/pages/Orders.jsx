import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { ArrowLeft, Clock3, ReceiptText, Trash2 } from "lucide-react"
import { getOrderHistoryIds, removeOrderFromHistory } from "../services/orderHistoryService"
import { getOrderMetadata } from "../services/customerOrderStorage"
import { fetchCustomerOrders } from "../services/customerOrderService"

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [selectedOrderId, setSelectedOrderId] = useState(localStorage.getItem("lastOrderId"))
  const [historyIds, setHistoryIds] = useState(() => getOrderHistoryIds())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const loadOrders = async () => {
      const ids = getOrderHistoryIds()

      if (cancelled) return

      setHistoryIds(ids)

      if (ids.length === 0) {
        setOrders([])
        setLoading(false)
        return
      }

      try {
        const data = await fetchCustomerOrders(ids)

        if (cancelled) return

        const sortedOrders = ids
          .map((id) => data.find((order) => order.id === id))
          .filter(Boolean)

        setOrders(sortedOrders)
        setLoading(false)
        setSelectedOrderId((currentValue) => {
          if (sortedOrders.some((order) => order.id === currentValue)) {
            return currentValue
          }

          const nextSelectedId = sortedOrders[0]?.id ?? null
          if (nextSelectedId) {
            localStorage.setItem("lastOrderId", nextSelectedId)
          }
          return nextSelectedId
        })
      } catch (error) {
        if (!cancelled) {
          console.error("FETCH HISTORY ERROR:", error)
          setLoading(false)
        }
      }
    }

    void loadOrders()
    const interval = window.setInterval(() => {
      void loadOrders()
    }, 15000)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [])

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? orders[0] ?? null,
    [orders, selectedOrderId]
  )

  const selectOrder = (orderId) => {
    setSelectedOrderId(orderId)
    localStorage.setItem("lastOrderId", orderId)
  }

  const handleRemoveHistory = (orderId) => {
    const nextIds = removeOrderFromHistory(orderId)
    setHistoryIds(nextIds)
    setOrders((prevOrders) => prevOrders.filter((order) => order.id !== orderId))

    if (selectedOrderId === orderId) {
      const nextSelectedId = nextIds[0] ?? null
      setSelectedOrderId(nextSelectedId)
    }
  }

  const formatCurrency = (amount) =>
    Number(amount ?? 0).toLocaleString("id-ID")

  const formatDate = (value) => {
    if (!value) return "-"

    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value))
  }

  const selectedOrderMeta = selectedOrder ? getOrderMetadata(selectedOrder.id) : null
  const manualPaymentPayload = selectedOrder?.payment_payload?.manual_payment
  const selectedPaymentMethod = selectedOrderMeta?.paymentMethod || manualPaymentPayload?.payment_method || null
  const paymentReviewStatus = selectedOrder?.payment_last_status ?? null
  const awaitingVerification =
    paymentReviewStatus === "awaiting_confirmation" ||
    (!paymentReviewStatus && selectedOrderMeta?.manualPaymentStatus === "awaiting_verification")
  const isPaymentRejected = paymentReviewStatus === "rejected"

  const getPaymentLabel = (paymentMethod) => {
    switch (paymentMethod) {
      case "cash":
        return "Bayar di Kasir"
      case "bank_transfer":
        return "Transfer Bank Manual"
      case "qris":
      default:
        return "QRIS Manual"
    }
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

  const steps = [
    { key: "pending", label: "Menunggu pembayaran" },
    { key: "paid", label: "Sudah dibayar" },
    { key: "processing", label: "Sedang diproses" },
    { key: "done", label: "Siap dinikmati" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md p-8 text-center border-0 shadow-sm">
          <p className="text-lg font-semibold text-stone-800">Memuat riwayat pesanan...</p>
        </Card>
      </div>
    )
  }

  if (historyIds.length === 0 || !selectedOrder) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md p-8 text-center border-0 shadow-sm">
          <Clock3 className="mx-auto text-amber-900 mb-4" size={40} />
          <h1 className="text-2xl font-bold text-stone-800 mb-2">Belum ada riwayat pesanan</h1>
          <p className="text-stone-500 mb-6">
            Riwayat pesanan akan muncul di browser ini setelah Anda menyelesaikan checkout.
          </p>
          <Link to="/">
            <Button className="w-full bg-amber-900 text-white hover:bg-amber-800">
              Kembali ke Menu
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-amber-900 mb-6 hover:opacity-80"
        >
          <ArrowLeft size={18} />
          Kembali ke Menu
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
          <Card className="border-0 shadow-sm p-4">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold text-stone-800">Order History</h1>
                <p className="text-sm text-stone-500 mt-1">
                  Riwayat pesanan tersimpan di browser ini.
                </p>
              </div>
              <Badge variant="outline" className="text-stone-600">
                {orders.length} pesanan
              </Badge>
            </div>

            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className={`rounded-2xl border p-4 transition ${
                    selectedOrder.id === order.id
                      ? "border-amber-900 bg-amber-50"
                      : "border-stone-200 bg-white hover:border-amber-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button type="button" onClick={() => selectOrder(order.id)} className="flex-1 text-left">
                      <p className="font-semibold text-stone-800">
                        ORDER-{String(order.id).slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-sm text-stone-500 mt-1">
                        {formatDate(order.created_at)}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveHistory(order.id)}
                      className="text-stone-400 hover:text-red-600"
                      aria-label="Hapus dari riwayat"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => selectOrder(order.id)}
                    className="w-full flex items-center justify-between gap-3 mt-4 text-left"
                  >
                    <Badge className={getStatusClasses(order.status)}>
                      {(order.status || "unknown").toUpperCase()}
                    </Badge>
                    <span className="font-bold text-amber-900">
                      Rp {formatCurrency(order.total_amount)}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="border-0 shadow-sm p-6">
              <div className="flex items-start gap-3">
                <ReceiptText className="text-amber-900 mt-1" size={20} />
                <div>
                  <h2 className="text-2xl font-bold text-stone-800">Detail Pesanan</h2>
                  <p className="text-sm text-stone-500 mt-1">
                    Pantau status, total, dan item dari pesanan yang dipilih.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="rounded-2xl bg-stone-100 p-4">
                  <p className="text-sm text-stone-500 mb-1">Order ID</p>
                  <p className="font-semibold text-stone-800">{selectedOrder.id}</p>
                </div>
                <div className="rounded-2xl bg-stone-100 p-4">
                  <p className="text-sm text-stone-500 mb-1">Status</p>
                  <Badge className={getStatusClasses(selectedOrder.status)}>
                    {(selectedOrder.status || "unknown").toUpperCase()}
                  </Badge>
                </div>
                <div className="rounded-2xl bg-stone-100 p-4">
                  <p className="text-sm text-stone-500 mb-1">Nomor Meja</p>
                  <p className="font-semibold text-stone-800">
                    {selectedOrderMeta?.tableNumber || selectedOrder.table_number || "-"}
                  </p>
                </div>
                <div className="rounded-2xl bg-stone-100 p-4">
                  <p className="text-sm text-stone-500 mb-1">Waktu Pesan</p>
                  <p className="font-semibold text-stone-800">{formatDate(selectedOrder.created_at)}</p>
                </div>
                <div className="rounded-2xl bg-stone-100 p-4">
                  <p className="text-sm text-stone-500 mb-1">Pembayaran</p>
                  <p className="font-semibold text-stone-800">
                    {selectedOrder.paid_at
                      ? formatDate(selectedOrder.paid_at)
                      : selectedOrderMeta?.manualPaymentSubmittedAt
                        ? formatDate(selectedOrderMeta.manualPaymentSubmittedAt)
                        : manualPaymentPayload?.submitted_at
                          ? formatDate(manualPaymentPayload.submitted_at)
                        : "Belum dibayar"}
                  </p>
                </div>
                {(selectedOrderMeta?.manualPaymentReference || manualPaymentPayload?.reference) && (
                  <div className="rounded-2xl bg-stone-100 p-4">
                    <p className="text-sm text-stone-500 mb-1">Referensi Bayar</p>
                    <p className="font-semibold text-stone-800">
                      {selectedOrderMeta?.manualPaymentReference || manualPaymentPayload?.reference}
                    </p>
                  </div>
                )}
                {(selectedOrderMeta?.manualPaymentProofName || manualPaymentPayload?.proof_name) && (
                  <div className="rounded-2xl bg-stone-100 p-4">
                    <p className="text-sm text-stone-500 mb-1">Bukti Pembayaran</p>
                    <p className="font-semibold text-stone-800">
                      {selectedOrderMeta?.manualPaymentProofName || manualPaymentPayload?.proof_name}
                    </p>
                  </div>
                )}
                {selectedOrder.payment_rejection_reason && (
                  <div className="rounded-2xl bg-red-50 border border-red-200 p-4 md:col-span-2">
                    <p className="text-sm text-red-700 mb-1">Alasan Penolakan Pembayaran</p>
                    <p className="font-semibold text-red-800">{selectedOrder.payment_rejection_reason}</p>
                  </div>
                )}
                {selectedOrder.cancel_reason && (
                  <div className="rounded-2xl bg-red-50 border border-red-200 p-4 md:col-span-2">
                    <p className="text-sm text-red-700 mb-1">Alasan Pembatalan</p>
                    <p className="font-semibold text-red-800">{selectedOrder.cancel_reason}</p>
                  </div>
                )}
                <div className="rounded-2xl bg-stone-100 p-4">
                  <p className="text-sm text-stone-500 mb-1">Tipe Order</p>
                  <p className="font-semibold text-stone-800">
                    {selectedOrderMeta?.orderTypeLabel || selectedOrder.order_type || "-"}
                  </p>
                </div>
                <div className="rounded-2xl bg-stone-100 p-4">
                  <p className="text-sm text-stone-500 mb-1">Metode Bayar</p>
                  <p className="font-semibold text-stone-800">
                    {getPaymentLabel(selectedPaymentMethod)}
                  </p>
                </div>
                <div className="rounded-2xl bg-stone-100 p-4">
                  <p className="text-sm text-stone-500 mb-1">Nama Pemesan</p>
                  <p className="font-semibold text-stone-800">
                    {selectedOrderMeta?.customerName || selectedOrder.customer_name || "-"}
                  </p>
                </div>
                <div className="rounded-2xl bg-stone-100 p-4">
                  <p className="text-sm text-stone-500 mb-1">Kontak</p>
                  <p className="font-semibold text-stone-800">
                    {selectedOrderMeta?.customerPhone || selectedOrder.customer_phone || "-"}
                  </p>
                </div>
                {selectedOrderMeta?.deliveryAddress && (
                  <div className="rounded-2xl bg-stone-100 p-4 md:col-span-2">
                    <p className="text-sm text-stone-500 mb-1">Alamat Pengantaran</p>
                    <p className="font-semibold text-stone-800">
                      {selectedOrderMeta.deliveryAddress}
                    </p>
                  </div>
                )}
                {selectedOrderMeta?.notes && (
                  <div className="rounded-2xl bg-stone-100 p-4 md:col-span-2">
                    <p className="text-sm text-stone-500 mb-1">Catatan</p>
                    <p className="font-semibold text-stone-800">{selectedOrderMeta.notes}</p>
                  </div>
                )}
                <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
                  <p className="text-sm text-stone-500 mb-1">Total</p>
                  <p className="text-2xl font-bold text-amber-900">
                    Rp {formatCurrency(selectedOrderMeta?.total ?? selectedOrder.total_amount)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border-0 shadow-sm p-6">
              <h3 className="font-bold text-stone-800 mb-4">Item Pesanan</h3>

              <div className="space-y-3">
                {(selectedOrder.order_items || []).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 rounded-2xl bg-stone-50 border border-stone-200 p-4"
                  >
                    <div>
                      <p className="font-semibold text-stone-800">
                        {item.products?.name || "Produk"}
                      </p>
                      <p className="text-sm text-stone-500">Qty {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-stone-800">
                      Rp {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t mt-6 pt-4 flex items-center justify-between">
                <span className="text-stone-500">Total Akhir</span>
                <span className="text-xl font-bold text-amber-900">
                  Rp {formatCurrency(selectedOrderMeta?.total ?? selectedOrder.total_amount)}
                </span>
              </div>
            </Card>

            {selectedOrder.status === "pending" && selectedPaymentMethod !== "cash" && (
              <Card className={`border-0 shadow-sm p-6 ${isPaymentRejected ? "bg-red-50" : "bg-yellow-50"}`}>
                <p className={`text-sm ${isPaymentRejected ? "text-red-700" : "text-yellow-900"}`}>
                  {awaitingVerification
                    ? "Konfirmasi pembayaran manual Anda sudah dikirim dan sekarang menunggu verifikasi admin."
                    : isPaymentRejected
                      ? "Bukti pembayaran terakhir ditolak admin. Buka payment page untuk memperbarui referensi atau unggah ulang bukti pembayaran."
                      : "Pesanan ini masih menunggu pembayaran manual atau konfirmasi Anda. Buka payment page untuk melihat QRIS atau rekening tujuan lalu selesaikan pembayarannya."}
                </p>
                {(selectedOrderMeta?.manualPaymentProofPreview || manualPaymentPayload?.proof_url || manualPaymentPayload?.proof_data_url) && (awaitingVerification || isPaymentRejected) && (
                  <div className={`mt-4 overflow-hidden rounded-2xl border bg-white p-3 ${isPaymentRejected ? "border-red-200" : "border-yellow-200"}`}>
                    <img
                      src={selectedOrderMeta?.manualPaymentProofPreview || manualPaymentPayload?.proof_url || manualPaymentPayload?.proof_data_url}
                      alt="Bukti pembayaran"
                      className="h-48 w-full rounded-xl object-cover"
                    />
                  </div>
                )}
                {!awaitingVerification && (
                  <Link to="/payment" className="inline-block mt-4">
                    <Button className={`${isPaymentRejected ? "bg-red-700 hover:bg-red-800" : "bg-amber-900 hover:bg-amber-800"} text-white`}>
                      {isPaymentRejected ? "Kirim Ulang Bukti Pembayaran" : "Buka Payment Page"}
                    </Button>
                  </Link>
                )}
              </Card>
            )}

            {selectedOrder.status === "pending" && selectedPaymentMethod === "cash" && (
              <Card className="border-0 shadow-sm p-6 bg-stone-100">
                <p className="text-sm text-stone-700">
                  Metode bayar pesanan ini adalah kasir. Status akan berubah setelah pembayaran
                  offline dikonfirmasi oleh petugas atau admin.
                </p>
              </Card>
            )}

            {selectedOrder.status === "cancelled" && (
              <Card className="border-0 shadow-sm p-6 bg-red-50">
                <p className="text-sm text-red-700">
                  {selectedOrder.cancel_reason
                    ? `Pesanan ini dibatalkan admin dengan alasan: ${selectedOrder.cancel_reason}`
                    : "Pesanan ini sudah dibatalkan oleh admin. Jika customer masih ingin memesan, silakan buat order baru dari menu."}
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
