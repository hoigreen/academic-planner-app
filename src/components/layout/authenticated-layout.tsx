import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useLocation } from '@tanstack/react-router'
import { getCookie } from '@/lib/cookies'
import { cn } from '@/lib/utils'
import { setTokenGetter } from '@/lib/api-client'
import {
  refreshAccessToken,
  storeTokens,
  clearStoredTokens,
  isTokenExpired,
  getStoredRefreshToken,
  parseJwt,
} from '@/lib/keycloak-auth'
import {
  buildAuthUserFromKeycloak,
  useAuthStore,
  type KeycloakParsedToken,
} from '@/stores/auth-store'
import { LayoutProvider } from '@/context/layout-provider'
import { SearchProvider } from '@/context/search-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SkipToMain } from '@/components/skip-to-main'

export function AuthenticatedLayout() {
  const defaultOpen = getCookie('sidebar_state') !== 'false'
  const { auth } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [status, setStatus] = useState<'checking' | 'authenticated'>('checking')

  useEffect(() => {
    const check = async () => {
      const accessToken = useAuthStore.getState().auth.accessToken

      // If we already have a valid access token in the store, proceed
      if (accessToken && !isTokenExpired()) {
        setStatus('authenticated')
        return
      }

      // Try to silently refresh using the stored refresh token
      if (getStoredRefreshToken()) {
        try {
          const tokens = await refreshAccessToken()
          storeTokens(tokens)
          const parsed = parseJwt(tokens.access_token) as KeycloakParsedToken
          auth.setUser(buildAuthUserFromKeycloak(parsed, import.meta.env.VITE_KEYCLOAK_CLIENT_ID as string))
          auth.setAccessToken(tokens.access_token)
          setStatus('authenticated')
          return
        } catch {
          clearStoredTokens()
          auth.reset()
        }
      }

      // No valid session — send to sign-in, preserving the intended destination
      navigate({
        to: '/sign-in',
        search: { redirect: location.href },
        replace: true,
      })
    }

    void check()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep the API client's token getter up to date with auto-refresh logic
  useEffect(() => {
    setTokenGetter(async () => {
      if (isTokenExpired()) {
        try {
          const tokens = await refreshAccessToken()
          storeTokens(tokens)
          const parsed = parseJwt(tokens.access_token) as KeycloakParsedToken
          auth.setUser(buildAuthUserFromKeycloak(parsed, import.meta.env.VITE_KEYCLOAK_CLIENT_ID as string))
          auth.setAccessToken(tokens.access_token)
          return tokens.access_token
        } catch {
          clearStoredTokens()
          auth.reset()
          void navigate({ to: '/sign-in', replace: true })
          return null
        }
      }
      return useAuthStore.getState().auth.accessToken || null
    })
  }, [auth, navigate])

  if (status === 'checking') return null

  return (
    <SearchProvider>
      <LayoutProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          <SkipToMain />
          <AppSidebar />
          <SidebarInset
            className={cn(
              '@container/content',
              'has-data-[layout=fixed]:h-svh',
              'peer-data-[variant=inset]:has-data-[layout=fixed]:h-[calc(100svh-(var(--spacing)*4))]'
            )}
          >
            <Outlet />
          </SidebarInset>
        </SidebarProvider>
      </LayoutProvider>
    </SearchProvider>
  )
}
