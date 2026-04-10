import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

type CreateOrderBody = {
  customerName?: string
  customerPhone?: string
  orderType?: string
  tableNumber?: string
  items?: Array<{
    id?: string
    quantity?: number
  }>
}

const respond = (status: number, payload: Record<string, unknown>) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  })

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

    const body = (await req.json()) as CreateOrderBody
    const items =
      body.items?.map((item) => ({
        id: item?.id,
        quantity: Number(item?.quantity ?? 0),
      })) || []

    if (!body.customerName?.trim()) {
      return respond(400, { error: "Nama pemesan wajib diisi." })
    }

    if (!body.customerPhone?.trim()) {
      return respond(400, { error: "Nomor customer wajib diisi." })
    }

    if (!body.orderType?.trim()) {
      return respond(400, { error: "Tipe order wajib diisi." })
    }

    if (items.length === 0) {
      return respond(400, { error: "Cart kosong." })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data, error } = await supabase.rpc("create_order_with_items_secure", {
      p_table: body.tableNumber?.trim() || null,
      p_customer_name: body.customerName.trim(),
      p_customer_phone: body.customerPhone.trim(),
      p_order_type: body.orderType.trim(),
      p_items: items,
    })

    if (error) {
      return respond(400, { error: error.message || "Gagal membuat order." })
    }

    return respond(200, {
      success: true,
      orderId: data,
    })
  } catch (error) {
    console.error("create-order error", error)
    return respond(500, {
      error: error instanceof Error ? error.message : "Terjadi kesalahan server.",
    })
  }
})
