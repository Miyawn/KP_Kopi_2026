import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, ShoppingBag } from "lucide-react"
import { supabase } from "../lib/supabase"
import { useCart } from "../context/CartContext"
import MenuCard from "../components/MenuCard"
import CategoryFilter from "../components/CategoryFilter"
import { Button } from "../components/ui/button"

const formatCurrency = (amount) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount ?? 0)

export default function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState("Semua")

  const { getTotalItems, getTotalPrice } = useCart()

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_available", true)
      .order("created_at", { ascending: false })

    if (error) {
      console.error(error)
    } else {
      setProducts(data)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const categories = useMemo(() => {
    const uniqueCategories = ["Semua", ...new Set(products.map((product) => product.category).filter(Boolean))]
    return uniqueCategories
  }, [products])

  const filteredProducts =
    activeCategory === "Semua"
      ? products
      : products.filter((product) => product.category === activeCategory)

  const totalItems = getTotalItems()
  const totalPrice = getTotalPrice()

  return (
    <div className="min-h-screen bg-white">
      <div
        className="relative min-h-[640px] bg-cover bg-center bg-no-repeat flex items-center overflow-hidden"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url("https://images.unsplash.com/photo-1495474472645-4d71bcdd2085?w=1400&q=90")',
        }}
      >
        <div className="max-w-7xl mx-auto w-full px-4 grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center py-20">
          <div className="text-white max-w-3xl">
            <p className="uppercase tracking-[0.35em] text-sm mb-5 opacity-80">Web Ordering</p>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight leading-none">
              Pesan menu favorit langsung dari web.
            </h1>
            <p className="text-lg md:text-xl mb-10 opacity-95 font-light leading-relaxed max-w-2xl">
              Pilih menu, atur tipe order, lanjut ke payment page, lalu pantau seluruh progress
              pesanan dari order history.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#menu">
                <Button
                  size="lg"
                  className="bg-amber-700 hover:bg-amber-800 text-white font-semibold px-10 py-6 text-base rounded-full shadow-md hover:shadow-lg"
                >
                  Mulai Pesan
                </Button>
              </a>
              <Link to="/orders">
                <Button
                  size="lg"
                  variant="outline"
                  className="px-10 py-6 text-base rounded-full border-white/40 bg-white/10 text-white hover:bg-white/20"
                >
                  Lihat Order History
                </Button>
              </Link>
            </div>
          </div>

          <div className="lg:justify-self-end">
            <div className="rounded-[28px] border border-white/15 bg-white/10 backdrop-blur-md p-6 text-white max-w-md">
              <p className="text-sm uppercase tracking-[0.25em] opacity-75">Flow Order</p>
              <h2 className="text-2xl font-bold mt-3">Mekanisme pemesanan web</h2>
              <div className="space-y-4 mt-6">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-sm opacity-75">1. Pilih Menu</p>
                  <p className="font-semibold mt-1">Tambah item ke keranjang dari halaman menu.</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-sm opacity-75">2. Isi Checkout</p>
                  <p className="font-semibold mt-1">Lengkapi data pemesan, tipe order, dan metode bayar.</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-sm opacity-75">3. Bayar & Pantau</p>
                  <p className="font-semibold mt-1">Selesaikan pembayaran dan pantau order sampai selesai.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-20" id="menu">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Menu Pilihan
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Semua menu tersedia untuk pemesanan via web selama stok masih ada.
          </p>
        </div>

        <div className="mb-12">
          <CategoryFilter
            categories={categories}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
          />
        </div>

        {loading ? (
          <div className="text-center py-16">
            <p className="text-xl text-gray-500">Loading menu...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <MenuCard key={product.id} menu={product} />
            ))}
          </div>
        )}

        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-xl text-gray-500">Tidak ada menu untuk kategori ini.</p>
          </div>
        )}
      </div>

      {totalItems > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-3xl">
          <div className="rounded-2xl bg-stone-900 text-white shadow-2xl px-5 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/10 p-3">
                <ShoppingBag size={20} />
              </div>
              <div>
                <p className="text-sm text-stone-300">{totalItems} item di keranjang</p>
                <p className="font-semibold">{formatCurrency(totalPrice)}</p>
              </div>
            </div>
            <Link to="/cart">
              <Button className="bg-amber-700 hover:bg-amber-800 text-white rounded-full px-6">
                Checkout
                <ArrowRight />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
