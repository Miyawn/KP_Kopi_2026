import { supabase } from "../lib/supabase"

export const createOrder = async (cart, customerData) => {
  // Hitung total
  const total = cart.reduce((acc, item) => {
    return acc + item.price * item.quantity
  }, 0)

  // Insert order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert([
      {
        customer_name: customerData.name,
        customer_phone: customerData.phone,
        order_type: customerData.type,
        table_number: customerData.table,
        total_amount: total
      }
    ])
    .select()
    .single()

  if (orderError) {
    console.error(orderError)
    throw orderError
  }

  // Insert order items
  const orderItems = cart.map(item => ({
    order_id: order.id,
    product_id: item.id,
    quantity: item.quantity,
    price: item.price
  }))

  const { error: itemError } = await supabase
    .from("order_items")
    .insert(orderItems)

  if (itemError) {
    console.error(itemError)
    throw itemError
  }

  return order
}