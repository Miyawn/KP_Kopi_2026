import { supabase } from "../lib/supabase"

const dummyPaymentEnabled = import.meta.env.VITE_ENABLE_DUMMY_PAYMENT !== "false"

export const isDummyPaymentEnabled = () => dummyPaymentEnabled

export const getManualPaymentConfig = () => ({
  qrisMerchantName: import.meta.env.VITE_MANUAL_QRIS_MERCHANT_NAME || "KP Kopi",
  qrisMerchantCity: import.meta.env.VITE_MANUAL_QRIS_MERCHANT_CITY || "Indonesia",
  qrisImageUrl: import.meta.env.VITE_MANUAL_QRIS_IMAGE_URL || "",
  bankName: import.meta.env.VITE_MANUAL_BANK_NAME || "BCA",
  bankAccountNumber: import.meta.env.VITE_MANUAL_BANK_ACCOUNT_NUMBER || "1234567890",
  bankAccountName: import.meta.env.VITE_MANUAL_BANK_ACCOUNT_NAME || "KP Kopi",
})

export const MAX_MANUAL_PROOF_FILE_SIZE = 1024 * 1024

export const readManualProofFile = (file) =>
  new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("File bukti pembayaran belum dipilih."))
      return
    }

    if (!file.type.startsWith("image/")) {
      reject(new Error("File bukti pembayaran harus berupa gambar."))
      return
    }

    if (file.size > MAX_MANUAL_PROOF_FILE_SIZE) {
      reject(new Error("Ukuran gambar maksimal 1 MB."))
      return
    }

    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error("Gagal membaca file bukti pembayaran."))
    reader.readAsDataURL(file)
  })

export const submitManualPaymentConfirmation = async (
  orderId,
  paymentMethod,
  reference,
  proofPayload
) => {
  if (!orderId) {
    throw new Error("Order tidak ditemukan untuk konfirmasi pembayaran.")
  }

  const normalizedReference = reference?.trim()
  const fallbackReference = `MANUAL-${String(orderId).slice(0, 8).toUpperCase()}`
  const submittedAt = new Date().toISOString()

  const { error } = await supabase
    .from("orders")
    .update({
      payment_provider: "manual",
      payment_type: paymentMethod || "manual",
      payment_last_status: "awaiting_confirmation",
      payment_reference: normalizedReference || fallbackReference,
      payment_payload: {
        manual_payment: {
          submitted_at: submittedAt,
          payment_method: paymentMethod || "manual",
          reference: normalizedReference || fallbackReference,
          proof_name: proofPayload?.name || null,
          proof_content_type: proofPayload?.contentType || null,
          proof_data_url: proofPayload?.dataUrl || null,
        },
      },
    })
    .eq("id", orderId)

  if (error) {
    throw new Error(error.message || "Gagal mengirim konfirmasi pembayaran manual.")
  }

  return { success: true }
}

export const confirmDummyPayment = async (orderId) => {
  if (!dummyPaymentEnabled) {
    throw new Error("Mode dummy payment sedang nonaktif.")
  }

  const { error } = await supabase
    .from("orders")
    .update({ status: "paid" })
    .eq("id", orderId)

  if (error) {
    throw new Error(error.message || "Gagal menyimpan pembayaran demo.")
  }

  return { success: true }
}
