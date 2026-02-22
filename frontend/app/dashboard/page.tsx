'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils'
import { Car, Calendar, DollarSign, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'

interface DashboardMetrics {
  totalFleet: number
  activeRentals: number
  revenueToday: number
  revenueMonth: number
  revenueYear: number
  fleetUtilization: number
  overdueRentals: number
}

interface DriverBooking {
  id: string
  start_date: string
  end_date: string
  status: string
  notes?: string | null
  pickup_location_type?: string | null
  pickup_location_label?: string | null
  dropoff_location?: string | null
  dropoff_verified?: boolean
  customer: {
    first_name: string
    last_name: string
    phone: string
  }
  vehicle: {
    brand: string
    model: string
    plate_number: string
  }
  created_by?: {
    first_name: string
    last_name: string
    role: string
  } | null
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const isEmployee = user?.role === 'EMPLOYEE'
  const isDriver = user?.role === 'DRIVER'
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [driverBookings, setDriverBookings] = useState<DriverBooking[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isDriver) {
      loadDriverDashboard()
      return
    }

    if (isEmployee) {
      setMetrics({
        totalFleet: 0,
        activeRentals: 0,
        revenueToday: 0,
        revenueMonth: 0,
        revenueYear: 0,
        fleetUtilization: 0,
        overdueRentals: 0,
      })
      setIsLoading(false)
      return
    }
    loadMetrics()
  }, [isDriver, isEmployee])

  const loadDriverDashboard = async () => {
    try {
      const [bookingsData, notificationsData] = await Promise.all([
        api.get<{ bookings: DriverBooking[] }>('/bookings'),
        api.get<{ unreadCount: number }>('/notifications'),
      ])

      setDriverBookings(bookingsData.bookings)
      setUnreadCount(notificationsData.unreadCount)
    } catch (error) {
      console.error('Failed to load driver dashboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMetrics = async () => {
    try {
      const data = await api.get<{ metrics: DashboardMetrics }>('/analytics/dashboard')
      setMetrics(data.metrics)
    } catch (error) {
      // Employees don't have analytics permission; show empty metrics
      setMetrics({
        totalFleet: 0,
        activeRentals: 0,
        revenueToday: 0,
        revenueMonth: 0,
        revenueYear: 0,
        fleetUtilization: 0,
        overdueRentals: 0,
      })
      console.error('Failed to load metrics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (isDriver) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Driver Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">Your assigned tasks and latest updates</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="card">
            <p className="text-sm font-medium text-gray-600">Assigned Tasks</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{driverBookings.length}</p>
          </div>
          <div className="card">
            <p className="text-sm font-medium text-gray-600">Active Tasks</p>
            <p className="mt-2 text-2xl font-semibold text-blue-600">
              {driverBookings.filter((item) => item.status === 'ACTIVE' || item.status === 'CONFIRMED').length}
            </p>
          </div>
          <div className="card">
            <p className="text-sm font-medium text-gray-600">Unread Notifications</p>
            <p className="mt-2 text-2xl font-semibold text-green-600">{unreadCount}</p>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pickup</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Drop-off</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {driverBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.customer.first_name} {booking.customer.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{booking.customer.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.vehicle.brand} {booking.vehicle.model} ({booking.vehicle.plate_number})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.pickup_location_label || booking.pickup_location_type || 'Not specified'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.dropoff_location || 'Not specified'}
                      <div className="text-xs text-gray-500">
                        {booking.dropoff_verified ? 'Verified' : 'Pending verification'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(booking.start_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.created_by
                        ? `${booking.created_by.first_name} ${booking.created_by.last_name} (${booking.created_by.role})`
                        : 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{booking.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  const stats = [
    {
      name: 'Total Fleet',
      value: metrics?.totalFleet || 0,
      icon: Car,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'positive',
    },
    {
      name: 'Active Rentals',
      value: metrics?.activeRentals || 0,
      icon: Calendar,
      color: 'bg-green-500',
      change: '+8%',
      changeType: 'positive',
    },
    {
      name: 'Revenue (Month)',
      value: formatCurrency(metrics?.revenueMonth || 0),
      icon: DollarSign,
      color: 'bg-purple-500',
      change: '+23%',
      changeType: 'positive',
    },
    {
      name: 'Overdue Rentals',
      value: metrics?.overdueRentals || 0,
      icon: AlertCircle,
      color: 'bg-red-500',
      change: '-5%',
      changeType: 'negative',
    },
  ]

  const revenueData = [
    { name: 'Jan', revenue: 45000 },
    { name: 'Feb', revenue: 52000 },
    { name: 'Mar', revenue: 48000 },
    { name: 'Apr', revenue: 61000 },
    { name: 'May', revenue: 55000 },
    { name: 'Jun', revenue: 67000 },
  ]

  const utilizationData = [
    { name: 'Mon', rate: 75 },
    { name: 'Tue', rate: 82 },
    { name: 'Wed', rate: 68 },
    { name: 'Thu', rate: 90 },
    { name: 'Fri', rate: 95 },
    { name: 'Sat', rate: 88 },
    { name: 'Sun', rate: 72 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Welcome back! Here's what's happening with your rental business today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">
                  {typeof stat.value === 'number' ? formatNumber(stat.value) : stat.value}
                </p>
                <div className="mt-2 flex items-center text-sm">
                  {stat.changeType === 'positive' ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span
                    className={
                      stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }
                  >
                    {stat.change}
                  </span>
                  <span className="text-gray-500 ml-1">from last month</span>
                </div>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={{ fill: '#0ea5e9' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Utilization Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fleet Utilization</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={utilizationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `${value}%`} />
              <Bar dataKey="rate" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/dashboard/bookings" className="btn btn-primary text-center">
            New Booking
          </Link>
          {isEmployee ? (
            <Link href="/dashboard/rentals" className="btn btn-secondary text-center">
              Manage Rentals
            </Link>
          ) : (
            <Link href="/dashboard/vehicles" className="btn btn-secondary text-center">
              Add Vehicle
            </Link>
          )}
          <Link href="/dashboard/customers" className="btn btn-secondary text-center">
            Add Customer
          </Link>
          {isEmployee ? (
            <Link href="/dashboard/drivers" className="btn btn-secondary text-center">
              Assign Driver
            </Link>
          ) : (
            <Link href="/dashboard/analytics" className="btn btn-secondary text-center">
              View Reports
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
