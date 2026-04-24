import { supabase } from "../lib/supabase"

const SESSION_REFRESH_BUFFER_MS = 60 * 1000

const normalizeEmail = (value) => value?.trim().toLowerCase() || ""

const isSessionMissingOrExpiring = (session) => {
  if (!session?.access_token) {
    return true
  }

  if (!session.expires_at) {
    return false
  }

  return session.expires_at * 1000 <= Date.now() + SESSION_REFRESH_BUFFER_MS
}

export const getAllowedAdminEmails = () =>
  (import.meta.env.VITE_ADMIN_ALLOWED_EMAILS || "")
    .split(",")
    .map(normalizeEmail)
    .filter(Boolean)

export const hasAdminAllowlist = () => getAllowedAdminEmails().length > 0

export const isAllowedAdminEmail = (email) => {
  const allowedEmails = getAllowedAdminEmails()

  if (!email || allowedEmails.length === 0) {
    return false
  }

  return allowedEmails.includes(normalizeEmail(email))
}

export const isAdminSession = (session) => {
  return isAllowedAdminEmail(session?.user?.email)
}

const clearInvalidAdminSession = async () => {
  try {
    await supabase.auth.signOut()
  } catch {
    // Ignore cleanup errors; redirect logic will still handle the invalid session.
  }
}

export const validateAdminSession = async () => {
  const fail = async (message, shouldSignOut = true) => {
    if (shouldSignOut) {
      await clearInvalidAdminSession()
    }

    return {
      session: null,
      error: message,
    }
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

  if (sessionError) {
    return fail("Session admin tidak valid. Silakan login ulang.")
  }

  let session = sessionData.session

  if (!session) {
    return fail("Session admin tidak ditemukan. Silakan login ulang.", false)
  }

  if (isSessionMissingOrExpiring(session)) {
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()

    if (refreshError || !refreshData.session?.access_token) {
      return fail("Session admin tidak valid. Silakan login ulang.")
    }

    session = refreshData.session
  }

  if (!session?.access_token) {
    return fail("Session admin tidak ditemukan. Silakan login ulang.", false)
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(session.access_token)

  if (userError || !user) {
    return fail("Session admin tidak valid. Silakan login ulang.")
  }

  if (!isAllowedAdminEmail(user.email)) {
    return fail("Akun ini tidak memiliki akses admin.")
  }

  return {
    session: {
      ...session,
      user,
    },
    error: "",
  }
}

export const getAdminAuthMessage = () => {
  if (hasAdminAllowlist()) {
    return "Akses dashboard admin dibatasi hanya untuk email yang terdaftar."
  }

  return "Tambahkan VITE_ADMIN_ALLOWED_EMAILS di .env agar hanya email admin yang bisa login."
}
