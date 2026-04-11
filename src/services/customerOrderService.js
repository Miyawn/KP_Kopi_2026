import { supabase } from "../lib/supabase"
import { getOrderAccessPayload, getOrderAccessPayloads } from "./customerOrderStorage"

export const fetchCustomerOrder = async (orderId) => {
  const accessPayload = getOrderAccessPayload(orderId)

  if (!accessPayload) {
    throw new Error("Akses order customer tidak ditemukan di browser ini.")
  }

  const { data, error } = await supabase.functions.invoke("get-customer-orders", {
    body: accessPayload,
  })

  if (error) {
    throw new Error(error.message || "Gagal mengambil data order.")
  }

  const order = data?.orders?.[0]

  if (!order) {
    throw new Error("Order tidak ditemukan atau token akses tidak valid.")
  }

  return order
}

export const fetchCustomerOrders = async (orderIds = []) => {
  const orders = getOrderAccessPayloads(orderIds)

  if (orders.length === 0) {
    return []
  }

  const { data, error } = await supabase.functions.invoke("get-customer-orders", {
    body: { orders },
  })

  if (error) {
    throw new Error(error.message || "Gagal mengambil riwayat order.")
  }

  return data?.orders || []
}
