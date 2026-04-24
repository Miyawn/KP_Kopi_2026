import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, Bike, CreditCard, MapPinned, NotebookText, Store, Table2 } from "lucide-react"
import { Button } from "../components/ui/button"
import { Card } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select"
import { useCart } from "../context/CartContext"
import { saveOrderToHistory } from "../services/orderHistoryService"
import {
  clearCheckoutDraft,
  getCheckoutDraft,
  saveCheckoutDraft,
  saveOrderMetadata,
} from "../services/customerOrderStorage"
import { submitOrder } from "../services/orderService"

const ORDER_TYPE_OPTIONS = [
  {
    value: "dine-in",
    label: "Dine In",
    description: "Pesanan diantar ke meja Anda.",
    icon: Table2,
  },
  {
    value: "takeaway",
    label: "Take Away",
    description: "Ambil pesanan di pickup counter.",
    icon: Store,
  },
  {
    value: "delivery",
    label: "Delivery",
    description: "Kurir internal mengantar ke alamat Anda.",
    icon: Bike,
  },
]

const PAYMENT_METHOD_OPTIONS = [
  {
    value: "qris",
    label: "QRIS Manual",
    description: "Scan QRIS di payment page lalu klik konfirmasi pembayaran.",
  },
  {
    value: "bank_transfer",
    label: "Transfer Bank Manual",
    description: "Lihat rekening tujuan di payment page lalu konfirmasi setelah transfer.",
  },
  {
    value: "cash",
    label: "Bayar di Kasir",
    description: "Lanjut order dulu, bayar saat datang atau saat pesanan siap.",
  },
]

const formatCurrency = (amount) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount ?? 0)

