import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { assertAdminUser } from "../_shared/admin.ts"
import { fetchAuthenticatedUser, getAdminAccessToken } from "../_shared/auth.ts"
import { corsHeaders } from "../_shared/cors.ts"

type DeleteBody = {
  id?: string
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

    const body = (await req.json()) as DeleteBody
    const productId = body.id?.trim()

    if (!productId) {
      return respond(400, { error: "ID produk wajib dikirim." })
    }

    const { error } = await supabase.from("products").delete().eq("id", productId)

    if (error) {
      return respond(500, { error: error.message || "Gagal menghapus produk." })
    }

    return respond(200, {
      success: true,
      id: productId,
    })
  } catch (error) {
    console.error("admin-delete-product error", error)
    return respond(500, {
      error: error instanceof Error ? error.message : "Terjadi kesalahan server.",
    })
  }
})
