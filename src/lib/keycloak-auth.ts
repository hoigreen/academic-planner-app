const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL as string
const KEYCLOAK_REALM = import.meta.env.VITE_KEYCLOAK_REALM as string
const KEYCLOAK_CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID as string

const TOKEN_URL = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`
const LOGOUT_URL = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/logout`

// localStorage keys
const LS_REFRESH_TOKEN = 'kc_rt'
const LS_TOKEN_EXPIRY = 'kc_exp'

export interface KcTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
}

async function postForm(url: string, params: Record<string, string>): Promise<Response> {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
  })
}

/**
 * Authenticate with Keycloak using Resource Owner Password Credentials grant.
 * Requires directAccessGrantsEnabled = true on the client.
 */
export async function loginWithPassword(username: string, password: string): Promise<KcTokenResponse> {
  const res = await postForm(TOKEN_URL, {
    grant_type: 'password',
    client_id: KEYCLOAK_CLIENT_ID,
    username,
    password,
    scope: 'openid profile email roles',
  })
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error_description?: string }
    throw new Error(err.error_description ?? 'Invalid username or password')
  }
  return res.json() as Promise<KcTokenResponse>
}

/**
 * Exchange the stored refresh token for a fresh access token.
 */
export async function refreshAccessToken(): Promise<KcTokenResponse> {
  const refreshToken = getStoredRefreshToken()
  if (!refreshToken) throw new Error('No refresh token stored')

  const res = await postForm(TOKEN_URL, {
    grant_type: 'refresh_token',
    client_id: KEYCLOAK_CLIENT_ID,
    refresh_token: refreshToken,
  })
  if (!res.ok) throw new Error('Session expired. Please sign in again.')
  return res.json() as Promise<KcTokenResponse>
}

/**
 * Revoke the refresh token at the Keycloak logout endpoint (best-effort).
 */
export async function revokeSession(): Promise<void> {
  const refreshToken = getStoredRefreshToken()
  if (!refreshToken) return
  await postForm(LOGOUT_URL, {
    client_id: KEYCLOAK_CLIENT_ID,
    refresh_token: refreshToken,
  }).catch(() => {
    // Best-effort; ignore network errors during logout
  })
}

/** Persist tokens to localStorage after a successful login or refresh. */
export function storeTokens(tokens: KcTokenResponse): void {
  const expiry = Math.floor(Date.now() / 1000) + tokens.expires_in
  localStorage.setItem(LS_REFRESH_TOKEN, tokens.refresh_token)
  localStorage.setItem(LS_TOKEN_EXPIRY, String(expiry))
}

/** Remove all stored token data (call on sign-out). */
export function clearStoredTokens(): void {
  localStorage.removeItem(LS_REFRESH_TOKEN)
  localStorage.removeItem(LS_TOKEN_EXPIRY)
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(LS_REFRESH_TOKEN)
}

/** Returns true when the access token has expired or will expire within 30 s. */
export function isTokenExpired(): boolean {
  const expiry = parseInt(localStorage.getItem(LS_TOKEN_EXPIRY) ?? '0', 10)
  return expiry - Math.floor(Date.now() / 1000) < 30
}

/** Decode the payload of a JWT without verifying its signature. */
export function parseJwt(token: string): Record<string, unknown> {
  try {
    // Pad the base64url segment back to standard base64, then decode bytes
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>
  } catch {
    return {}
  }
}
