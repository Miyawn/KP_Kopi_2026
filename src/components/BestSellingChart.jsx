import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

export default function BestSellingChart() {
  const [data, setData] = useState([])

  const fetchBestSelling = async () => {
    const { data: items, error } = await supabase
      .from("order_items")
      .select(`
        quantity,
        products (
          name
        )
      `)

    if (error) return

    // Aggregate quantity per product
    const grouped = {}

    items.forEach(item => {
      const name = item.products.name

      if (!grouped[name]) {
        grouped[name] = 0
      }

      grouped[name] += item.quantity
    })

    const result = Object.keys(grouped)
      .map(name => ({
        name,
        total: grouped[name],
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    setData(result)
  }

  useEffect(() => {
    fetchBestSelling()

    const channel = supabase
      .channel("best-selling-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_items" },
        () => fetchBestSelling()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="bg-white p-6 rounded shadow mb-8">
      <h2 className="text-lg font-bold mb-4">
        Top 5 Produk Terlaris
      </h2>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="total" fill="#92400e" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}