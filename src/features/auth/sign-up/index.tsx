import { SignUp as ClerkSignUp } from '@clerk/clerk-react'
import { AuthLayout } from '../auth-layout'

export function SignUp() {
  return (
    <AuthLayout>
      <div className='flex justify-center'>
        <ClerkSignUp
          routing='hash'
          signInUrl='/sign-in'
          fallbackRedirectUrl='/'
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'shadow-none border border-border rounded-xl',
            },
          }}
        />
      </div>
    </AuthLayout>
  )
}
