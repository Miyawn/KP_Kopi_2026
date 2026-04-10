const ORDER_HISTORY_KEY = "orderHistoryIds"
const MAX_HISTORY_ITEMS = 20

const canUseStorage = () => typeof window !== "undefined" && Boolean(window.localStorage)

export const getOrderHistoryIds = () => {
  if (!canUseStorage()) return []

  try {
    const raw = window.localStorage.getItem(ORDER_HISTORY_KEY)
    const parsed = raw ? JSON.parse(raw) : []

    if (!Array.isArray(parsed)) return []

    return parsed.filter(Boolean)
  } catch {
    return []
  }
}

export const saveOrderToHistory = (orderId) => {
  if (!orderId || !canUseStorage()) return []

  const nextIds = [orderId, ...getOrderHistoryIds().filter((id) => id !== orderId)].slice(
    0,
    MAX_HISTORY_ITEMS
  )

  window.localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(nextIds))
  window.localStorage.setItem("lastOrderId", orderId)

  return nextIds
}

export const removeOrderFromHistory = (orderId) => {
  if (!orderId || !canUseStorage()) return []

  const nextIds = getOrderHistoryIds().filter((id) => id !== orderId)
  window.localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(nextIds))

  const lastOrderId = window.localStorage.getItem("lastOrderId")
  if (lastOrderId === orderId) {
    if (nextIds[0]) {
      window.localStorage.setItem("lastOrderId", nextIds[0])
    } else {
      window.localStorage.removeItem("lastOrderId")
    }
  }

  return nextIds
}
