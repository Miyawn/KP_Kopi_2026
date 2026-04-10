import { supabase } from "../lib/supabase"

export const submitOrder = async ({
  customerName,
  customerPhone,
  orderType,
  tableNumber,
  items,
}) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Cart kosong")
  }

  const { data, error } = await supabase.functions.invoke("create-order", {
    body: {
      customerName,
      customerPhone,
      orderType,
      tableNumber,
      items: items.map((item) => ({
        id: item.id,
        quantity: Number(item.quantity ?? 0),
      })),
    },
  })

  if (error) {
    throw new Error(error.message || "Gagal membuat order.")
  }

  if (!data?.orderId) {
    throw new Error(data?.error || "Order ID tidak diterima dari backend.")
  }

  return {
    success: true,
    orderId: data.orderId,
  }
}
