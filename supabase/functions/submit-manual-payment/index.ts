import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

type OrderRow = {
  id: string
  status: string | null
  payment_last_status: string | null
  payment_payload: Record<string, unknown> | null
  manual_payment_proof_bucket: string | null
  manual_payment_proof_path: string | null
}

const MAX_PROOF_FILE_SIZE = 1024 * 1024
const PROOF_BUCKET = "manual-payment-proofs"
const ALLOWED_PAYMENT_METHODS = new Set(["qris", "bank_transfer", "manual"])

const respond = (status: number, payload: Record<string, unknown>) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  })

const sanitizeFilename = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "proof-image"

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

    const formData = await req.formData()
    const orderId = String(formData.get("orderId") || "").trim()
    const paymentMethod = String(formData.get("paymentMethod") || "").trim() || "manual"
    const reference = String(formData.get("reference") || "").trim()
    const reuseExistingProof = String(formData.get("reuseExistingProof") || "") === "true"
    const file = formData.get("proofFile")

    if (!orderId) {
      return respond(400, { error: "Order tidak ditemukan untuk konfirmasi pembayaran." })
    }

    if (!reference) {
      return respond(400, { error: "Referensi pembayaran wajib diisi." })
    }

    if (!ALLOWED_PAYMENT_METHODS.has(paymentMethod)) {
      return respond(400, { error: "Metode pembayaran manual tidak valid." })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, status, payment_last_status, payment_payload, manual_payment_proof_bucket, manual_payment_proof_path")
      .eq("id", orderId)
      .single()

    if (orderError || !order) {
      return respond(404, { error: "Order tidak ditemukan." })
    }

    const typedOrder = order as OrderRow

    if (["paid", "processing", "done"].includes(typedOrder.status ?? "")) {
      return respond(400, { error: "Order ini sudah dibayar." })
    }

    if (typedOrder.status === "cancelled") {
      return respond(400, { error: "Order ini sudah dibatalkan." })
    }

    let proofBucket = typedOrder.manual_payment_proof_bucket || PROOF_BUCKET
    let proofPath = typedOrder.manual_payment_proof_path || null
    let proofName =
      String(
        (typedOrder.payment_payload as { manual_payment?: { proof_name?: string } } | null)?.manual_payment?.proof_name ||
          ""
      ) || null
    let proofContentType =
      String(
        (typedOrder.payment_payload as { manual_payment?: { proof_content_type?: string } } | null)?.manual_payment?.proof_content_type ||
          ""
      ) || null

    if (file instanceof File) {
      if (!file.type.startsWith("image/")) {
        return respond(400, { error: "File bukti pembayaran harus berupa gambar." })
      }

      if (file.size > MAX_PROOF_FILE_SIZE) {
        return respond(400, { error: "Ukuran gambar maksimal 1 MB." })
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
      const safeName = sanitizeFilename(file.name)
      proofBucket = PROOF_BUCKET
      proofPath = `${orderId}/${timestamp}-${safeName}`
      proofName = file.name
      proofContentType = file.type

      const { error: uploadError } = await supabase.storage
        .from(PROOF_BUCKET)
        .upload(proofPath, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: true,
        })

      if (uploadError) {
        return respond(500, { error: uploadError.message || "Gagal upload bukti pembayaran." })
      }
    } else if (!reuseExistingProof || !proofPath) {
      return respond(400, { error: "Unggah bukti pembayaran berupa gambar." })
    }

    const proofUrl = proofPath
      ? supabase.storage.from(proofBucket).getPublicUrl(proofPath).data.publicUrl
      : null

    const submittedAt = new Date().toISOString()
    const manualPaymentPayload = {
      submitted_at: submittedAt,
      payment_method: paymentMethod,
      reference,
      proof_name: proofName,
      proof_content_type: proofContentType,
      proof_bucket: proofBucket,
      proof_path: proofPath,
      proof_url: proofUrl,
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        payment_provider: "manual",
        payment_type: paymentMethod,
        payment_last_status: "awaiting_confirmation",
        payment_reference: reference,
        payment_payload: {
          manual_payment: manualPaymentPayload,
        },
        manual_payment_proof_bucket: proofBucket,
        manual_payment_proof_path: proofPath,
        payment_reviewed_at: null,
        payment_reviewed_by: null,
        payment_reviewed_by_email: null,
        payment_rejection_reason: null,
      })
      .eq("id", orderId)

    if (updateError) {
      return respond(500, { error: updateError.message || "Gagal mengirim konfirmasi pembayaran manual." })
    }

    return respond(200, {
      success: true,
      submittedAt,
      reference,
      proofName,
      proofUrl,
      proofBucket,
      proofPath,
    })
  } catch (error) {
    console.error("submit-manual-payment error", error)
    return respond(500, {
      error: error instanceof Error ? error.message : "Terjadi kesalahan server.",
    })
  }
})
