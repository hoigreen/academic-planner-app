import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import Keycloak, {
  type KeycloakInitOptions,
  type KeycloakTokenParsed,
} from 'keycloak-js'

/**
 * Singleton Keycloak adapter for the app.
 *
 * Env vars (set in `.env`):
 *   VITE_KEYCLOAK_URL       — e.g. https://auth.example.com
 *   VITE_KEYCLOAK_REALM     — e.g. academic-planner
 *   VITE_KEYCLOAK_CLIENT_ID — e.g. academic-planner-web
 *
 * IMPORTANT: We intentionally export a *single* Keycloak instance that is
 * initialised at most once. The official adapter throws
 *   "A 'Keycloak' instance can only be initialized once."
 * if `init()` is called more than once on the same instance, which happens
 * easily under React 19 StrictMode's double-mount behaviour if you naively
 * call `keycloak.init()` from an effect.
 */
const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL as string,
  realm: import.meta.env.VITE_KEYCLOAK_REALM as string,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID as string,
})

export const keycloakInitOptions: KeycloakInitOptions = {
  onLoad: 'check-sso',
  silentCheckSsoRedirectUri:
    typeof window !== 'undefined'
      ? `${window.location.origin}/silent-check-sso.html`
      : undefined,
  pkceMethod: 'S256',
  // Disable both the login iframe and the third-party cookie probe.
  // The 3p-cookie check fires a request to
  //   <keycloak-url>/realms/<realm>/protocol/openid-connect/3p-cookies/step1.html
  // which can 404 on some Keycloak versions / reverse proxies. Neither check
  // is needed for a SPA that uses PKCE + silent-check-SSO.
  checkLoginIframe: false,
  enableLogging: import.meta.env.DEV,
}

// Module-level guard so a second call to `init()` (e.g. from StrictMode's
// second effect run) re-uses the original promise instead of throwing.
let initPromise: Promise<boolean> | null = null

function initKeycloakOnce(): Promise<boolean> {
  if (!initPromise) {
    initPromise = keycloak.init(keycloakInitOptions)
  }
  return initPromise
}

interface KeycloakContextValue {
  keycloak: Keycloak
  initialized: boolean
  authenticated: boolean
  tokenParsed: KeycloakTokenParsed | undefined
  token: string | undefined
}

const KeycloakContext = createContext<KeycloakContextValue | undefined>(
  undefined
)

interface KeycloakProviderProps {
  children: ReactNode
  loading?: ReactNode
}

export function KeycloakProvider({ children, loading = null }: KeycloakProviderProps) {
  const [initialized, setInitialized] = useState<boolean>(() => {
    // If init already resolved before this component first mounted, reflect that.
    return !!initPromise && keycloak.didInitialize === true
  })
  const [, forceRender] = useState(0)
  const listenersBoundRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    initKeycloakOnce()
      .then(() => {
        if (!cancelled) setInitialized(true)
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Keycloak init failed:', err)
        if (!cancelled) setInitialized(true)
      })

    if (!listenersBoundRef.current) {
      listenersBoundRef.current = true

      const rerender = () => forceRender((n) => n + 1)

      keycloak.onAuthSuccess = rerender
      keycloak.onAuthError = rerender
      keycloak.onAuthRefreshSuccess = rerender
      keycloak.onAuthRefreshError = rerender
      keycloak.onAuthLogout = rerender
      keycloak.onTokenExpired = () => {
        keycloak.updateToken(30).catch(() => keycloak.login())
      }
    }

    return () => {
      cancelled = true
    }
  }, [])

  const value: KeycloakContextValue = {
    keycloak,
    initialized,
    authenticated: !!keycloak.authenticated,
    tokenParsed: keycloak.tokenParsed,
    token: keycloak.token,
  }

  if (!initialized) return <>{loading}</>
  return <KeycloakContext.Provider value={value}>{children}</KeycloakContext.Provider>
}

export function useKeycloak(): KeycloakContextValue {
  const ctx = useContext(KeycloakContext)
  if (!ctx) {
    throw new Error('useKeycloak must be used inside <KeycloakProvider>')
  }
  return ctx
}

export default keycloak
