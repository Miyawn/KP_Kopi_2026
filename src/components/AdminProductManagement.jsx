import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { Button } from "./ui/button"
import { Card } from "./ui/card"

export default function AdminProductManagement() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({
    id: null,
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    is_available: true,
  })

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error) setProducts(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleSave = async () => {
    if (!form.name || !form.price) {
      alert("Nama dan harga wajib diisi")
      return
    }

    if (form.id) {
      await supabase
        .from("products")
        .update({
          name: form.name,
          description: form.description,
          price: parseInt(form.price),
          stock: parseInt(form.stock),
          category: form.category,
          is_available: form.is_available,
        })
        .eq("id", form.id)
    } else {
      await supabase
        .from("products")
        .insert({
          name: form.name,
          description: form.description,
          price: parseInt(form.price),
          stock: parseInt(form.stock),
          category: form.category,
          is_available: form.is_available,
        })
    }

    setForm({
      id: null,
      name: "",
      description: "",
      price: "",
      stock: "",
      category: "",
      is_available: true,
    })

    fetchProducts()
  }

  const handleEdit = (product) => {
    setForm({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category,
      is_available: product.is_available,
    })
  }

  const handleDelete = async (id) => {
    if (confirm("Yakin hapus produk?")) {
      await supabase.from("products").delete().eq("id", id)
      fetchProducts()
    }
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6">Manajemen Produk</h2>

      {/* Form */}
      <Card className="p-6 mb-6 space-y-3">
        <input
          placeholder="Nama Produk"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border p-2 w-full"
        />
        <input
          placeholder="Deskripsi"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="border p-2 w-full"
        />
        <input
          placeholder="Harga"
          type="number"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="border p-2 w-full"
        />
        <input
          placeholder="Stock"
          type="number"
          value={form.stock}
          onChange={(e) => setForm({ ...form, stock: e.target.value })}
          className="border p-2 w-full"
        />
        <input
          placeholder="Kategori"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="border p-2 w-full"
        />

        <Button
          onClick={handleSave}
          className="bg-amber-700 text-white w-full"
        >
          {form.id ? "Update Produk" : "Tambah Produk"}
        </Button>
      </Card>

      {/* Product List */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        products.map(product => (
          <Card key={product.id} className="p-4 mb-3 flex justify-between">
            <div>
              <p className="font-bold">{product.name}</p>
              <p className="text-sm text-gray-500">
                Rp {product.price.toLocaleString("id-ID")}
              </p>
              <p className="text-sm">
                Stock: {product.stock}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleEdit(product)}
                variant="outline"
              >
                Edit
              </Button>
              <Button
                onClick={() => handleDelete(product.id)}
                className="bg-red-600 text-white"
              >
                Delete
              </Button>
            </div>
          </Card>
        ))
      )}
    </div>
  )
}