import { create } from 'zustand'
import type { KeycloakTokenParsed } from 'keycloak-js'
import { getCookie, setCookie, removeCookie } from '@/lib/cookies'

const ACCESS_TOKEN = 'thisisjustarandomstring'

export type AppRole = 'Admin' | 'CVHT' | 'SV'

interface AuthUser {
  accountNo: string
  email: string
  role: string[]
  exp: number
}

interface AuthState {
  auth: {
    user: AuthUser | null
    setUser: (user: AuthUser | null) => void
    accessToken: string
    setAccessToken: (accessToken: string) => void
    resetAccessToken: () => void
    reset: () => void
  }
}

export const useAuthStore = create<AuthState>()((set) => {
  const cookieState = getCookie(ACCESS_TOKEN)
  const initToken = cookieState ? JSON.parse(cookieState) : ''
  return {
    auth: {
      user: null,
      setUser: (user) =>
        set((state) => ({ ...state, auth: { ...state.auth, user } })),
      accessToken: initToken,
      setAccessToken: (accessToken) =>
        set((state) => {
          setCookie(ACCESS_TOKEN, JSON.stringify(accessToken))
          return { ...state, auth: { ...state.auth, accessToken } }
        }),
      resetAccessToken: () =>
        set((state) => {
          removeCookie(ACCESS_TOKEN)
          return { ...state, auth: { ...state.auth, accessToken: '' } }
        }),
      reset: () =>
        set((state) => {
          removeCookie(ACCESS_TOKEN)
          return {
            ...state,
            auth: { ...state.auth, user: null, accessToken: '' },
          }
        }),
    },
  }
})

/**
 * Minimal shape of the decoded Keycloak access token we care about. Keycloak
 * emits `realm_access.roles` (realm-wide roles) and
 * `resource_access.<clientId>.roles` (client-scoped roles). Either can
 * contribute to the user's effective role set.
 */
export interface KeycloakParsedToken extends KeycloakTokenParsed {
  realm_access?: { roles?: string[] }
  resource_access?: Record<string, { roles?: string[] }>
  preferred_username?: string
  email?: string
}

// Roles used by the application, in priority order for `getPrimaryRole`.
const APP_ROLE_PRIORITY: AppRole[] = ['Admin', 'CVHT', 'SV']

/**
 * Extract all role names declared on a Keycloak access token.
 *
 * Replaces the old `getRoleFromClerkMetadata` helper. Reads from
 * `realm_access.roles` and (optionally) `resource_access[clientId].roles`.
 */
export function getRolesFromKeycloakToken(
  tokenParsed: KeycloakParsedToken | undefined | null,
  clientId?: string
): string[] {
  if (!tokenParsed) return []

  const realmRoles = tokenParsed.realm_access?.roles ?? []

  const clientRoles =
    clientId && tokenParsed.resource_access?.[clientId]?.roles
      ? (tokenParsed.resource_access[clientId].roles ?? [])
      : []

  // Deduplicate while preserving order
  return Array.from(new Set([...realmRoles, ...clientRoles]))
}

/**
 * Pick the most privileged application role from a Keycloak token.
 * Falls back to `'SV'` (student) when none of the mapped roles are present.
 */
export function getPrimaryRoleFromKeycloakToken(
  tokenParsed: KeycloakParsedToken | undefined | null,
  clientId?: string
): AppRole {
  const roles = getRolesFromKeycloakToken(tokenParsed, clientId)
  const match = APP_ROLE_PRIORITY.find((r) => roles.includes(r))
  return match ?? 'SV'
}

/**
 * Convenience: build an `AuthUser` directly from a Keycloak token.
 */
export function buildAuthUserFromKeycloak(
  tokenParsed: KeycloakParsedToken | undefined | null,
  clientId?: string
): AuthUser | null {
  if (!tokenParsed) return null
  return {
    accountNo: tokenParsed.sub ?? tokenParsed.preferred_username ?? '',
    email: tokenParsed.email ?? '',
    role: getRolesFromKeycloakToken(tokenParsed, clientId),
    exp: tokenParsed.exp ?? 0,
  }
}
