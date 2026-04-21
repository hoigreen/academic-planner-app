import { Link } from '@tanstack/react-router'
import { AuthLayout } from '../auth-layout'

/**
 * Self-registration is disabled. Users are provisioned by administrators.
 */
export function SignUp() {
  return (
    <AuthLayout>
      <div className='flex flex-col items-center gap-3 text-center'>
        <p className='text-sm text-muted-foreground'>
          Self-registration is not available. Please contact your administrator to create an account.
        </p>
        <Link
          to='/sign-in'
          className='text-sm font-medium underline underline-offset-4 hover:opacity-75'
        >
          Back to sign in
        </Link>
      </div>
    </AuthLayout>
  )
}
