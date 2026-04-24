import { invokeAdminFunction } from "./adminFunctionClient"

export const reviewOrderPayment = async ({ orderId, decision, reason = "" }) => {
  if (!orderId) {
    throw new Error("Order ID wajib dikirim.")
  }

  const data = await invokeAdminFunction("review-manual-payment", {
    orderId,
    decision,
    reason,
  })

  if (!data?.success) {
    throw new Error(data?.error || "Review pembayaran gagal diproses.")
  }

  return data
}
