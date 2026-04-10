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
