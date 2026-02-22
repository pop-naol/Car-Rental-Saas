'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { Sidebar } from '@/components/Sidebar'
import { Car, Menu, X } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, isLoading, loadUser } = useAuthStore()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  useEffect(() => {
    loadUser()
  }, [loadUser])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return

    if (user.role === 'EMPLOYEE') {
      const blockedPrefixes = [
        '/dashboard/financial',
        '/dashboard/maintenance',
        '/dashboard/analytics',
        '/dashboard/branches',
        '/dashboard/employees',
        '/dashboard/notifications',
      ]
      const isBlocked = blockedPrefixes.some((prefix) => pathname.startsWith(prefix))
      if (isBlocked) {
        router.push('/dashboard')
      }
    }

    if (user.role === 'DRIVER') {
      const allowedPrefixes = ['/dashboard', '/dashboard/bookings', '/dashboard/rentals', '/dashboard/notifications']
      const isAllowed = allowedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
      if (!isAllowed) {
        router.push('/dashboard')
      }
    }
  }, [isLoading, isAuthenticated, user, pathname, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="Close menu overlay"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <Sidebar
            className="relative h-full shadow-xl"
            onNavigate={() => setMobileSidebarOpen(false)}
          />
        </div>
      )}

      <main className="flex-1 overflow-y-auto">
        <div className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <Car className="h-5 w-5 text-primary-600" />
            <span className="ml-2 text-sm font-semibold text-gray-900">CarRental</span>
          </div>
          <button
            aria-label={mobileSidebarOpen ? 'Close menu' : 'Open menu'}
            className="p-2 rounded-md border border-gray-200 text-gray-700"
            onClick={() => setMobileSidebarOpen((value) => !value)}
          >
            {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        <div className="container mx-auto px-4 md:px-6 py-4 md:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
