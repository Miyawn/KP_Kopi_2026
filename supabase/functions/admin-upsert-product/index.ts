import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { assertAdminUser } from "../_shared/admin.ts"
import { fetchAuthenticatedUser, getAdminAccessToken } from "../_shared/auth.ts"
import { corsHeaders } from "../_shared/cors.ts"

type UpsertBody = {
  id?: string | null
  name?: string
  description?: string
  price?: number
  stock?: number
  category?: string
  is_available?: boolean
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

    const body = (await req.json()) as UpsertBody

    if (!body.name?.trim()) {
      return respond(400, { error: "Nama produk wajib diisi." })
    }

    const price = Number(body.price ?? 0)
    const stock = Number(body.stock ?? 0)

    if (!Number.isFinite(price) || price < 0) {
      return respond(400, { error: "Harga produk tidak valid." })
    }

    if (!Number.isFinite(stock) || stock < 0) {
      return respond(400, { error: "Stok produk tidak valid." })
    }

    const payload = {
      name: body.name.trim(),
      description: body.description?.trim() || "",
      price,
      stock,
      category: body.category?.trim() || "",
      is_available: body.is_available ?? true,
    }

    const query = body.id
      ? supabase.from("products").update(payload).eq("id", body.id).select("*").single()
      : supabase.from("products").insert(payload).select("*").single()

    const { data, error } = await query

    if (error || !data) {
      return respond(500, { error: error?.message || "Gagal menyimpan produk." })
    }

    return respond(200, {
      success: true,
      product: data,
    })
  } catch (error) {
    console.error("admin-upsert-product error", error)
    return respond(500, {
      error: error instanceof Error ? error.message : "Terjadi kesalahan server.",
    })
  }
})
