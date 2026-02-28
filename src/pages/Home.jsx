import { useEffect, useState, useMemo } from "react"
import { Link } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { useCart } from "../context/CartContext"
import MenuCard from "../components/MenuCard"
import CategoryFilter from "../components/CategoryFilter"
import { Button } from "../components/ui/button"

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
    <div className="min-h-screen bg-white">
      
      {/* HERO SECTION */}
      <div
        className="relative h-[600px] bg-cover bg-center bg-no-repeat flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url("https://images.unsplash.com/photo-1495474472645-4d71bcdd2085?w=1400&q=90")',
        }}
      >
        <div className="text-center text-white px-4 max-w-3xl">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 tracking-tight">
            Brewed to Perfection
          </h1>
          <p className="text-lg md:text-xl mb-10 opacity-95 font-light leading-relaxed max-w-xl mx-auto">
            Experience the finest artisanal coffee crafted with passion and precision
          </p>
          <Link to="#menu">
            <Button
              size="lg"
              className="bg-amber-700 hover:bg-amber-800 text-white font-semibold px-12 py-6 text-base rounded-full transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Explore Our Menu
            </Button>
          </Link>
        </div>
      </div>

      {/* MENU SECTION */}
      <div className="max-w-7xl mx-auto px-4 py-20" id="menu">

        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Our Menu
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Carefully curated selection of premium coffee and treats
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
            <p className="text-xl text-gray-500">Loading menu...</p>
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
            <p className="text-xl text-gray-500">
              No menu items for this category
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
