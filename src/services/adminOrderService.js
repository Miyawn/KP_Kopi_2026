import { supabase } from "../lib/supabase"

export const reviewOrderPayment = async ({ orderId, decision, reason = "" }) => {
  if (!orderId) {
    throw new Error("Order ID wajib dikirim.")
  }

  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token

  const { data, error } = await supabase.functions.invoke("review-manual-payment", {
    body: {
      orderId,
      decision,
      reason,
    },
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : undefined,
  })

  if (error) {
    throw new Error(error.message || "Gagal memproses review pembayaran.")
  }

  if (!data?.success) {
    throw new Error(data?.error || "Review pembayaran gagal diproses.")
  }

  return data
}
