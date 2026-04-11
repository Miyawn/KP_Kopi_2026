export const ADMIN_ACCESS_TOKEN_HEADER = "x-admin-access-token"

export const getAdminAccessToken = (req: Request) => {
  const customHeaderToken = req.headers.get(ADMIN_ACCESS_TOKEN_HEADER)?.trim()

  if (customHeaderToken) {
    return customHeaderToken
  }

  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization") || ""

  if (!authHeader.startsWith("Bearer ")) {
    return null
  }

  return authHeader.slice(7).trim() || null
}

type AuthenticatedUser = {
  id: string
  email?: string | null
}

export const fetchAuthenticatedUser = async ({
  supabaseUrl,
  anonKey,
  accessToken,
}: {
  supabaseUrl: string
  anonKey: string
  accessToken: string
}) => {
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    return {
      user: null,
      error: `Auth lookup failed with status ${response.status}`,
    }
  }

  const user = (await response.json()) as AuthenticatedUser

  return {
    user,
    error: null,
  }
}
