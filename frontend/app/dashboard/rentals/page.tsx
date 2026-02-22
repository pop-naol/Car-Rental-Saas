'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { formatDate, formatCurrency, getStatusColor, cn } from '@/lib/utils'
import { Search, FileText, Eye, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'

interface Rental {
  id: string
  start_date: string
  end_date: string | null
  status: string
  total_cost: number
  customer: {
    first_name: string
    last_name: string
  }
  vehicle: {
    brand: string
    model: string
    plate_number: string
  }
  booking?: {
    notes?: string | null
  }
  driver?: {
    first_name: string
    last_name: string
  }
  created_by?: {
    id: string
    first_name: string
    last_name: string
    email: string
    role: string
  } | null
}

export default function RentalsPage() {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'COMPANY_MANAGER'
  const isDriver = user?.role === 'DRIVER'
  const [rentals, setRentals] = useState<Rental[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const parseLocations = (notes?: string | null) => {
    if (!notes) return { pickup: 'N/A', dropoff: 'N/A' }
    try {
      const parsed = JSON.parse(notes) as any
      return {
        pickup: parsed?.assignment?.pickupLocationLabel || parsed?.assignment?.pickupLocationType || 'N/A',
        dropoff: parsed?.assignment?.dropoffLocation || 'N/A',
      }
    } catch {
      return { pickup: 'N/A', dropoff: 'N/A' }
    }
  }

  useEffect(() => {
    loadRentals()
  }, [])

  const loadRentals = async () => {
    try {
      const data = await api.get<{ rentals: Rental[] }>('/rentals')
      setRentals(data.rentals)
    } catch (error) {
      toast.error('Failed to load rentals')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredRentals = rentals.filter((rental) => {
    const matchesSearch =
      rental.customer.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rental.customer.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rental.vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rental.vehicle.model.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'ALL' || rental.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleEndRental = async (id: string) => {
    const endOdometer = prompt('Enter end odometer')
    const endFuel = prompt('Enter end fuel percentage (0-100)')
    const damageCost = prompt('Enter damage cost (optional, default 0)') || '0'
    const damageNotes = prompt('Enter damage notes (optional)') || ''

    if (!endOdometer || !endFuel) return

    try {
      await api.post(`/rentals/${id}/end`, {
        endOdometer: Number(endOdometer),
        endFuel: Number(endFuel),
        damageCost: Number(damageCost),
        damageNotes,
      })
      toast.success('Rental completed successfully')
      loadRentals()
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to complete rental')
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rentals</h1>
          <p className="mt-2 text-sm text-gray-600">Manage your {rentals.length} rentals</p>
        </div>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search rentals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input">
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-sm font-medium text-gray-600">Active Rentals</p>
          <p className="mt-2 text-2xl font-semibold text-green-600">
            {rentals.filter((r) => r.status === 'ACTIVE').length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-600">Completed</p>
          <p className="mt-2 text-2xl font-semibold text-blue-600">
            {rentals.filter((r) => r.status === 'COMPLETED').length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-600">Overdue</p>
          <p className="mt-2 text-2xl font-semibold text-red-600">
            {rentals.filter((r) => r.status === 'OVERDUE').length}
          </p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                {!isDriver && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pickup Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Drop-off Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                {isAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rented By</th>
                )}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRentals.map((rental) => (
                <tr key={rental.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {rental.customer.first_name} {rental.customer.last_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {rental.vehicle.brand} {rental.vehicle.model}
                    </div>
                    <div className="text-sm text-gray-500">{rental.vehicle.plate_number}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(rental.start_date)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {rental.end_date ? formatDate(rental.end_date) : 'Ongoing'}
                    </div>
                  </td>
                  {!isDriver && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(rental.total_cost)}
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{parseLocations(rental.booking?.notes).pickup}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{parseLocations(rental.booking?.notes).dropoff}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn('badge', getStatusColor(rental.status))}>
                      {rental.status}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      {rental.created_by ? (
                        <>
                          <div className="text-sm font-medium text-gray-900">
                            {rental.created_by.first_name} {rental.created_by.last_name}
                          </div>
                          <div className="text-xs text-gray-500">{rental.created_by.role}</div>
                        </>
                      ) : (
                        <span className="text-sm text-gray-500">Unknown</span>
                      )}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Link href={`/dashboard/rentals/${rental.id}`} className="text-gray-600 hover:text-primary-600">
                        <Eye className="h-5 w-5" />
                      </Link>
                      {!isDriver && rental.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleEndRental(rental.id)}
                          className="text-green-600 hover:text-green-700"
                          title="End Rental"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRentals.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No rentals found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search' : 'Rentals will appear here once bookings are started'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
