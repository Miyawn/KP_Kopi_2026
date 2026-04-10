import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

type OrderRow = {
  id: string
  total_amount: number | string | null
  customer_name: string | null
  customer_phone: string | null
  status: string | null
  order_type: string | null
  payment_provider?: string | null
  payment_reference?: string | null
  payment_token?: string | null
  payment_redirect_url?: string | null
  payment_last_status?: string | null
}

const respond = (status: number, payload: Record<string, unknown>) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  })

const getBasicAuthHeader = (serverKey: string) => {
  const credentials = btoa(`${serverKey}:`)
  return `Basic ${credentials}`
}

const getMidtransBaseUrl = (isProduction: boolean) =>
  isProduction ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com"

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
    const isProduction = Deno.env.get("MIDTRANS_IS_PRODUCTION") === "true"

    if (!supabaseUrl || !serviceRoleKey) {
      return respond(500, { error: "Supabase service credentials belum tersedia." })
    }

    if (!serverKey) {
      return respond(500, { error: "MIDTRANS_SERVER_KEY belum di-set." })
    }

    const body = await req.json()
    const orderId = body?.orderId

    if (!orderId) {
      return respond(400, { error: "orderId wajib dikirim." })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        id,
        total_amount,
        customer_name,
        customer_phone,
        status,
        order_type,
        payment_provider,
        payment_reference,
        payment_token,
        payment_redirect_url,
        payment_last_status
      `)
      .eq("id", orderId)
      .single()

    if (orderError || !order) {
      return respond(404, { error: "Order tidak ditemukan." })
    }

    const typedOrder = order as OrderRow

    if (["paid", "done"].includes(typedOrder.status ?? "")) {
      return respond(400, { error: "Order ini sudah dibayar." })
    }

    if (typedOrder.payment_provider === "midtrans" && typedOrder.payment_token) {
      return respond(200, {
        token: typedOrder.payment_token,
        redirect_url: typedOrder.payment_redirect_url,
        order_id: typedOrder.payment_reference,
        reused: true,
      })
    }

    const midtransOrderId = typedOrder.payment_reference ?? `KP-KOPI-${typedOrder.id}`
    const totalAmount = Number(typedOrder.total_amount ?? 0)

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return respond(400, { error: "Total order tidak valid untuk pembayaran." })
    }

    const payload = {
      transaction_details: {
        order_id: midtransOrderId,
        gross_amount: Math.round(totalAmount),
      },
      customer_details: {
        first_name: typedOrder.customer_name || "Customer",
        phone: typedOrder.customer_phone || "",
      },
      custom_field1: String(typedOrder.id),
      custom_field2: typedOrder.order_type || "",
    }

    const midtransResponse = await fetch(`${getMidtransBaseUrl(isProduction)}/snap/v1/transactions`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: getBasicAuthHeader(serverKey),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const responseJson = await midtransResponse.json().catch(() => null)

    if (!midtransResponse.ok || !responseJson?.token) {
      return respond(midtransResponse.status || 500, {
        error: responseJson?.error_messages?.[0] || responseJson?.status_message || "Gagal membuat transaksi Midtrans.",
        midtrans: responseJson,
      })
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        payment_provider: "midtrans",
        payment_reference: midtransOrderId,
        payment_token: responseJson.token,
        payment_redirect_url: responseJson.redirect_url,
        payment_last_status: "token_created",
        payment_payload: responseJson,
      })
      .eq("id", typedOrder.id)

    if (updateError) {
      return respond(500, { error: "Transaksi dibuat, tapi gagal menyimpan token pembayaran." })
    }

    return respond(200, {
      token: responseJson.token,
      redirect_url: responseJson.redirect_url,
      order_id: midtransOrderId,
      reused: false,
    })
  } catch (error) {
    console.error("create-midtrans-transaction error", error)
    return respond(500, {
      error: error instanceof Error ? error.message : "Terjadi kesalahan server.",
    })
  }
})
