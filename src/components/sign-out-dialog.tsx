import { useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { revokeSession, clearStoredTokens } from '@/lib/keycloak-auth'
import { ConfirmDialog } from '@/components/confirm-dialog'

interface SignOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const { auth } = useAuthStore()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    // Revoke the refresh token server-side (best-effort)
    await revokeSession()
    clearStoredTokens()
    auth.reset()
    void navigate({ to: '/sign-in', replace: true })
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Sign out'
      desc='Are you sure you want to sign out? You will need to sign in again to access your account.'
      confirmText='Sign out'
      destructive
      handleConfirm={() => void handleSignOut()}
      className='sm:max-w-sm'
    />
  )
}
