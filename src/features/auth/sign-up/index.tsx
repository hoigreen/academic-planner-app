import { useEffect } from 'react'
import { useKeycloak } from '@/lib/keycloak'
import { AuthLayout } from '../auth-layout'

/**
 * Redirects to the Keycloak hosted registration page. Clerk's embedded
 * <SignUp /> component has been removed in favour of using Keycloak as the
 * single IdP.
 */
export function SignUp() {
  const { keycloak, initialized } = useKeycloak()

  useEffect(() => {
    if (!initialized) return
    if (!keycloak.authenticated) {
      keycloak.register({
        redirectUri: `${window.location.origin}/`,
      })
    }
  }, [initialized, keycloak])

  return (
    <AuthLayout>
      <div className='flex justify-center text-sm text-muted-foreground'>
        Redirecting to Keycloak registration…
      </div>
    </AuthLayout>
  )
}
