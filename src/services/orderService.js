// src/services/orderService.js

import { supabase } from "../lib/supabase"
import { saveOrderToHistory } from "./orderHistoryService"

export const submitOrder = async (cartItems) => {
  try {
    // Validasi cart
    if (!cartItems || cartItems.length === 0) {
      throw new Error("Cart kosong")
    }

    // 1. Hitung total harga
    const totalPrice = cartItems.reduce((total, item) => {
      return total + item.price * item.quantity
    }, 0)

    // 2. Insert ke tabel orders
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          customer_name: "Guest",
          customer_phone: "0000000000",
          order_type: "takeaway",
          total_amount: totalPrice,
          status: "pending",
        },
      ])
      .select()
      .single()

    if (orderError) throw orderError

    const orderId = order.id

    // 3. Siapkan data order_items
    const orderItemsPayload = cartItems.map((item) => ({
      order_id: orderId,
      product_id: item.id,
      quantity: item.quantity,
      price: item.price,
    }))

    // 4. Insert ke order_items
    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItemsPayload)

    if (itemsError) throw itemsError

    // 5. Simpan order_id ke localStorage
    saveOrderToHistory(orderId)

    return {
      success: true,
      orderId,
    }
  } catch (error) {
    console.error("Submit order error:", error)

    return {
      success: false,
      error: error.message,
    }
  }
}
