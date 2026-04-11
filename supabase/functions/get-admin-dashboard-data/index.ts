import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { assertAdminUser } from "../_shared/admin.ts"
import { fetchAuthenticatedUser, getAdminAccessToken } from "../_shared/auth.ts"
import { corsHeaders } from "../_shared/cors.ts"

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
    const anonKey = req.headers.get("apikey") || Deno.env.get("SUPABASE_ANON_KEY")
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return respond(500, { error: "Supabase service credentials belum tersedia." })
    }

    const accessToken = getAdminAccessToken(req)
    if (!accessToken) {
      return respond(401, { error: "Session admin tidak ditemukan." })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { user, error: userError } = await fetchAuthenticatedUser({
      supabaseUrl,
      anonKey,
      accessToken,
    })

    if (userError || !user) {
      return respond(401, { error: "Session admin tidak valid." })
    }

    try {
      assertAdminUser(user.email)
    } catch (error) {
      return respond(403, {
        error: error instanceof Error ? error.message : "Akses admin ditolak.",
      })
    }

    const [ordersResult, productsResult] = await Promise.all([
      supabase
        .from("orders")
        .select(`
          id,
          customer_name,
          customer_phone,
          table_number,
          order_type,
          total_amount,
          status,
          payment_provider,
          payment_reference,
          payment_last_status,
          payment_type,
          payment_payload,
          payment_rejection_reason,
          cancel_reason,
          payment_reviewed_at,
          payment_reviewed_by_email,
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
        .order("created_at", { ascending: false }),
      supabase.from("products").select("*").order("created_at", { ascending: false }),
    ])

    if (ordersResult.error) {
      return respond(500, { error: ordersResult.error.message || "Gagal mengambil data order admin." })
    }

    if (productsResult.error) {
      return respond(500, { error: productsResult.error.message || "Gagal mengambil data produk admin." })
    }

    return respond(200, {
      success: true,
      orders: ordersResult.data || [],
      products: productsResult.data || [],
    })
  } catch (error) {
    console.error("get-admin-dashboard-data error", error)
    return respond(500, {
      error: error instanceof Error ? error.message : "Terjadi kesalahan server.",
    })
  }
})
