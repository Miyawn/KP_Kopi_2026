import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

type WebhookPayload = {
  order_id?: string
  status_code?: string
  gross_amount?: string
  signature_key?: string
  transaction_status?: string
  fraud_status?: string
  transaction_id?: string
  payment_type?: string
}

type OrderRow = {
  id: string
  status: string | null
}

const respond = (status: number, payload: Record<string, unknown>) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  })

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")

const createSignature = async (payload: WebhookPayload, serverKey: string) => {
  const raw = `${payload.order_id ?? ""}${payload.status_code ?? ""}${payload.gross_amount ?? ""}${serverKey}`
  const digest = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(raw))
  return toHex(digest)
}

const mapOrderStatus = (transactionStatus?: string, fraudStatus?: string) => {
  if (transactionStatus === "capture") {
    return fraudStatus === "accept" ? "paid" : "pending"
  }

  if (transactionStatus === "settlement") {
    return "paid"
  }

  if (transactionStatus === "pending") {
    return "pending"
  }

  if (transactionStatus === "expire") {
    return "expired"
  }

  if (["cancel", "deny", "failure"].includes(transactionStatus ?? "")) {
    return "cancelled"
  }

  return null
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return respond(405, { error: "Method not allowed" })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    const serverKey = Deno.env.get("MIDTRANS_SERVER_KEY")

    if (!supabaseUrl || !serviceRoleKey || !serverKey) {
      return respond(500, { error: "Webhook server belum terkonfigurasi." })
    }

    const payload = (await req.json()) as WebhookPayload

    if (!payload.order_id || !payload.signature_key) {
      return respond(400, { error: "Payload webhook tidak lengkap." })
    }

    const expectedSignature = await createSignature(payload, serverKey)

    if (expectedSignature !== payload.signature_key) {
      return respond(401, { error: "Signature Midtrans tidak valid." })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, status")
      .eq("payment_reference", payload.order_id)
      .single()

    if (orderError || !order) {
      return respond(404, { error: "Order untuk webhook ini tidak ditemukan." })
    }

    const typedOrder = order as OrderRow
    const mappedStatus = mapOrderStatus(payload.transaction_status, payload.fraud_status)
    const nextStatus =
      typedOrder.status === "done" && mappedStatus === "paid"
        ? "done"
        : mappedStatus ?? typedOrder.status

    const updatePayload: Record<string, unknown> = {
      payment_last_status: payload.transaction_status ?? null,
      payment_type: payload.payment_type ?? null,
      payment_transaction_id: payload.transaction_id ?? null,
      payment_payload: payload,
    }

    if (nextStatus) {
      updatePayload.status = nextStatus
    }

    if (nextStatus === "paid") {
      updatePayload.paid_at = new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", typedOrder.id)

    if (updateError) {
      return respond(500, { error: "Gagal update status order dari webhook." })
    }

    return respond(200, { success: true })
  } catch (error) {
    console.error("midtrans-webhook error", error)
    return respond(500, {
      error: error instanceof Error ? error.message : "Terjadi kesalahan server.",
    })
  }
})
