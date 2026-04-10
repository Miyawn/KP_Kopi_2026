import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

export default function BestSellingChart({ orders = [] }) {
  const grouped = {}

  orders.forEach((order) => {
    if (order.status === "cancelled") return

    ;(order.order_items || []).forEach((item) => {
      const name = item.products?.name || "Produk"
      grouped[name] = (grouped[name] || 0) + Number(item.quantity ?? 0)
    })
  })

  const data = Object.keys(grouped)
    .map((name) => ({ name, total: grouped[name] }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  return (
    <div className="rounded-[24px] border border-stone-200 bg-white p-6 shadow-none">
      <h2 className="mb-1 text-lg font-bold text-stone-900">Top 5 Produk Terlaris</h2>
      <p className="mb-6 text-sm text-stone-500">Akumulasi quantity penjualan sesuai periode filter dashboard.</p>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
          <XAxis dataKey="name" tick={{ fill: "#78716c", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#78716c", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(value) => [value, "Terjual"]}
            contentStyle={{
              borderRadius: "16px",
              border: "1px solid #e7e5e4",
              boxShadow: "0 20px 40px rgba(15,23,42,0.08)",
            }}
          />
          <Bar dataKey="total" fill="#292524" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