export default function Checkout() {
  const { cartItems, getTotalPrice, getTotalItems, clearCart } = useCart()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(() => getCheckoutDraft())

  const subtotal = getTotalPrice()
  const totalItems = getTotalItems()

  const orderTypeConfig = ORDER_TYPE_OPTIONS.find((option) => option.value === form.orderType)

  const estimatedMinutes = useMemo(() => {
    const base = form.orderType === "delivery" ? 30 : form.orderType === "takeaway" ? 18 : 12
    return base + Math.max(totalItems - 1, 0) * 2
  }, [form.orderType, totalItems])

  useEffect(() => {
    saveCheckoutDraft(form)
  }, [form])

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    if (!form.customerName.trim()) {
      return "Nama pemesan wajib diisi."
    }

    if (!form.customerPhone.trim()) {
      return "Nomor WhatsApp wajib diisi."
    }

    if (form.orderType === "dine-in" && !form.tableNumber.trim()) {
      return "Nomor meja wajib diisi untuk dine in."
    }

    if (form.orderType === "delivery" && !form.deliveryAddress.trim()) {
      return "Alamat pengantaran wajib diisi untuk delivery."
    }

    return null
  }

  const handleSubmitOrder = async (event) => {
    event.preventDefault()

    const validationError = validateForm()
    if (validationError) {
      alert(validationError)
      return
    }

    setSubmitting(true)

    try {
      const { orderId, accessToken } = await submitOrder({
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        orderType: form.orderType,
        tableNumber:
          form.orderType === "dine-in"
            ? form.tableNumber.trim()
            : form.orderType === "delivery"
              ? "DELIVERY"
              : "PICKUP",
        items: cartItems.map((item) => ({
          id: item.id,
          quantity: item.quantity,
        })),
      })

      saveOrderToHistory(orderId)
      saveOrderMetadata(orderId, {
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        orderType: form.orderType,
        orderTypeLabel: orderTypeConfig?.label ?? form.orderType,
        paymentMethod: form.paymentMethod,
        tableNumber: form.tableNumber.trim(),
        deliveryAddress: form.deliveryAddress.trim(),
        notes: form.notes.trim(),
        subtotal,
        total: subtotal,
        totalItems,
        estimatedMinutes,
        createdAt: new Date().toISOString(),
        accessToken,
      })

      clearCheckoutDraft()
      clearCart()
      navigate("/payment")
    } catch (error) {
      console.error("CHECKOUT ERROR:", error)
      alert(error.message || "Terjadi kesalahan saat membuat pesanan.")
    } finally {
      setSubmitting(false)
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-coffee-50 flex items-center justify-center px-4">
        <Card className="p-8 text-center max-w-md border-0 shadow-sm">
          <p className="text-coffee-500 text-lg mb-4">Keranjang masih kosong.</p>
          <Link to="/">
            <Button className="bg-coffee-900 text-white hover:bg-coffee-800">
              Kembali ke Menu
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-coffee-50 mt-30 mb-8 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <Link
          to="/cart"
          className="inline-flex items-center gap-2 text-coffee-900 mb-6 hover:opacity-80"
        >
          <ArrowLeft size={18} />
          Kembali ke Keranjang
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
          <div className="space-y-6">
            <Card className="border border-coffee-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)] overflow-hidden">
              <div className="bg-coffee-900 text-white p-6">
                <p className="text-sm uppercase tracking-[0.2em] opacity-75">U Can Do It! Coffeeshop</p>
                <h1 className="text-3xl font-bold mt-2">Lengkapi detail pesanan Anda</h1>
                <p className="text-coffee-300 mt-3 max-w-2xl">
                  Pilih tipe order, isi data customer, dan tentukan metode pembayaran sebelum
                  melanjutkan ke halaman payment.
                </p>
              </div>

              <form onSubmit={handleSubmitOrder} className="p-6 space-y-8">
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <MapPinned className="text-coffee-900" size={20} />
                    <div>
                      <h2 className="text-xl font-bold text-coffee-800">Info Pemesan</h2>
                      <p className="text-sm text-coffee-500">
                        Data ini dipakai untuk kebutuhan konfirmasi pesanan.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customerName">Nama Pemesan</Label>
                      <Input
                        id="customerName"
                        value={form.customerName}
                        onChange={(event) => setField("customerName", event.target.value)}
                        placeholder="Contoh: Andi Saputra"
                      />
                    </div>

                    <div>
                      <Label htmlFor="customerPhone">Nomor WhatsApp</Label>
                      <Input
                        id="customerPhone"
                        value={form.customerPhone}
                        onChange={(event) => setField("customerPhone", event.target.value)}
                        placeholder="08xxxxxxxxxx"
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <NotebookText className="text-coffee-900" size={20} />
                    <div>
                      <h2 className="text-xl font-bold text-coffee-800">Tipe Order</h2>
                      <p className="text-sm text-coffee-500">
                        Pilih cara Anda menerima pesanan.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {ORDER_TYPE_OPTIONS.map((option) => {
                      const Icon = option.icon
                      const isActive = form.orderType === option.value

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setField("orderType", option.value)}
                          className={`rounded-2xl border p-4 text-left transition ${
                            isActive
                              ? "border-coffee-900 bg-coffee-50"
                              : "border-coffee-200 bg-white hover:border-coffee-300"
                          }`}
                        >
                          <Icon className="text-coffee-900 mb-3" size={20} />
                          <p className="font-semibold text-coffee-800">{option.label}</p>
                          <p className="text-sm text-coffee-500 mt-1">{option.description}</p>
                        </button>
                      )
                    })}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {form.orderType === "dine-in" && (
                      <div>
                        <Label htmlFor="tableNumber">Nomor Meja</Label>
                        <Input
                          id="tableNumber"
                          value={form.tableNumber}
                          onChange={(event) => setField("tableNumber", event.target.value)}
                          placeholder="Contoh: A12"
                        />
                      </div>
                    )}

                    {form.orderType === "delivery" && (
                      <div className="md:col-span-2">
                        <Label htmlFor="deliveryAddress">Alamat Pengantaran</Label>
                        <textarea
                          id="deliveryAddress"
                          value={form.deliveryAddress}
                          onChange={(event) => setField("deliveryAddress", event.target.value)}
                          placeholder="Masukkan alamat lengkap, patokan, dan detail penerima"
                          className="flex min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                      </div>
                    )}
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <CreditCard className="text-coffee-900" size={20} />
                    <div>
                      <h2 className="text-xl font-bold text-coffee-800">Pembayaran & Catatan</h2>
                      <p className="text-sm text-coffee-500">
                        Pilih metode pembayaran dan tambahkan instruksi khusus jika perlu.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="paymentMethod">Metode Pembayaran</Label>
                      <Select
                        value={form.paymentMethod}
                        onValueChange={(value) => setField("paymentMethod", value)}
                      >
                        <SelectTrigger id="paymentMethod">
                          <SelectValue placeholder="Pilih metode pembayaran" />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_METHOD_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-coffee-500 mt-2">
                        {
                          PAYMENT_METHOD_OPTIONS.find((option) => option.value === form.paymentMethod)
                            ?.description
                        }
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="notes">Catatan Pesanan</Label>
                      <textarea
                        id="notes"
                        value={form.notes}
                        onChange={(event) => setField("notes", event.target.value)}
                        placeholder="Contoh: es batu sedikit, tanpa gula, hubungi saat sampai"
                        className="flex min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    </div>
                  </div>
                </section>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-coffee-900 text-white hover:bg-coffee-800 py-6 text-base font-bold"
                >
                  {submitting ? "Membuat Pesanan..." : "Lanjut ke Payment Page"}
                </Button>
              </form>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border border-coffee-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)] p-6">
              <h2 className="text-xl font-bold text-coffee-800">Ringkasan Order</h2>
              <p className="text-sm text-coffee-500 mt-1">
                Total item {totalItems} dengan estimasi selesai sekitar {estimatedMinutes} menit.
              </p>

              <div className="space-y-3 mt-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-coffee-800">{item.name}</p>
                      <p className="text-sm text-coffee-500">Qty {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-coffee-800">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t mt-6 pt-4 space-y-3">
                <div className="flex items-center justify-between text-sm text-coffee-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-coffee-500">
                  <span>Biaya layanan</span>
                  <span>Gratis</span>
                </div>
                <div className="flex items-center justify-between text-lg font-bold text-coffee-900">
                  <span>Total Bayar</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
              </div>
            </Card>

            <Card className="border border-coffee-200 bg-coffee-50/80 shadow-[0_18px_60px_rgba(15,23,42,0.06)] p-6">
              <h3 className="font-bold text-coffee-800">Mekanisme Order</h3>
              <ul className="mt-4 space-y-3 text-sm text-coffee-600">
                <li>1. Isi data customer dan pilih tipe order.</li>
                <li>2. Pilih metode pembayaran.</li>
                <li>3. Lanjut ke payment page untuk bayar atau konfirmasi cash.</li>
                <li>4. Pantau status pesanan di order history.</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
