'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { BarChart3, TrendingUp, Car, AlertTriangle, Clock3 } from 'lucide-react'
import { toast } from 'sonner'

interface DashboardMetrics {
  totalFleet: number
  activeRentals: number
  revenueToday: number
  revenueMonth: number
  revenueYear: number
  fleetUtilization: number
  overdueRentals: number
}

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [growthRate, setGrowthRate] = useState<number>(0)
  const [averageDuration, setAverageDuration] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      const [dashboard, growth, duration] = await Promise.all([
        api.get<{ metrics: DashboardMetrics }>('/analytics/dashboard'),
        api.get<{ growthRate: number }>('/analytics/revenue-growth'),
        api.get<{ averageDuration: number }>('/analytics/average-rental-duration'),
      ])

      setMetrics(dashboard.metrics)
      setGrowthRate(growth.growthRate)
      setAverageDuration(duration.averageDuration)
    } catch (error) {
      toast.error('Failed to load analytics')
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-2 text-sm text-gray-600">Live business and fleet metrics</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Revenue Today</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(metrics?.revenueToday || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 bg-blue-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Revenue Month</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(metrics?.revenueMonth || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 bg-purple-100 rounded-lg">
              <Car className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Fleet Utilization</p>
              <p className="text-2xl font-semibold text-gray-900">
                {metrics?.fleetUtilization || 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 bg-yellow-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue Rentals</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics?.overdueRentals || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Snapshot</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Today</span>
              <span className="text-sm font-medium text-gray-900">{formatCurrency(metrics?.revenueToday || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">This Month</span>
              <span className="text-sm font-medium text-gray-900">{formatCurrency(metrics?.revenueMonth || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">This Year</span>
              <span className="text-sm font-medium text-gray-900">{formatCurrency(metrics?.revenueYear || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Growth vs Last Month</span>
              <span className={`text-sm font-medium ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {growthRate.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Operations Snapshot</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Fleet</span>
              <span className="text-sm font-medium text-gray-900">{metrics?.totalFleet || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Rentals</span>
              <span className="text-sm font-medium text-gray-900">{metrics?.activeRentals || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 flex items-center">
                <Clock3 className="h-4 w-4 mr-1" />
                Avg Rental Duration
              </span>
              <span className="text-sm font-medium text-gray-900">{averageDuration.toFixed(2)} days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
