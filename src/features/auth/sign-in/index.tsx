import { SignIn as ClerkSignIn } from '@clerk/clerk-react'
import { AuthLayout } from '../auth-layout'

export function SignIn() {
  return (
    <AuthLayout>
      <div className='flex justify-center'>
        <ClerkSignIn
          routing='hash'
          signUpUrl='/sign-up'
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
