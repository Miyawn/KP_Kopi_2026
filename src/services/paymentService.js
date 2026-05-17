import { supabase } from "../lib/supabase"
import defaultQrisImageUrl from "../assets/QRIS_UCANDOIT.jpeg"

const resolveQrisImageUrl = () => {
  const configuredUrl = import.meta.env.VITE_MANUAL_QRIS_IMAGE_URL?.trim()

  if (!configuredUrl) {
    return defaultQrisImageUrl
  }

  if (configuredUrl.startsWith("src/assets/") || configuredUrl.startsWith("/src/assets/")) {
    return defaultQrisImageUrl
  }

  return configuredUrl
}

export const getManualPaymentConfig = () => ({
  qrisMerchantName: import.meta.env.VITE_MANUAL_QRIS_MERCHANT_NAME || "U CAN DO IT COFFEESHOP",
  qrisMerchantCity: import.meta.env.VITE_MANUAL_QRIS_MERCHANT_CITY || "",
  qrisImageUrl: resolveQrisImageUrl(),
  bankName: import.meta.env.VITE_MANUAL_BANK_NAME || "BCA",
  bankAccountNumber: import.meta.env.VITE_MANUAL_BANK_ACCOUNT_NUMBER || "6965108339",
  bankAccountName: import.meta.env.VITE_MANUAL_BANK_ACCOUNT_NAME || "Syahrubi Alam Bahari",
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

export const submitManualPaymentConfirmation = async ({
  orderId,
  paymentMethod,
  reference,
  proofFile,
  reuseExistingProof = false,
}) => {
  if (!orderId) {
    throw new Error("Order tidak ditemukan untuk konfirmasi pembayaran.")
  }

  const normalizedReference = reference?.trim()
  if (!normalizedReference) {
    throw new Error("Referensi pembayaran wajib diisi.")
  }

  const formData = new FormData()
  formData.append("orderId", orderId)
  formData.append("paymentMethod", paymentMethod || "manual")
  formData.append("reference", normalizedReference)
  formData.append("reuseExistingProof", reuseExistingProof ? "true" : "false")

  if (proofFile) {
    formData.append("proofFile", proofFile)
  }

  const { data, error } = await supabase.functions.invoke("submit-manual-payment", {
    body: formData,
  })

  if (error) {
    throw new Error(error.message || "Gagal mengirim konfirmasi pembayaran manual.")
  }

  if (!data?.success) {
    throw new Error(data?.error || "Konfirmasi pembayaran manual gagal diproses.")
  }

  return data
}
