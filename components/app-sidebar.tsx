'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Clock,
  History,
  BarChart3,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { UserSession } from '@/components/user-session'

const navItems = [
  {
    label: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    label: 'Empleados',
    href: '/employees',
    icon: Users,
  },
  {
    label: 'Asistencia',
    href: '/attendance',
    icon: Clock,
  },
  {
    label: 'Historial',
    href: '/history',
    icon: History,
  },
  {
    label: 'Reportes',
    href: '/reports',
    icon: BarChart3,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed top-4 left-4 z-40 lg:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-accent rounded-md"
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border transition-transform duration-200 z-40 shadow-md',
          'w-64 pt-4 lg:pt-0',
          'hidden lg:flex flex-col',
          isOpen && 'flex translate-x-0',
          !isOpen && 'lg:flex'
        )}
      >
        {/* Logo */}
        <div className="px-6 py-4 lg:pt-6 flex items-center gap-2">
          <div className="w-8 h-8 bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center font-bold text-lg shadow-sm">
            C
          </div>
          <span className="font-bold text-xl text-sidebar-foreground">Clofi</span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 transition-colors font-medium text-sm',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/30'
                )}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Session */}
        <div className="px-4 py-4 border-t border-sidebar-border mt-auto">
          <UserSession />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-sidebar-border text-xs text-sidebar-foreground/60">
          <p>© {new Date().getFullYear()} Clofi</p>
          <p>Sistema de Gestión</p>
        </div>
      </aside>
    </>
  )
}
