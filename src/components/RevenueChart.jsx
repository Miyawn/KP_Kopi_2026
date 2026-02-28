import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

export default function RevenueChart() {
  const [data, setData] = useState([])

  const fetchRevenueData = async () => {
    const { data: orders, error } = await supabase
      .from("orders")
      .select("created_at, total_amount, status")

    if (error) return

    // Ambil 7 hari terakhir
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - i)
      return d.toISOString().split("T")[0]
    }).reverse()

    const grouped = last7Days.map(date => {
      const revenue = orders
        .filter(o =>
          o.created_at.startsWith(date) &&
          o.status !== "cancelled"
        )
        .reduce((sum, o) => sum + o.total_amount, 0)

      return {
        date: date.slice(5), // MM-DD
        revenue,
      }
    })

    setData(grouped)
  }

  useEffect(() => {
    fetchRevenueData()

    const channel = supabase
      .channel("revenue-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => fetchRevenueData()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="bg-white p-6 rounded shadow mb-8">
      <h2 className="text-lg font-bold mb-4">
        Revenue 7 Hari Terakhir
      </h2>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#92400e"
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
