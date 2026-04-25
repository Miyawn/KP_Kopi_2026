import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { assertAdminUser } from "../_shared/admin.ts"
import { fetchAuthenticatedUser, getAdminAccessToken } from "../_shared/auth.ts"
import { corsHeaders } from "../_shared/cors.ts"
import {
  extractManagedProductImagePath,
  PRODUCT_IMAGE_BUCKET,
} from "../_shared/product-image.ts"

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

    const { data: existingProduct, error: existingProductError } = await supabase
      .from("products")
      .select("id, image_url")
      .eq("id", productId)
      .maybeSingle()

    if (existingProductError) {
      return respond(500, { error: existingProductError.message || "Gagal memeriksa produk." })
    }

    if (!existingProduct) {
      return respond(404, { error: "Produk tidak ditemukan." })
    }

    const { error } = await supabase.from("products").delete().eq("id", productId)

    if (error) {
      return respond(500, { error: error.message || "Gagal menghapus produk." })
    }

    const previousImagePath = extractManagedProductImagePath(existingProduct.image_url)

    if (previousImagePath) {
      const { error: storageError } = await supabase
        .storage
        .from(PRODUCT_IMAGE_BUCKET)
        .remove([previousImagePath])

      if (storageError) {
        console.error("admin-delete-product cleanup error", storageError)
      }
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
