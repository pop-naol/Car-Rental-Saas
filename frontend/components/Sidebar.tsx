'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Car,
  Users,
  Calendar,
  FileText,
  DollarSign,
  Wrench,
  BarChart3,
  Building2,
  UserCog,
  Bell,
  FileStack,
  LogOut,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Vehicles', href: '/dashboard/vehicles', icon: Car },
  { name: 'Customers', href: '/dashboard/customers', icon: Users },
  { name: 'Drivers', href: '/dashboard/drivers', icon: UserCog },
  { name: 'Bookings', href: '/dashboard/bookings', icon: Calendar },
  { name: 'Rentals', href: '/dashboard/rentals', icon: FileText },
  { name: 'Records', href: '/dashboard/records', icon: FileText },
  { name: 'Financial', href: '/dashboard/financial', icon: DollarSign },
  { name: 'Maintenance', href: '/dashboard/maintenance', icon: Wrench },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Branches', href: '/dashboard/branches', icon: Building2 },
  { name: 'Employees', href: '/dashboard/employees', icon: Users },
  { name: 'Documents', href: '/dashboard/documents', icon: FileStack },
  { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
]

interface SidebarProps {
  className?: string
  onNavigate?: () => void
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const isEmployee = user?.role === 'EMPLOYEE'
  const isDriver = user?.role === 'DRIVER'
  const hiddenForEmployee = new Set([
    '/dashboard/financial',
    '/dashboard/maintenance',
    '/dashboard/analytics',
    '/dashboard/branches',
    '/dashboard/employees',
    '/dashboard/notifications',
  ])
  const allowedNavigation = isEmployee
    ? navigation.filter((item) => !hiddenForEmployee.has(item.href))
    : isDriver
      ? navigation.filter((item) =>
          new Set(['/dashboard', '/dashboard/bookings', '/dashboard/rentals', '/dashboard/notifications']).has(
            item.href
          )
        )
      : navigation

  return (
    <div className={cn('flex flex-col w-64 bg-gray-900 min-h-screen', className)}>
      <div className="flex items-center justify-center h-16 bg-gray-800">
        <Car className="h-8 w-8 text-primary-500" />
        <span className="ml-2 text-xl font-bold text-white">CarRental</span>
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {allowedNavigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5',
                    isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-300'
                  )}
                />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center mb-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-400">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-800 hover:text-white transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
