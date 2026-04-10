import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

type ReviewBody = {
  orderId?: string
  decision?: "accept" | "reject" | "cancel"
  reason?: string
}

type OrderRow = {
  id: string
  status: string | null
  payment_payload: Record<string, unknown> | null
}

const respond = (status: number, payload: Record<string, unknown>) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  })

const getAccessToken = (req: Request) => {
  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization") || ""
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null
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

    const accessToken = getAccessToken(req)
    if (!accessToken) {
      return respond(401, { error: "Session admin tidak ditemukan." })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken)

    if (userError || !user) {
      return respond(401, { error: "Session admin tidak valid." })
    }

    const body = (await req.json()) as ReviewBody
    const orderId = body.orderId?.trim()
    const decision = body.decision
    const normalizedReason = body.reason?.trim() || null

    if (!orderId) {
      return respond(400, { error: "orderId wajib dikirim." })
    }

    if (!decision || !["accept", "reject", "cancel"].includes(decision)) {
      return respond(400, { error: "Keputusan review tidak valid." })
    }

    if (decision !== "accept" && !normalizedReason) {
      return respond(400, { error: "Alasan wajib diisi untuk aksi ini." })
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, status, payment_payload")
      .eq("id", orderId)
      .single()

    if (orderError || !order) {
      return respond(404, { error: "Order tidak ditemukan." })
    }

    const typedOrder = order as OrderRow
    const manualPayment =
      (typedOrder.payment_payload as { manual_payment?: Record<string, unknown> } | null)?.manual_payment || {}
    const reviewedAt = new Date().toISOString()

    const updatePayload: Record<string, unknown> =
      decision === "accept"
        ? {
            status: "paid",
            paid_at: reviewedAt,
            payment_last_status: "verified",
            payment_reviewed_at: reviewedAt,
            payment_reviewed_by: user.id,
            payment_reviewed_by_email: user.email ?? null,
            payment_rejection_reason: null,
            cancel_reason: null,
            payment_payload: {
              manual_payment: {
                ...manualPayment,
                review: {
                  decision: "accept",
                  reason: null,
                  reviewed_at: reviewedAt,
                  reviewed_by: user.email ?? null,
                },
              },
            },
          }
        : decision === "reject"
          ? {
              status: "pending",
              paid_at: null,
              payment_last_status: "rejected",
              payment_reviewed_at: reviewedAt,
              payment_reviewed_by: user.id,
              payment_reviewed_by_email: user.email ?? null,
              payment_rejection_reason: normalizedReason,
              cancel_reason: null,
              payment_payload: {
                manual_payment: {
                  ...manualPayment,
                  review: {
                    decision: "reject",
                    reason: normalizedReason,
                    reviewed_at: reviewedAt,
                    reviewed_by: user.email ?? null,
                  },
                },
              },
            }
          : {
              status: "cancelled",
              paid_at: null,
              payment_last_status: "cancelled",
              payment_reviewed_at: reviewedAt,
              payment_reviewed_by: user.id,
              payment_reviewed_by_email: user.email ?? null,
              payment_rejection_reason: null,
              cancel_reason: normalizedReason,
              payment_payload: {
                manual_payment: {
                  ...manualPayment,
                  review: {
                    decision: "cancel",
                    reason: normalizedReason,
                    reviewed_at: reviewedAt,
                    reviewed_by: user.email ?? null,
                  },
                },
              },
            }

    const { error: updateError } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId)

    if (updateError) {
      return respond(500, { error: updateError.message || "Gagal memproses review pembayaran." })
    }

    return respond(200, {
      success: true,
      reviewedAt,
      reviewerEmail: user.email ?? null,
    })
  } catch (error) {
    console.error("review-manual-payment error", error)
    return respond(500, {
      error: error instanceof Error ? error.message : "Terjadi kesalahan server.",
    })
  }
})
