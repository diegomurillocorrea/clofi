import type { Metadata } from 'next'
import { LoginForm } from '@/components/login-form'

export const metadata: Metadata = {
  title: 'Iniciar sesión · Clofi',
  description: 'Accede al panel de gestión de empleados y nómina de Clofi.',
}

export default function LoginPage() {
  return <LoginForm />
}
