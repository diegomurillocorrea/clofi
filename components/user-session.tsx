'use client'

import { useEffect, useState } from 'react'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function UserSession() {
  const [email, setEmail] = useState<string | null>(null)
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null)
    })
  }, [])

  const handleSignOut = async () => {
    setIsSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (!email) {
    return null
  }

  return (
    <div className="space-y-3">
      <p className="truncate px-2 text-xs text-sidebar-foreground/70" title={email}>
        {email}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full justify-start gap-2 border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent/30"
        onClick={handleSignOut}
        disabled={isSigningOut}
      >
        <LogOut size={16} />
        {isSigningOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
      </Button>
    </div>
  )
}
