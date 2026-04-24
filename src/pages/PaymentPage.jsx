import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, CheckCircle2, Landmark, QrCode, ReceiptText, Wallet } from "lucide-react"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { getOrderMetadata, saveOrderMetadata } from "../services/customerOrderStorage"
import { fetchCustomerOrder } from "../services/customerOrderService"
import {
  getManualPaymentConfig,
  MAX_MANUAL_PROOF_FILE_SIZE,
  submitManualPaymentConfirmation,
} from "../services/paymentService"

const formatCurrency = (amount) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount ?? 0)

const PaymentPage = () => {
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [gatewayMessage, setGatewayMessage] = useState("")
  const [orderMeta, setOrderMeta] = useState(null)
  const [paymentReference, setPaymentReference] = useState("")
  const [proofFile, setProofFile] = useState(null)
  const [proofPreview, setProofPreview] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    const orderId = localStorage.getItem("lastOrderId")

    if (!orderId) {
      setErrorMessage("Order tidak ditemukan. Silakan lakukan checkout ulang.")
      setLoading(false)
      return () => {
        cancelled = true
      }
    }

    const metadata = getOrderMetadata(orderId)
    setOrderMeta(metadata)

    const loadOrder = async () => {
      try {
        const nextOrder = await fetchCustomerOrder(orderId)

        if (cancelled) return

        setOrder(nextOrder)
        setPaymentReference((currentValue) => currentValue || metadata?.manualPaymentReference || "")
        setProofPreview(
          metadata?.manualPaymentProofPreview ||
            nextOrder?.payment_payload?.manual_payment?.proof_url ||
            nextOrder?.payment_payload?.manual_payment?.proof_data_url ||
            ""
        )
        setErrorMessage("")
      } catch (error) {
        if (cancelled) return
        console.error("FETCH ORDER ERROR:", error)
        setErrorMessage(error.message || "Gagal mengambil data pembayaran.")
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadOrder()

    const interval = window.setInterval(() => {
      void loadOrder()
    }, 15000)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [])

  const selectedPaymentMethod = orderMeta?.paymentMethod ?? "qris"
  const isAlreadyPaid = ["paid", "done", "processing"].includes(order?.status ?? "")
  const isCancelled = order?.status === "cancelled"
  const isCashPayment = selectedPaymentMethod === "cash"
  const isBankTransfer = selectedPaymentMethod === "bank_transfer"
  const isQrisPayment = selectedPaymentMethod === "qris"
  const manualConfig = useMemo(() => getManualPaymentConfig(), [])
  const qrisMerchantLabel = [manualConfig.qrisMerchantName, manualConfig.qrisMerchantCity]
    .filter(Boolean)
    .join(" - ")
  const isRejected = order?.payment_last_status === "rejected"
  const isAwaitingVerification =
    order?.payment_last_status === "awaiting_confirmation" ||
    (!order?.payment_last_status && orderMeta?.manualPaymentStatus === "awaiting_verification")

  const getPaymentMethodLabel = () => {
    switch (selectedPaymentMethod) {
      case "cash":
        return "Bayar di Kasir"
      case "bank_transfer":
        return "Transfer Bank Manual"
      case "qris":
      default:
        return "QRIS Manual"
    }
  }

  const handleManualPayment = async () => {
    if (!order?.id || isAlreadyPaid || isAwaitingVerification || isCancelled) return

    if (!paymentReference.trim()) {
      setGatewayMessage(
        isBankTransfer
          ? "Isi referensi transfer, misalnya nama pengirim atau 4 digit terakhir rekening."
          : "Isi keterangan pembayaran, misalnya nama e-wallet atau waktu pembayaran."
      )
      return
    }

    if (!proofFile && !proofPreview) {
      setGatewayMessage("Unggah bukti pembayaran berupa screenshot atau foto transaksi.")
      return
    }

    setPaymentLoading(true)
    setGatewayMessage("")

    try {
      const response = await submitManualPaymentConfirmation({
        orderId: order.id,
        paymentMethod: selectedPaymentMethod,
        reference: paymentReference,
        proofFile,
        reuseExistingProof: !proofFile && Boolean(order?.manual_payment_proof_path || proofPreview),
      })

      saveOrderMetadata(order.id, {
        manualPaymentSubmittedAt: response.submittedAt || new Date().toISOString(),
        manualPaymentStatus: "awaiting_verification",
        manualPaymentReference: response.reference || paymentReference.trim(),
        manualPaymentMethod: selectedPaymentMethod,
        manualPaymentProofName: response.proofName || proofFile?.name || orderMeta?.manualPaymentProofName || "manual-proof",
        manualPaymentProofPreview: response.proofUrl || proofPreview,
      })

      navigate("/orders")
    } catch (error) {
      console.error("MANUAL PAYMENT ERROR:", error)
      setGatewayMessage(error.message || "Gagal mengirim konfirmasi pembayaran manual.")
    } finally {
      setPaymentLoading(false)
    }
  }

  const handleCashFlow = () => {
    navigate("/orders")
  }

  const handleProofChange = (event) => {
    const nextFile = event.target.files?.[0]

    if (!nextFile) {
      setProofFile(null)
      return
    }

    if (!nextFile.type.startsWith("image/")) {
      setGatewayMessage("File bukti pembayaran harus berupa gambar.")
      event.target.value = ""
      return
    }

    if (nextFile.size > MAX_MANUAL_PROOF_FILE_SIZE) {
      setGatewayMessage("Ukuran gambar maksimal 1 MB.")
      event.target.value = ""
      return
    }

    setGatewayMessage("")
    setProofFile(nextFile)

    const reader = new FileReader()
    reader.onload = () => {
      setProofPreview(reader.result)
    }
    reader.readAsDataURL(nextFile)
  }

  const paymentInstruction = (() => {
    if (isCashPayment) {
      return {
        title: "Bayar langsung di kasir",
        description:
          "Pesanan Anda sudah tercatat. Silakan datang ke kasir untuk menyelesaikan pembayaran offline.",
        actionLabel: isAlreadyPaid ? "Pembayaran Sudah Diproses" : "Lanjut Bayar di Kasir",
      }
    }

    if (isBankTransfer) {
      return {
        title: "Transfer ke rekening tujuan",
        description:
          "Lakukan transfer sesuai total pembayaran, lalu kirim konfirmasi agar admin bisa memverifikasi pembayaran Anda.",
        actionLabel: isAlreadyPaid
          ? "Pembayaran Sudah Diproses"
          : isCancelled
            ? "Order Sudah Dibatalkan"
          : isRejected
            ? "Kirim Ulang Konfirmasi Transfer"
          : isAwaitingVerification
            ? "Menunggu Verifikasi Admin"
            : "Kirim Konfirmasi Transfer",
      }
    }

    return {
      title: "Scan QRIS dan konfirmasi",
      description:
        "Scan QRIS manual di bawah ini menggunakan e-wallet atau mobile banking, lalu kirim konfirmasi agar admin bisa memverifikasi pembayaran Anda.",
      actionLabel: isAlreadyPaid
        ? "Pembayaran Sudah Diproses"
        : isCancelled
          ? "Order Sudah Dibatalkan"
        : isRejected
          ? "Kirim Ulang Konfirmasi QRIS"
        : isAwaitingVerification
          ? "Menunggu Verifikasi Admin"
          : "Kirim Konfirmasi QRIS",
    }
  })()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-coffee-50 px-4">
        <Card className="w-full max-w-md border-0 p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-coffee-800">Memuat halaman pembayaran...</p>
        </Card>
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-coffee-50 px-4">
        <Card className="w-full max-w-md border-0 p-8 text-center shadow-sm">
          <p className="mb-3 text-lg font-semibold text-coffee-800">{errorMessage}</p>
          <p className="mb-6 text-sm text-coffee-500">
            Halaman pembayaran membutuhkan data order yang valid.
          </p>
          <Link to="/checkout">
            <Button className="w-full bg-coffee-900 text-white hover:bg-coffee-800">
              Kembali ke Checkout
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-coffee-50 px-4 py-10">
      <div className="mx-auto mt-30 max-w-5xl">
        <Link
          to="/checkout"
          className="mb-6 inline-flex items-center gap-2 text-coffee-900 hover:opacity-80"
        >
          <ArrowLeft size={18} />
          Kembali ke Checkout
        </Link>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="overflow-hidden border-0 shadow-sm">
            <div className="bg-coffee-900 p-6 text-white">
              <p className="text-sm uppercase tracking-[0.2em] opacity-80">Payment Page</p>
              <h1 className="mt-2 text-3xl font-bold">{paymentInstruction.title}</h1>
              <p className="mt-3 text-coffee-100">{paymentInstruction.description}</p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[0.82fr_1.18fr]">
                <div className="space-y-4">
                  <div
                    className={`min-h-[220px] md:min-h-[260px] overflow-hidden rounded-2xl border border-dashed border-coffee-300 bg-coffee-100 ${
                      isQrisPayment ? "p-0" : "p-6"
                    }`}
                  >
                    {isQrisPayment ? (
                      manualConfig.qrisImageUrl ? (
                        <img
                          src={manualConfig.qrisImageUrl}
                          alt="QRIS Pembayaran"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full min-h-72 flex-col items-center justify-center p-6 text-center">
                          <QrCode size={120} className="mb-4 text-coffee-900" />
                          <p className="font-semibold text-coffee-800">{manualConfig.qrisMerchantName}</p>
                          <p className="mt-2 text-sm text-coffee-500">
                            QRIS manual belum diisi gambar aslinya. Anda bisa menambahkan URL QR di file `.env`.
                          </p>
                        </div>
                      )
                    ) : isBankTransfer ? (
                      <div className="flex h-full flex-col justify-center text-center">
                        <Landmark size={72} className="mx-auto mb-4 text-coffee-900" />
                        <p className="text-sm text-coffee-500">Transfer ke rekening</p>
                        <p className="mt-2 text-2xl font-bold text-coffee-800">{manualConfig.bankName}</p>
                        <p className="mt-2 text-lg font-semibold text-coffee-900">
                          {manualConfig.bankAccountNumber}
                        </p>
                        <p className="mt-2 text-sm text-coffee-500">
                          a.n. {manualConfig.bankAccountName}
                        </p>
                      </div>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center text-center">
                        <Wallet size={96} className="mb-4 text-coffee-900" />
                        <p className="font-semibold text-coffee-800">Pembayaran di Kasir</p>
                        <p className="mt-2 text-sm text-coffee-500">
                          Tidak ada pembayaran online untuk metode ini.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-coffee-300 bg-coffee-50 p-4">
                    <p className="mb-1 text-sm text-coffee-500">Total Pembayaran</p>
                    <p className="text-3xl font-bold text-coffee-900">
                      {formatCurrency(orderMeta?.total ?? order.total_amount)}
                    </p>
                  </div>

                  {!isCashPayment && (
                    <div className={`rounded-2xl border p-4 ${isRejected ? "border-red-200 bg-red-50" : "border-blue-200 bg-blue-50"}`}>
                      <p className={`text-sm ${isRejected ? "text-red-700" : "text-blue-800"}`}>
                        {isRejected
                          ? "Gunakan tombol kirim ulang setelah Anda memperbaiki referensi atau mengganti bukti pembayaran. Order akan tetap pending sampai admin memverifikasi ulang."
                          : "Setelah Anda benar-benar membayar, unggah bukti lalu kirim konfirmasi. Status order akan tetap `pending` sampai admin memverifikasi pembayaran."}
                      </p>
                    </div>
                  )}

                  {gatewayMessage && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                      <p className="text-sm text-red-700">{gatewayMessage}</p>
                    </div>
                  )}

                  {isCancelled && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                      <p className="text-sm text-red-700">
                        Order ini sudah dibatalkan oleh admin. Pembayaran tidak bisa dikirim lagi untuk order ini.
                      </p>
                    </div>
                  )}

                  {isRejected && !isCashPayment && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                      <p className="text-sm text-red-700">
                        {order?.payment_rejection_reason ||
                          "Konfirmasi pembayaran sebelumnya ditolak admin. Periksa ulang bukti bayar atau referensi pembayaran, lalu kirim ulang dari halaman ini."}
                      </p>
                    </div>
                  )}

                  {isCancelled && order?.cancel_reason && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                      <p className="text-sm text-red-700">
                        Alasan pembatalan: {order.cancel_reason}
                      </p>
                    </div>
                  )}

                  {isCashPayment ? (
                    <Button
                      onClick={handleCashFlow}
                      disabled={isAlreadyPaid || isCancelled}
                      className="w-full bg-coffee-900 py-6 text-base font-bold text-white hover:bg-coffee-800"
                    >
                      <Wallet className="mr-2" size={18} />
                      {paymentInstruction.actionLabel}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleManualPayment}
                      disabled={paymentLoading || isAlreadyPaid || isAwaitingVerification || isCancelled}
                      className="w-full bg-coffee-900 py-6 text-base font-bold text-white hover:bg-coffee-800"
                    >
                      {isQrisPayment ? <QrCode className="mr-2" size={18} /> : <Landmark className="mr-2" size={18} />}
                      {paymentLoading ? "Mengirim Konfirmasi..." : paymentInstruction.actionLabel}
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/orders")}
                    className="w-full py-6 text-base font-bold"
                  >
                    Lihat Status Pesanan
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl bg-coffee-100 p-4">
                    <p className="mb-1 text-sm text-coffee-500">Kode Pembayaran</p>
                    <p className="text-lg font-bold text-coffee-800">
                      ORDER-{String(order.id).slice(0, 8).toUpperCase()}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-coffee-100 p-4">
                    <p className="mb-1 text-sm text-coffee-500">Status Saat Ini</p>
                    <p className="font-semibold capitalize text-coffee-900">{order.status}</p>
                  </div>

                  <div className="rounded-2xl bg-coffee-100 p-4">
                    <p className="mb-1 text-sm text-coffee-500">Metode Pembayaran</p>
                    <p className="font-semibold text-coffee-800">{getPaymentMethodLabel()}</p>
                  </div>

                  {isQrisPayment && (
                    <div className="rounded-2xl bg-coffee-100 p-4">
                      <p className="mb-1 text-sm text-coffee-500">Merchant QRIS</p>
                      <p className="font-semibold text-coffee-800">{qrisMerchantLabel || "-"}</p>
                    </div>
                  )}

                  {isBankTransfer && (
                    <div className="rounded-2xl bg-coffee-100 p-4">
                      <p className="mb-1 text-sm text-coffee-500">Rekening Tujuan</p>
                      <p className="font-semibold text-coffee-800">
                        {manualConfig.bankName} {manualConfig.bankAccountNumber}
                      </p>
                      <p className="mt-1 text-sm text-coffee-500">a.n. {manualConfig.bankAccountName}</p>
                    </div>
                  )}

                  {!isCashPayment && (
                    <div className="rounded-2xl bg-coffee-100 p-4">
                      <Label htmlFor="paymentReference" className="mb-2 block">
                        {isBankTransfer ? "Referensi Transfer" : "Keterangan Pembayaran"}
                      </Label>
                      <Input
                        id="paymentReference"
                        value={paymentReference}
                        onChange={(event) => setPaymentReference(event.target.value)}
                        placeholder={
                          isBankTransfer
                            ? "Contoh: BCA a.n. Andi / 4581"
                            : "Contoh: OVO Andi / bayar jam 14:32"
                        }
                      />
                      <p className="mt-2 text-xs text-coffee-500">
                        Data ini membantu admin mencocokkan pembayaran manual Anda.
                      </p>
                    </div>
                  )}

                  {!isCashPayment && (
                    <div className="rounded-2xl bg-coffee-100 p-4">
                      <Label htmlFor="proofFile" className="mb-2 block">
                        Upload Bukti Pembayaran
                      </Label>
                      <Input
                        id="proofFile"
                        type="file"
                        accept="image/*"
                        onChange={handleProofChange}
                      />
                      <p className="mt-2 text-xs text-coffee-500">
                        Format gambar, maksimal 1 MB. Gunakan screenshot mutasi atau foto bukti transfer.
                      </p>

                      {proofPreview && (
                        <div className="mt-4 overflow-hidden rounded-2xl border border-coffee-300 bg-white p-3">
                          <img
                            src={proofPreview}
                            alt="Preview bukti pembayaran"
                            className="h-48 w-full rounded-xl object-cover"
                          />
                          <p className="mt-3 text-xs text-coffee-500">
                            {proofFile?.name || orderMeta?.manualPaymentProofName || "Bukti pembayaran"}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="border-0 p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <ReceiptText className="mt-1 text-coffee-900" size={20} />
                <div>
                  <h2 className="text-xl font-bold text-coffee-800">Ringkasan Order</h2>
                  <p className="mt-1 text-sm text-coffee-500">
                    Pastikan detail pesanan dan nomor meja sudah sesuai sebelum konfirmasi pembayaran.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex justify-between gap-4">
                  <span className="text-coffee-500">Order ID</span>
                  <span className="text-right font-semibold text-coffee-800">{order.id}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-coffee-500">Nomor Meja</span>
                  <span className="text-right font-semibold text-coffee-800">
                    {orderMeta?.tableNumber || order.table_number || "-"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-coffee-500">Tipe Order</span>
                  <span className="text-right font-semibold capitalize text-coffee-800">
                    {orderMeta?.orderTypeLabel || order.order_type || "-"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-coffee-500">Pemesan</span>
                  <span className="text-right font-semibold text-coffee-800">
                    {orderMeta?.customerName || order.customer_name || "-"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-coffee-500">No. WhatsApp</span>
                  <span className="text-right font-semibold text-coffee-800">
                    {orderMeta?.customerPhone || order.customer_phone || "-"}
                  </span>
                </div>
                {orderMeta?.deliveryAddress && (
                  <div className="flex justify-between gap-4">
                    <span className="text-coffee-500">Alamat</span>
                    <span className="text-right font-semibold text-coffee-800">
                      {orderMeta.deliveryAddress}
                    </span>
                  </div>
                )}
                {orderMeta?.notes && (
                  <div className="flex justify-between gap-4">
                    <span className="text-coffee-500">Catatan</span>
                    <span className="text-right font-semibold text-coffee-800">
                      {orderMeta.notes}
                    </span>
                  </div>
                )}
                <div className="flex justify-between gap-4 border-t pt-4">
                  <span className="text-coffee-500">Total</span>
                  <span className="text-right font-bold text-coffee-900">
                    {formatCurrency(orderMeta?.total ?? order.total_amount)}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="border-0 bg-coffee-100 p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 text-green-600" size={20} />
                <div>
                  <h2 className="text-lg font-bold text-coffee-800">Setelah pembayaran</h2>
                  <p className="mt-2 text-sm text-coffee-600">
                    {isCashPayment
                      ? "Karena metode bayar yang dipilih adalah kasir, pesanan akan tetap masuk dan statusnya bisa dipantau dari order history sambil menunggu pembayaran offline."
                      : "Setelah Anda kirim konfirmasi pembayaran manual, order akan menunggu verifikasi admin. Setelah diverifikasi, status order baru berubah menjadi paid dan masuk ke alur proses kitchen."}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentPage
