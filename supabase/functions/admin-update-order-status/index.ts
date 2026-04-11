import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { assertAdminUser } from "../_shared/admin.ts"
import { fetchAuthenticatedUser, getAdminAccessToken } from "../_shared/auth.ts"
import { corsHeaders } from "../_shared/cors.ts"

type UpdateBody = {
  orderId?: string
  status?: "paid" | "processing" | "done" | "cancelled"
  reason?: string
}

type OrderRow = {
  id: string
  status: string | null
  payment_last_status: string | null
}

const respond = (status: number, payload: Record<string, unknown>) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  })

const validateTransition = (currentStatus: string | null, nextStatus: string) => {
  if (nextStatus === "paid") {
    return currentStatus === "pending"
  }

  if (nextStatus === "processing") {
    return currentStatus === "paid"
  }

  if (nextStatus === "done") {
    return currentStatus === "processing"
  }

  if (nextStatus === "cancelled") {
    return ["pending", "paid"].includes(currentStatus ?? "")
  }

  return false
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

    const body = (await req.json()) as UpdateBody
    const orderId = body.orderId?.trim()
    const nextStatus = body.status?.trim()
    const normalizedReason = body.reason?.trim() || null

    if (!orderId) {
      return respond(400, { error: "orderId wajib dikirim." })
    }

    if (!nextStatus || !["paid", "processing", "done", "cancelled"].includes(nextStatus)) {
      return respond(400, { error: "Status order tidak valid." })
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, status, payment_last_status")
      .eq("id", orderId)
      .single()

    if (orderError || !order) {
      return respond(404, { error: "Order tidak ditemukan." })
    }

    const typedOrder = order as OrderRow

    if (!validateTransition(typedOrder.status, nextStatus)) {
      return respond(400, {
        error: `Transisi status ${typedOrder.status || "unknown"} -> ${nextStatus} tidak diizinkan.`,
      })
    }

    const reviewedAt = new Date().toISOString()
    const updatePayload: Record<string, unknown> = {
      status: nextStatus,
    }

    if (nextStatus === "paid") {
      updatePayload.paid_at = reviewedAt
      updatePayload.payment_last_status =
        typedOrder.payment_last_status === null
          ? "cash_confirmed"
          : typedOrder.payment_last_status
      updatePayload.payment_reviewed_at = reviewedAt
      updatePayload.payment_reviewed_by = user.id
      updatePayload.payment_reviewed_by_email = user.email ?? null
    }

    if (nextStatus === "cancelled") {
      updatePayload.cancel_reason = normalizedReason || "Order dibatalkan oleh admin."
      updatePayload.payment_last_status = "cancelled"
      updatePayload.payment_reviewed_at = reviewedAt
      updatePayload.payment_reviewed_by = user.id
      updatePayload.payment_reviewed_by_email = user.email ?? null
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId)

    if (updateError) {
      return respond(500, { error: updateError.message || "Gagal mengubah status order." })
    }

    return respond(200, {
      success: true,
      reviewedAt,
      reviewerEmail: user.email ?? null,
      status: nextStatus,
    })
  } catch (error) {
    console.error("admin-update-order-status error", error)
    return respond(500, {
      error: error instanceof Error ? error.message : "Terjadi kesalahan server.",
    })
  }
})
