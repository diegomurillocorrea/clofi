'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { sanitizeNextPath } from '@/lib/auth/routes'

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function LoginFormInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const urlError = searchParams.get('error')
  const displayError = error ?? (urlError ? safeDecodeURIComponent(urlError) : null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmed = email.trim()
    if (!trimmed || !trimmed.includes('@')) {
      setError('Introduce un email válido')
      return
    }
    if (password.length < 1) {
      setError('Introduce tu contraseña')
      return
    }

    setIsLoading(true)
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: trimmed,
      password,
    })
    setIsLoading(false)

    if (signInError) {
      setError(
        signInError.message === 'Invalid login credentials'
          ? 'Email o contraseña incorrectos'
          : signInError.message,
      )
      return
    }

    const redirectTo = sanitizeNextPath(searchParams.get('next'))
    router.refresh()
    router.push(redirectTo)
  }

  const inputClass =
    'w-full border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground transition-colors focus:border-ring focus:outline-none focus:ring-3 focus:ring-ring/50 disabled:opacity-50'

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="text-center">
          <div className="mb-2 flex items-center justify-center gap-3" role="group" aria-label="Clofi">
            <div className="flex size-12 items-center justify-center bg-primary text-lg font-bold text-primary-foreground shadow-sm">
              C
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">Clofi</CardTitle>
          </div>
          <CardDescription>Inicia sesión para gestionar empleados y nómina</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@ejemplo.com"
                required
                disabled={isLoading}
                className={inputClass}
                aria-label="Dirección de correo electrónico"
                aria-invalid={Boolean(displayError)}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Contraseña
              </label>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoading}
                className={inputClass}
                aria-label="Contraseña"
                aria-invalid={Boolean(displayError)}
              />
              <div className="mt-2 flex items-center gap-2">
                <input
                  id="show-password"
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  disabled={isLoading}
                  className="size-4 accent-primary"
                  aria-label="Mostrar contraseña"
                />
                <label htmlFor="show-password" className="text-sm text-muted-foreground">
                  Mostrar contraseña
                </label>
              </div>
            </div>

            {displayError ? (
              <div
                role="alert"
                className="border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {displayError}
              </div>
            ) : null}

            <Button
              type="submit"
              disabled={isLoading}
              className="h-11 w-full text-base"
              aria-busy={isLoading}
            >
              {isLoading ? 'Iniciando sesión…' : 'Iniciar sesión'}
            </Button>
          </form>
        </CardContent>
      </Card>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Clofi · Sistema de Gestión
      </p>
    </div>
  )
}

function LoginFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Clofi</CardTitle>
          <CardDescription>Cargando…</CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}

export function LoginForm() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginFormInner />
    </Suspense>
  )
}
