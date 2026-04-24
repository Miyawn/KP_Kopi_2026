import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

type OrderAccessInput = {
  orderId?: string
  accessToken?: string
}

type RequestBody = {
  orders?: OrderAccessInput[]
  orderId?: string
  accessToken?: string
}

type OrderRow = {
  id: string
  customer_access_token: string
}

const respond = (status: number, payload: Record<string, unknown>) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  })

const normalizeEntries = (body: RequestBody) => {
  const entries = Array.isArray(body.orders)
    ? body.orders
    : body.orderId && body.accessToken
      ? [{ orderId: body.orderId, accessToken: body.accessToken }]
      : []

  return entries
    .map((entry) => ({
      orderId: entry.orderId?.trim() || "",
      accessToken: entry.accessToken?.trim() || "",
    }))
    .filter((entry) => entry.orderId && entry.accessToken)
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

    if (!supabaseUrl || !serviceRoleKey) {
      return respond(500, { error: "Supabase service credentials belum tersedia." })
    }

    const body = (await req.json()) as RequestBody
    const requestedEntries = normalizeEntries(body).slice(0, 20)

    if (requestedEntries.length === 0) {
      return respond(400, { error: "Order access token wajib dikirim." })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const orderIds = [...new Set(requestedEntries.map((entry) => entry.orderId))]
    const requestedTokenMap = new Map(requestedEntries.map((entry) => [entry.orderId, entry.accessToken]))

    const { data, error } = await supabase
      .from("orders")
      .select(`
        id,
        customer_access_token,
        customer_name,
        customer_phone,
        table_number,
        order_type,
        total_amount,
        status,
        payment_reference,
        payment_last_status,
        payment_type,
        payment_payload,
        payment_rejection_reason,
        cancel_reason,
        paid_at,
        created_at,
        order_items (
          id,
          product_id,
          quantity,
          price,
          products (
            id,
            name,
            category
          )
        )
      `)
      .in("id", orderIds)

    if (error) {
      return respond(500, { error: error.message || "Gagal mengambil data order customer." })
    }

    const allowedOrders = (data || [])
      .filter((order) => requestedTokenMap.get(order.id) === (order as OrderRow).customer_access_token)
      .map(({ customer_access_token: _token, ...order }) => order)

    const orderedResults = requestedEntries
      .map((entry) => allowedOrders.find((order) => order.id === entry.orderId))
      .filter(Boolean)

    return respond(200, {
      success: true,
      orders: orderedResults,
    })
  } catch (error) {
    console.error("get-customer-orders error", error)
    return respond(500, {
      error: error instanceof Error ? error.message : "Terjadi kesalahan server.",
    })
  }
})
