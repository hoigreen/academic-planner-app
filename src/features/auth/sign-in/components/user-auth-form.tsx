import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { Loader2, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore, buildAuthUserFromKeycloak, type KeycloakParsedToken } from '@/stores/auth-store'
import { loginWithPassword, storeTokens, parseJwt } from '@/lib/keycloak-auth'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'

const formSchema = z.object({
  username: z.string().min(1, 'Please enter your username'),
  password: z.string().min(1, 'Please enter your password'),
})

interface UserAuthFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string
}

export function UserAuthForm({ className, redirectTo, ...props }: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { auth } = useAuthStore()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { username: '', password: '' },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      const tokens = await loginWithPassword(data.username, data.password)

      // Parse the access token to extract user identity
      const parsed = parseJwt(tokens.access_token) as KeycloakParsedToken
      const user = buildAuthUserFromKeycloak(parsed, import.meta.env.VITE_KEYCLOAK_CLIENT_ID as string)

      // Persist tokens and update auth store
      storeTokens(tokens)
      auth.setUser(user)
      auth.setAccessToken(tokens.access_token)

      toast.success(`Welcome, ${user?.name}!`)
      navigate({ to: redirectTo || '/', replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed'
      toast.error(message)
      form.setError('password', { message: ' ' }) // highlight field without duplicate text
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-3', className)}
        {...props}
      >
        <FormField
          control={form.control}
          name='username'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder='Enter your username' autoComplete='username' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <PasswordInput placeholder='••••••••' autoComplete='current-password' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className='mt-2' disabled={isLoading}>
          {isLoading ? <Loader2 className='animate-spin' /> : <LogIn />}
          Sign in
        </Button>
      </form>
    </Form>
  )
}
