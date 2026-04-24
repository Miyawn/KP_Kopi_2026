import { useEffect, useMemo, useState } from "react"
import { Edit3, Package, Plus, Save, Search, Trash2 } from "lucide-react"
import { Button } from "./ui/button"
import { Card } from "./ui/card"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Badge } from "./ui/badge"
import { deleteAdminProduct, saveAdminProduct } from "../services/adminBackendService"
import { supabase } from "../lib/supabase"

const EMPTY_FORM = {
  id: null,
  name: "",
  description: "",
  price: "",
  stock: "",
  category: "",
  image_url: "",
  is_available: true,
}
const PRODUCT_IMAGE_BUCKET = "product-images"
const MAX_PRODUCT_IMAGE_SIZE = 2 * 1024 * 1024

const formatCurrency = (amount) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount ?? 0)

export default function AdminProductManagement({ products: externalProducts = [], onRefresh }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [form, setForm] = useState(EMPTY_FORM)
  const [feedback, setFeedback] = useState({ type: "", message: "" })
  const [saving, setSaving] = useState(false)
  const [deletingProductId, setDeletingProductId] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState("")

  const products = externalProducts
  const loading = false

  useEffect(() => {
    if (!feedback.message || feedback.type !== "success") return

    const timeoutId = window.setTimeout(() => {
      setFeedback({ type: "", message: "" })
    }, 4000)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [feedback])

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return products.filter((product) => {
      if (!query) return true

      return [product.name, product.category, product.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    })
  }, [products, searchQuery])

  const inventorySummary = useMemo(() => {
    return {
      totalProducts: products.length,
      activeProducts: products.filter((product) => product.is_available).length,
      lowStockProducts: products.filter((product) => Number(product.stock ?? 0) <= 5).length,
      outOfStockProducts: products.filter((product) => Number(product.stock ?? 0) === 0).length,
    }
  }, [products])

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setImageFile(null)
    setImagePreview("")
  }

  const uploadProductImage = async (file) => {
    const rawExtension = file.name?.split(".").pop()?.toLowerCase()
    const extension = rawExtension || (file.type?.split("/")?.[1] ?? "jpg")
    const uniqueFileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`
    const filePath = `products/${uniqueFileName}`

    const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    })

    if (error) {
      throw new Error(error.message || "Gagal upload gambar produk.")
    }

    const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(filePath)
    return data.publicUrl || ""
  }

  const handleImageChange = (event) => {
    const nextFile = event.target.files?.[0]

    if (!nextFile) {
      setImageFile(null)
      setImagePreview(form.image_url || "")
      return
    }

    if (!nextFile.type.startsWith("image/")) {
      setFeedback({ type: "error", message: "File gambar produk harus berupa image." })
      event.target.value = ""
      return
    }

    if (nextFile.size > MAX_PRODUCT_IMAGE_SIZE) {
      setFeedback({ type: "error", message: "Ukuran gambar maksimal 2 MB." })
      event.target.value = ""
      return
    }

    setFeedback({ type: "", message: "" })
    setImageFile(nextFile)

    const previewReader = new FileReader()
    previewReader.onload = () => {
      setImagePreview(String(previewReader.result || ""))
    }
    previewReader.readAsDataURL(nextFile)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.price) {
      setFeedback({ type: "error", message: "Nama produk dan harga wajib diisi." })
      return
    }

    try {
      setSaving(true)
      setFeedback({ type: "", message: "" })
      let imageUrl = form.image_url.trim()

      if (imageFile) {
        imageUrl = await uploadProductImage(imageFile)
      }

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        stock: Number(form.stock || 0),
        category: form.category.trim(),
        image_url: imageUrl,
        is_available: form.is_available,
      }

      await saveAdminProduct({
        id: form.id,
        ...payload,
      })
      const isEditing = Boolean(form.id)
      resetForm()
      await onRefresh?.()
      setFeedback({
        type: "success",
        message: isEditing ? "Produk berhasil diperbarui." : "Produk berhasil ditambahkan.",
      })
      setImageFile(null)
      setImagePreview("")
    } catch (error) {
      console.error("PRODUCT SAVE ERROR:", error)
      setFeedback({ type: "error", message: error.message || "Gagal menyimpan produk." })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (product) => {
    setForm({
      id: product.id,
      name: product.name || "",
      description: product.description || "",
      price: product.price || "",
      stock: product.stock || "",
      category: product.category || "",
      image_url: product.image_url || product.imageUrl || "",
      is_available: product.is_available ?? true,
    })
    setImageFile(null)
    setImagePreview(product.image_url || product.imageUrl || "")
  }

  const handleDelete = async (id) => {
    if (!confirm("Yakin hapus produk ini?")) return

    try {
      setDeletingProductId(id)
      setFeedback({ type: "", message: "" })
      await deleteAdminProduct(id)
      await onRefresh?.()
      setFeedback({ type: "success", message: "Produk berhasil dihapus." })
    } catch (error) {
      console.error("PRODUCT DELETE ERROR:", error)
      setFeedback({ type: "error", message: error.message || "Gagal menghapus produk." })
    } finally {
      setDeletingProductId(null)
    }
  }

  return (
    <div className="space-y-6">
      {feedback.message && (
        <Card
          className={
            feedback.type === "success"
              ? "border border-green-200 bg-green-50 p-5 shadow-none"
              : "border border-red-200 bg-red-50 p-5 shadow-none"
          }
        >
          <p
            className={
              feedback.type === "success"
                ? "font-medium text-green-800"
                : "font-medium text-red-800"
            }
          >
            {feedback.message}
          </p>
          <p
            className={
              feedback.type === "success"
                ? "mt-2 text-sm text-green-700"
                : "mt-2 text-sm text-red-700"
            }
          >
            {feedback.type === "success"
              ? "Perubahan inventory sudah tersimpan di backend admin."
              : "Periksa data form atau login ulang jika session admin sudah kedaluwarsa."}
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="border border-coffee-200 bg-white p-5 shadow-none">
          <p className="text-sm text-coffee-500">Total Produk</p>
          <p className="text-3xl font-bold text-coffee-900 mt-2">{inventorySummary.totalProducts}</p>
        </Card>
        <Card className="border border-coffee-200 bg-white p-5 shadow-none">
          <p className="text-sm text-coffee-500">Aktif Dijual</p>
          <p className="text-3xl font-bold text-coffee-900 mt-2">{inventorySummary.activeProducts}</p>
        </Card>
        <Card className="border border-coffee-200 bg-white p-5 shadow-none">
          <p className="text-sm text-coffee-500">Low Stock</p>
          <p className="text-3xl font-bold text-coffee-900 mt-2">{inventorySummary.lowStockProducts}</p>
        </Card>
        <Card className="border border-coffee-200 bg-white p-5 shadow-none">
          <p className="text-sm text-coffee-500">Out of Stock</p>
          <p className="text-3xl font-bold text-coffee-900 mt-2">{inventorySummary.outOfStockProducts}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
        <Card className="border border-coffee-200 bg-white p-6 shadow-none">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-coffee-900">
                {form.id ? "Edit Produk" : "Tambah Produk Baru"}
              </h2>
              <p className="text-sm text-coffee-500 mt-1">
                Kelola nama menu, kategori, harga, stok, dan status jual.
              </p>
            </div>
            <div className="rounded-2xl bg-coffee-100 p-3 text-coffee-800">
              {form.id ? <Edit3 size={18} /> : <Plus size={18} />}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="product-name">Nama Produk</Label>
              <Input
                id="product-name"
                value={form.name}
                onChange={(event) => setField("name", event.target.value)}
                placeholder="Contoh: Es Kopi Susu"
              />
            </div>

            <div>
              <Label htmlFor="product-category">Kategori</Label>
              <Input
                id="product-category"
                value={form.category}
                onChange={(event) => setField("category", event.target.value)}
                placeholder="Coffee / Non-Coffee / Snacks"
              />
            </div>

            <div>
              <Label htmlFor="product-image-file">Upload Gambar Produk</Label>
              <Input
                id="product-image-file"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
              <p className="mt-1 text-xs text-coffee-500">
                Format image, maksimal 2 MB. Gambar otomatis disimpan ke storage.
              </p>
              {(imagePreview || form.image_url) && (
                <div className="mt-3 overflow-hidden rounded-xl border border-coffee-200 bg-white p-2">
                  <img
                    src={imagePreview || form.image_url}
                    alt="Preview gambar produk"
                    className="h-36 w-full rounded-lg object-cover"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product-price">Harga</Label>
                <Input
                  id="product-price"
                  type="number"
                  value={form.price}
                  onChange={(event) => setField("price", event.target.value)}
                  placeholder="25000"
                />
              </div>

              <div>
                <Label htmlFor="product-stock">Stok</Label>
                <Input
                  id="product-stock"
                  type="number"
                  value={form.stock}
                  onChange={(event) => setField("stock", event.target.value)}
                  placeholder="50"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="product-description">Deskripsi</Label>
              <textarea
                id="product-description"
                value={form.description}
                onChange={(event) => setField("description", event.target.value)}
                rows={4}
                className="flex min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Deskripsi singkat produk"
              />
            </div>

            <label className="flex items-center justify-between rounded-2xl border border-coffee-200 bg-coffee-50 p-4 cursor-pointer">
              <div>
                <p className="font-medium text-coffee-900">Produk aktif dijual</p>
                <p className="text-sm text-coffee-500">Nonaktifkan jika item sedang tidak ingin ditampilkan.</p>
              </div>
              <input
                type="checkbox"
                checked={form.is_available}
                onChange={(event) => setField("is_available", event.target.checked)}
                className="h-4 w-4"
              />
            </label>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-coffee-900 text-white hover:bg-coffee-800"
            >
              <Save />
              {saving ? "Menyimpan..." : form.id ? "Update Produk" : "Simpan Produk"}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm} disabled={saving} className="border-coffee-200">
              Reset
            </Button>
          </div>
        </Card>

        <Card className="border border-coffee-200 bg-white p-6 shadow-none">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
            <div>
              <h2 className="text-xl font-bold text-coffee-900">Daftar Inventory</h2>
              <p className="text-sm text-coffee-500 mt-1">
                Cari produk, cek status stok, lalu edit dari tabel.
              </p>
            </div>

            <div className="relative min-w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-coffee-400" size={16} />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari nama, kategori, atau deskripsi"
                className="pl-9"
              />
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-dashed border-coffee-300 bg-coffee-50 p-8 text-center">
              <p className="font-medium text-coffee-700">Memuat data produk...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-coffee-300 bg-coffee-50 p-8 text-center">
              <p className="font-medium text-coffee-700">Tidak ada produk yang cocok.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-coffee-200 text-sm text-coffee-500">
                    <th className="text-left py-3 pr-4 font-medium">Produk</th>
                    <th className="text-left py-3 pr-4 font-medium">Kategori</th>
                    <th className="text-left py-3 pr-4 font-medium">Harga</th>
                    <th className="text-left py-3 pr-4 font-medium">Stok</th>
                    <th className="text-left py-3 pr-4 font-medium">Status</th>
                    <th className="text-right py-3 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const lowStock = Number(product.stock ?? 0) <= 5
                    const productImage = product.image_url || product.imageUrl

                    return (
                      <tr key={product.id} className="border-b border-coffee-100 align-top">
                        <td className="py-4 pr-4">
                          <div className="flex items-start gap-3">
                            {productImage ? (
                              <img
                                src={productImage}
                                alt={product.name}
                                className="h-12 w-12 rounded-xl border border-coffee-200 object-cover"
                              />
                            ) : (
                              <div className="rounded-xl bg-coffee-100 p-3 text-coffee-600">
                                <Package size={16} />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-coffee-900">{product.name}</p>
                              <p className="text-sm text-coffee-500 mt-1 line-clamp-2">
                                {product.description || "Tanpa deskripsi"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 pr-4 text-coffee-700">{product.category || "-"}</td>
                        <td className="py-4 pr-4 font-medium text-coffee-900">
                          {formatCurrency(product.price)}
                        </td>
                        <td className="py-4 pr-4">
                          <Badge
                            className={
                              lowStock
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-coffee-100 text-coffee-700 border-coffee-200"
                            }
                          >
                            {product.stock ?? 0}
                          </Badge>
                        </td>
                        <td className="py-4 pr-4">
                          <Badge
                            className={
                              product.is_available
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-coffee-100 text-coffee-600 border-coffee-200"
                            }
                          >
                            {product.is_available ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleEdit(product)}
                              disabled={saving || deletingProductId === product.id}
                              className="border-coffee-200"
                            >
                              <Edit3 />
                            </Button>
                            <Button
                              type="button"
                              onClick={() => handleDelete(product.id)}
                              disabled={saving || deletingProductId === product.id}
                              className="bg-red-600 text-white hover:bg-red-700"
                            >
                              <Trash2 />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
