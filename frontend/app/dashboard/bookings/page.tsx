'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import { formatDate, formatCurrency, getStatusColor, cn } from '@/lib/utils'
import { Plus, Search, Calendar, CheckCircle, XCircle, Eye, PlayCircle } from 'lucide-react'
import { toast } from 'sonner'
import { BookingForm } from '@/components/bookings/BookingForm'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'

interface Booking {
  id: string
  start_date: string
  end_date: string
  status: string
  estimated_cost: number
  customer: {
    first_name: string
    last_name: string
    email: string
  }
  vehicle: {
    brand: string
    model: string
    plate_number: string
  }
  driver?: {
    first_name: string
    last_name: string
  }
  pickup_location_type?: string | null
  pickup_location_label?: string | null
  dropoff_location?: string | null
  pickup_verified?: boolean
  pickup_verified_location?: string | null
  dropoff_verified?: boolean
  dropoff_verified_location?: string | null
  notes?: string | null
  created_by?: {
    id: string
    first_name: string
    last_name: string
    email: string
    role: string
  } | null
}

export default function BookingsPage() {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'COMPANY_MANAGER'
  const isDriver = user?.role === 'DRIVER'
  const searchParams = useSearchParams()
  const preselectedVehicleId = searchParams.get('vehicleId') || ''
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadBookings()
  }, [])

  useEffect(() => {
    if (preselectedVehicleId) {
      setShowForm(true)
    }
  }, [preselectedVehicleId])

  const loadBookings = async () => {
    try {
      const data = await api.get<{ bookings: Booking[] }>('/bookings')
      setBookings(data.bookings)
    } catch (error) {
      toast.error('Failed to load bookings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddBooking = async (data: any) => {
    setIsSubmitting(true)
    try {
      if (!user?.companyId) {
        toast.error('Missing company context for booking creation')
        return
      }

      await api.post('/bookings', {
        companyId: user.companyId,
        customerId: data.customerId,
        vehicleId: data.vehicleId,
        driverId: data.driverId || undefined,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        estimatedCost: data.estimatedCost,
        pickupLocationType: data.pickupLocationType,
        pickupLocationLabel: data.pickupLocationLabel,
        dropoffLocation: data.dropoffLocation,
        notes: data.notes,
      })
      toast.success('Booking created successfully')
      setShowForm(false)
      loadBookings()
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to create booking')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmBooking = async (id: string) => {
    try {
      await api.patch(`/bookings/${id}/confirm`, {})
      toast.success('Booking confirmed')
      loadBookings()
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to confirm booking')
    }
  }

  const handleCancelBooking = async (id: string) => {
    try {
      await api.patch(`/bookings/${id}/cancel`, {})
      toast.success('Booking cancelled')
      loadBookings()
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to cancel booking')
    }
  }

  const handleStartRental = async (bookingId: string) => {
    const startOdometer = prompt('Enter start odometer')
    const startFuel = prompt('Enter start fuel percentage (0-100)')

    if (!startOdometer || !startFuel) return
    const normalizeNumber = (value: string) => {
      const cleaned = value.replace(/,/g, '.').replace(/[^0-9.]/g, '')
      return cleaned ? Number.parseFloat(cleaned) : Number.NaN
    }
    const odometerValue = normalizeNumber(startOdometer)
    const fuelValue = normalizeNumber(startFuel)
    if (!Number.isFinite(odometerValue) || !Number.isFinite(fuelValue)) {
      toast.error('Please enter valid numbers for odometer and fuel')
      return
    }

    try {
      await api.post('/rentals/start', {
        bookingId,
        startOdometer: odometerValue,
        startFuel: fuelValue,
      })
      toast.success('Rental started successfully')
      loadBookings()
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to start rental')
    }
  }

  const handleVerifyDropoff = async (bookingId: string) => {
    const useAssigned = window.confirm('Use assigned drop-off location? Press Cancel to enter manually.')
    let manualLocation: string | undefined

    if (!useAssigned) {
      const entered = window.prompt('Enter actual drop-off location')
      if (!entered || !entered.trim()) {
        toast.error('Drop-off location is required')
        return
      }
      manualLocation = entered.trim()
    }

    try {
      await api.post(`/bookings/${bookingId}/verify-dropoff`, {
        useAssignedLocation: useAssigned,
        location: manualLocation,
      })
      toast.success('Drop-off verified')
      loadBookings()
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to verify drop-off')
    }
  }

  const handleVerifyPickup = async (bookingId: string) => {
    const location = window.prompt('Enter pickup location (leave blank to use assigned pickup)')
    try {
      await api.post(`/bookings/${bookingId}/verify-pickup`, {
        location: location?.trim() || undefined,
      })
      toast.success('Pickup verified')
      loadBookings()
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to verify pickup')
    }
  }

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.customer.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customer.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.vehicle.model.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'ALL' || booking.status === statusFilter

    return matchesSearch && matchesStatus
  })

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
          <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
          <p className="mt-2 text-sm text-gray-600">Manage your {bookings.length} bookings</p>
        </div>
        {!isDriver && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            New Booking
          </button>
        )}
      </div>

      <div className="card">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input">
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].map((status) => (
          <div key={status} className="card">
            <p className="text-sm font-medium text-gray-600">{status}</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {bookings.filter((b) => b.status === status).length}
            </p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                {!isDriver && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pickup Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Drop-off Location</th>
                {isDriver && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned By</th>
                )}
                {isAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booked By</th>
                )}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {booking.customer.first_name} {booking.customer.last_name}
                    </div>
                    <div className="text-sm text-gray-500">{booking.customer.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {booking.vehicle.brand} {booking.vehicle.model}
                    </div>
                    <div className="text-sm text-gray-500">{booking.vehicle.plate_number}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(booking.start_date)}</div>
                    <div className="text-sm text-gray-500">to {formatDate(booking.end_date)}</div>
                  </td>
                  {!isDriver && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(booking.estimated_cost)}
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn('badge', getStatusColor(booking.status))}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {booking.pickup_location_label || booking.pickup_location_type || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{booking.dropoff_location || 'N/A'}</div>
                    <div className="text-xs text-gray-500">
                      Pickup: {booking.pickup_verified ? 'Verified' : 'Pending'} | Drop-off:{' '}
                      {booking.dropoff_verified ? 'Verified' : 'Pending'}
                    </div>
                  </td>
                  {isDriver && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      {booking.created_by ? (
                        <div className="text-sm text-gray-900">
                          {booking.created_by.first_name} {booking.created_by.last_name}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Unknown</span>
                      )}
                    </td>
                  )}
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      {booking.created_by ? (
                        <>
                          <div className="text-sm font-medium text-gray-900">
                            {booking.created_by.first_name} {booking.created_by.last_name}
                          </div>
                          <div className="text-xs text-gray-500">{booking.created_by.role}</div>
                        </>
                      ) : (
                        <span className="text-sm text-gray-500">Unknown</span>
                      )}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Link href={`/dashboard/bookings/${booking.id}`} className="text-gray-600 hover:text-primary-600">
                        <Eye className="h-5 w-5" />
                      </Link>
                      {!isDriver && booking.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleConfirmBooking(booking.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-5 w-5" />
                          </button>
                        </>
                      )}
                      {!isDriver && booking.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleStartRental(booking.id)}
                          className="text-blue-600 hover:text-blue-700"
                          title="Start Rental"
                        >
                          <PlayCircle className="h-5 w-5" />
                        </button>
                      )}
                      {isDriver && !booking.pickup_verified && (
                        <button
                          onClick={() => handleVerifyPickup(booking.id)}
                          className="text-indigo-600 hover:text-indigo-700"
                          title="Verify Pickup"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                      )}
                      {isDriver && booking.pickup_verified && !booking.dropoff_verified && (
                        <button
                          onClick={() => handleVerifyDropoff(booking.id)}
                          className="text-emerald-600 hover:text-emerald-700"
                          title="Verify Drop-off"
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

        {filteredBookings.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search' : 'Get started by creating a new booking'}
            </p>
          </div>
        )}
      </div>

      {!isDriver && showForm && (
        <BookingForm
          onSubmit={handleAddBooking}
          onClose={() => setShowForm(false)}
          isLoading={isSubmitting}
          initialValues={{
            vehicleId: preselectedVehicleId,
          }}
        />
      )}
    </div>
  )
}
