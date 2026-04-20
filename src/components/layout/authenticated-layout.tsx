import { useEffect } from 'react'
import { Outlet } from '@tanstack/react-router'
import { useKeycloak } from '@/lib/keycloak'
import { getCookie } from '@/lib/cookies'
import { cn } from '@/lib/utils'
import { setTokenGetter } from '@/lib/api-client'
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

type AuthenticatedLayoutProps = {
  children?: React.ReactNode
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const defaultOpen = getCookie('sidebar_state') !== 'false'
  const { keycloak, initialized } = useKeycloak()
  const setUser = useAuthStore((s) => s.auth.setUser)
  const setAccessToken = useAuthStore((s) => s.auth.setAccessToken)

  // Wire Keycloak's token getter into the API client interceptor.
  // `updateToken(30)` transparently refreshes tokens about to expire.
  useEffect(() => {
    setTokenGetter(async () => {
      try {
        if (!keycloak.authenticated) return null
        await keycloak.updateToken(30)
        return keycloak.token ?? null
      } catch {
        return null
      }
    })
  }, [keycloak])

  // Sync Keycloak identity into the local auth store whenever the token changes.
  useEffect(() => {
    if (!initialized) return
    if (keycloak.authenticated && keycloak.token) {
      const parsed = keycloak.tokenParsed as KeycloakParsedToken | undefined
      setUser(
        buildAuthUserFromKeycloak(parsed, import.meta.env.VITE_KEYCLOAK_CLIENT_ID)
      )
      setAccessToken(keycloak.token)
    }
  }, [initialized, keycloak.authenticated, keycloak.token, keycloak.tokenParsed, setAccessToken, setUser])

  // Redirect unauthenticated users straight to the Keycloak login screen.
  useEffect(() => {
    if (!initialized) return
    if (!keycloak.authenticated) {
      keycloak.login({
        redirectUri: window.location.href,
      })
    }
  }, [initialized, keycloak])

  if (!initialized || !keycloak.authenticated) return null

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
            {children ?? <Outlet />}
          </SidebarInset>
        </SidebarProvider>
      </LayoutProvider>
    </SearchProvider>
  )
}
