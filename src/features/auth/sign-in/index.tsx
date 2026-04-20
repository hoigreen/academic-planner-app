import { useEffect } from 'react'
import { useKeycloak } from '@/lib/keycloak'
import { AuthLayout } from '../auth-layout'

/**
 * Redirects to the Keycloak hosted login page. Clerk's embedded <SignIn />
 * component has been removed in favour of using Keycloak as the single IdP.
 */
export function SignIn() {
  const { keycloak, initialized } = useKeycloak()

  useEffect(() => {
    if (!initialized) return
    if (!keycloak.authenticated) {
      keycloak.login({
        redirectUri: `${window.location.origin}/`,
      })
    }
  }, [initialized, keycloak])

  return (
    <AuthLayout>
      <div className='flex justify-center text-sm text-muted-foreground'>
        Redirecting to Keycloak sign-in…
      </div>
    </AuthLayout>
  )
}
