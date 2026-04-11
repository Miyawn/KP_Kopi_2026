const normalizeEmail = (value: string | null | undefined) => value?.trim().toLowerCase() || ""

export const getAllowedAdminEmails = () =>
  (Deno.env.get("ADMIN_ALLOWED_EMAILS") || "")
    .split(",")
    .map(normalizeEmail)
    .filter(Boolean)

export const assertAdminUser = (email: string | null | undefined) => {
  const normalizedEmail = normalizeEmail(email)
  const allowedEmails = getAllowedAdminEmails()

  if (!normalizedEmail) {
    throw new Error("Email admin tidak ditemukan pada session.")
  }

  if (allowedEmails.length === 0) {
    throw new Error("ADMIN_ALLOWED_EMAILS belum di-set pada Edge Function.")
  }

  if (!allowedEmails.includes(normalizedEmail)) {
    throw new Error("Akun ini tidak memiliki akses admin.")
  }
}
