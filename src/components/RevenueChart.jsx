import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const formatCurrency = (amount) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount ?? 0)

const listDaysInRange = (startDate, endDate) => {
  const result = []
  const cursor = new Date(`${startDate}T00:00:00`)
  const finish = new Date(`${endDate}T00:00:00`)

  while (cursor <= finish) {
    const year = cursor.getFullYear()
    const month = String(cursor.getMonth() + 1).padStart(2, "0")
    const day = String(cursor.getDate()).padStart(2, "0")
    result.push(`${year}-${month}-${day}`)
    cursor.setDate(cursor.getDate() + 1)
  }

  return result
}

export default function RevenueChart({ orders = [], startDate, endDate }) {
  const days = listDaysInRange(startDate, endDate)

  const data = days.map((date) => {
    const revenue = orders
      .filter((order) => order.created_at?.startsWith(date) && order.status !== "cancelled")
      .reduce((sum, order) => sum + Number(order.total_amount ?? 0), 0)

    return {
      date: date.slice(5),
      revenue,
    }
  })

  return (
    <div className="rounded-[24px] border border-stone-200 bg-white p-6 shadow-none">
      <h2 className="mb-1 text-lg font-bold text-stone-900">Revenue Per Periode</h2>
      <p className="mb-6 text-sm text-stone-500">Tren omzet harian berdasarkan periode filter dashboard.</p>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
          <XAxis dataKey="date" tick={{ fill: "#78716c", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: "#78716c", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `${Math.round(value / 1000)}k`}
          />
          <Tooltip
            formatter={(value) => [formatCurrency(value), "Revenue"]}
            contentStyle={{
              borderRadius: "16px",
              border: "1px solid #e7e5e4",
              boxShadow: "0 20px 40px rgba(15,23,42,0.08)",
            }}
          />
          <Line type="monotone" dataKey="revenue" stroke="#a16207" strokeWidth={3} dot={{ r: 4, fill: "#a16207" }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
