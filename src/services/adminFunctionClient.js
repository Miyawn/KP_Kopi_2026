import { supabase, supabaseAnonKey } from "../lib/supabase"

const SESSION_REFRESH_BUFFER_MS = 60 * 1000

export const ADMIN_FUNCTION_ERROR_CODES = {
  INVALID_SESSION: "ADMIN_SESSION_INVALID",
  ACCESS_DENIED: "ADMIN_ACCESS_DENIED",
  REQUEST_FAILED: "ADMIN_FUNCTION_REQUEST_FAILED",
}

const createAdminFunctionError = (message, code = ADMIN_FUNCTION_ERROR_CODES.REQUEST_FAILED) => {
  const error = new Error(message)
  error.code = code
  return error
}

const isSessionMissingOrExpiring = (session) => {
  if (!session?.access_token) {
    return true
  }

  if (!session.expires_at) {
    return false
  }

  return session.expires_at * 1000 <= Date.now() + SESSION_REFRESH_BUFFER_MS
}

const readFunctionErrorMessage = async (error, fallbackMessage) => {
  const response = error?.context

  if (response instanceof Response) {
    try {
      const payload = await response.clone().json()
      if (payload?.error) {
        return payload.error
      }
    } catch {
      // Ignore invalid JSON response bodies and fallback below.
    }

    if (response.status === 401) {
      return {
        message: "Session admin tidak valid. Silakan login ulang.",
        code: ADMIN_FUNCTION_ERROR_CODES.INVALID_SESSION,
      }
    }

    if (response.status === 403) {
      return {
        message: "Akun ini tidak memiliki akses admin.",
        code: ADMIN_FUNCTION_ERROR_CODES.ACCESS_DENIED,
      }
    }
  }

  return {
    message: error?.message || fallbackMessage,
    code: error?.code || ADMIN_FUNCTION_ERROR_CODES.REQUEST_FAILED,
  }
}

const getValidAccessToken = async ({ forceRefresh = false } = {}) => {
  let session = null

  if (!forceRefresh) {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      throw createAdminFunctionError(
        "Gagal membaca session admin. Silakan login ulang.",
        ADMIN_FUNCTION_ERROR_CODES.INVALID_SESSION
      )
    }

    session = data.session
  }

  if (forceRefresh || isSessionMissingOrExpiring(session)) {
    const { data, error } = await supabase.auth.refreshSession()

    if (error || !data.session?.access_token) {
      throw createAdminFunctionError(
        "Session admin tidak valid. Silakan login ulang.",
        ADMIN_FUNCTION_ERROR_CODES.INVALID_SESSION
      )
    }

    session = data.session
  }

  return session.access_token
}

const invokeWithToken = async (name, body, accessToken) => {
  return supabase.functions.invoke(name, {
    body,
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

export const isAdminAuthError = (error) =>
  error?.code === ADMIN_FUNCTION_ERROR_CODES.INVALID_SESSION ||
  error?.code === ADMIN_FUNCTION_ERROR_CODES.ACCESS_DENIED

export const invokeAdminFunction = async (name, body = {}) => {
  const fallbackMessage = "Terjadi kesalahan saat memanggil backend admin."

  try {
    const accessToken = await getValidAccessToken()
    const { data, error } = await invokeWithToken(name, body, accessToken)

    if (error) {
      throw error
    }

    if (data?.error) {
      throw new Error(data.error)
    }

    return data
  } catch (error) {
    if (error?.context instanceof Response && error.context.status === 401) {
      try {
        const refreshedToken = await getValidAccessToken({ forceRefresh: true })
        const { data, error: retryError } = await invokeWithToken(name, body, refreshedToken)

        if (retryError) {
          throw retryError
        }

        if (data?.error) {
          throw new Error(data.error)
        }

        return data
      } catch (retryError) {
        const parsedError = await readFunctionErrorMessage(retryError, fallbackMessage)
        throw createAdminFunctionError(parsedError.message, parsedError.code)
      }
    }

    const parsedError = await readFunctionErrorMessage(error, fallbackMessage)
    throw createAdminFunctionError(parsedError.message, parsedError.code)
  }
}
