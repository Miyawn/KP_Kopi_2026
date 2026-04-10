const CHECKOUT_DRAFT_KEY = "checkoutDraft"
const ORDER_METADATA_KEY = "orderMetadataById"

const canUseStorage = () => typeof window !== "undefined" && Boolean(window.localStorage)

const readJson = (key, fallback) => {
  if (!canUseStorage()) return fallback

  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

const writeJson = (key, value) => {
  if (!canUseStorage()) return
  window.localStorage.setItem(key, JSON.stringify(value))
}

export const getCheckoutDraft = () =>
  readJson(CHECKOUT_DRAFT_KEY, {
    customerName: "",
    customerPhone: "",
    orderType: "dine-in",
    paymentMethod: "qris",
    tableNumber: "",
    deliveryAddress: "",
    notes: "",
  })

export const saveCheckoutDraft = (draft) => {
  writeJson(CHECKOUT_DRAFT_KEY, draft)
}

export const clearCheckoutDraft = () => {
  if (!canUseStorage()) return
  window.localStorage.removeItem(CHECKOUT_DRAFT_KEY)
}

export const getOrderMetadataMap = () => readJson(ORDER_METADATA_KEY, {})

export const getOrderMetadata = (orderId) => {
  if (!orderId) return null
  const metadataMap = getOrderMetadataMap()
  return metadataMap[orderId] ?? null
}

export const saveOrderMetadata = (orderId, metadata) => {
  if (!orderId || !metadata) return

  const metadataMap = getOrderMetadataMap()
  metadataMap[orderId] = {
    ...(metadataMap[orderId] ?? {}),
    ...metadata,
  }

  writeJson(ORDER_METADATA_KEY, metadataMap)
}
