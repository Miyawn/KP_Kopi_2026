const normalizeEmail = (value) => value?.trim().toLowerCase() || ""

export const getAllowedAdminEmails = () =>
  (import.meta.env.VITE_ADMIN_ALLOWED_EMAILS || "")
    .split(",")
    .map(normalizeEmail)
    .filter(Boolean)

export const hasAdminAllowlist = () => getAllowedAdminEmails().length > 0

export const isAdminSession = (session) => {
  if (!session?.user?.email) return false

  const allowedEmails = getAllowedAdminEmails()
  if (allowedEmails.length === 0) return true

  return allowedEmails.includes(normalizeEmail(session.user.email))
}

export const getAdminAuthMessage = () => {
  if (hasAdminAllowlist()) {
    return "Akses dashboard admin dibatasi hanya untuk email yang terdaftar."
  }

  return "Tambahkan VITE_ADMIN_ALLOWED_EMAILS di .env agar akses admin lebih aman."
}
