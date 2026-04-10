import { useEffect, useState, useMemo } from "react"
import { Link } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { useCart } from "../context/CartContext"
import MenuCard from "../components/MenuCard"
import CategoryFilter from "../components/CategoryFilter"
import { Button } from "../components/ui/button"
import CoffeeBar from "../assets/kopisusu-coconut.jpg"

export default function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState("Semua")

  const { addToCart } = useCart()

  // 🔹 Fetch Products
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

  // 🔹 Generate Categories Dynamic
  const categories = useMemo(() => {
    const uniqueCategories = [
      "Semua",
      ...new Set(products.map(p => p.category).filter(Boolean)),
    ]
    return uniqueCategories
  }, [products])

  // 🔹 Filter Products
  const filteredProducts =
    activeCategory === "Semua"
      ? products
      : products.filter(p => p.category === activeCategory)

  return (
    <div className="min-h-screen bg-coffee-50">
      
      {/* HERO SECTION */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cream-100 via-coffee-100 to-coffee-300" />
        <div className="absolute inset-x-10 -top-20 h-72 bg-cream-200/70 blur-[120px] rounded-full" />
        <div className="relative max-w-7xl mx-auto px-6 py-24 mt-24 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left space-y-6 text-coffee-900">
            <p className="uppercase tracking-[0.25em] text-xs text-coffee-600">
              U CAN DO IT! Coffeeshop 
            </p>
            <h1 className="font-display text-5xl md:text-6xl leading-tight">
              Kopi terbaik untuk hari yang produktif
            </h1>
            <p className="text-lg md:text-xl text-coffee-700 max-w-2xl">
              Signature espresso, manual brew, dan pastry hangat untuk menemani kerja
              remote maupun temu komunitas.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <Link to="#menu">
                <Button
                  size="lg"
                  className="bg-cream-50/40 text-coffee-900 font-semibold px-8 py-6 rounded-xl shadow-soft hover:bg-cream-200/80"
                >
                  Lihat Menu
                </Button>
              </Link>
              <Link to="/contact">
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-cream-50/40 text-coffee-900 border-white/0 px-8 py-6 rounded-xl hover:bg-cream-200/80"
                >
                  Reservasi Event
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex-1 w-full">
            <div className="relative rounded-3xl overflow-hidden shadow-soft ring-1 ring-white/10">
              <img
                src={CoffeeBar}
                alt="Coffee bar"
                className="w-full h-[380px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-coffee-900/60 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </div>

      {/* MENU SECTION */}
      <div className="max-w-7xl mx-auto px-6 py-20" id="menu">

        <div className="text-center mb-16 space-y-4">
          <p className="uppercase tracking-[0.2em] text-xs text-coffee-500">pilihan hari ini</p>
          <h2 className="text-4xl md:text-5xl font-display text-coffee-900">
            Rekomendasi Barista
          </h2>
          <p className="text-coffee-600 text-lg max-w-2xl mx-auto">
            Single origin, signature latte, hingga pastry fresh-baked. Pilih sesuai mood kamu.
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-12">
          <CategoryFilter
            categories={categories}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
          />
        </div>

        {loading ? (
          <div className="text-center py-16">
            <p className="text-xl text-coffee-500">Memuat menu...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <MenuCard
                key={product.id}
                menu={product}
                onAddToCart={() => addToCart(product)}
                disabled={product.stock === 0}
              />
            ))}
          </div>
        )}

        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-xl text-coffee-500">
              Belum ada menu di kategori ini
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
