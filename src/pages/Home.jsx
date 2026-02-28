import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { useCart } from "../context/CartContext"
import { Button } from "../components/ui/button"
import { Card } from "../components/ui/card"

export default function Home() {
  const [products, setProducts] = useState([])
  const { addToCart } = useCart()

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")

      if (error) {
        console.error(error)
      } else {
        setProducts(data)
      }
    }

    fetchProducts()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-6">Menu</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map(product => (
          <Card key={product.id} className="p-4">
            <h2 className="text-lg font-bold">{product.name}</h2>
            <p className="text-gray-600 text-sm mb-2">
              {product.description}
            </p>
            <p className="font-semibold mb-4">
              Rp {product.price.toLocaleString("id-ID")}
            </p>

            <Button
              onClick={() => addToCart({
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1
              })}
              className="w-full bg-amber-900 text-white"
            >
              Tambah ke Keranjang
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
