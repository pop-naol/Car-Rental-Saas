'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, getStatusColor, cn } from '@/lib/utils'
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth'

interface BookingDetails {
  id: string
  status: string
  start_date: string
  end_date: string
  estimated_cost: number
  discount_code?: string | null
  discount_amount: number
  notes?: string | null
  pickup_location_type?: string | null
  pickup_location_label?: string | null
  dropoff_location?: string | null
  dropoff_verified?: boolean
  customer: {
    first_name: string
    last_name: string
    email: string
    phone: string
  }
  vehicle: {
    brand: string
    model: string
    plate_number: string
    year: number
  }
  driver?: {
    first_name: string
    last_name: string
    phone: string
  } | null
}

export default function BookingDetailsPage() {
  const { user } = useAuthStore()
  const isDriver = user?.role === 'DRIVER'
  const params = useParams()
  const router = useRouter()
  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (params.id) loadBooking()
  }, [params.id])

  const loadBooking = async () => {
    try {
      const data = await api.get<{ booking: BookingDetails }>(`/bookings/${params.id}`)
      setBooking(data.booking)
    } catch {
      toast.error('Failed to load booking details')
      router.push('/dashboard/bookings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!booking) return
    try {
      await api.patch(`/bookings/${booking.id}/confirm`, {})
      toast.success('Booking confirmed')
      loadBooking()
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to confirm booking')
    }
  }

  const handleCancel = async () => {
    if (!booking) return
    try {
      await api.patch(`/bookings/${booking.id}/cancel`, {})
      toast.success('Booking cancelled')
      loadBooking()
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to cancel booking')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!booking) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/bookings" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Booking Details</h1>
            <p className="mt-1 text-sm text-gray-600">ID: {booking.id}</p>
          </div>
        </div>
        <span className={cn('badge text-sm', getStatusColor(booking.status))}>{booking.status}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Customer</h2>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {booking.customer.first_name} {booking.customer.last_name}
            </p>
            <p className="text-sm text-gray-600">{booking.customer.email}</p>
            <p className="text-sm text-gray-600">{booking.customer.phone}</p>
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Vehicle</h2>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {booking.vehicle.brand} {booking.vehicle.model} ({booking.vehicle.year})
            </p>
            <p className="text-sm text-gray-600">{booking.vehicle.plate_number}</p>
          </div>
        </div>

        <div className="card space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">Dates</h2>
          <p className="text-sm text-gray-700">Start: {formatDate(booking.start_date)}</p>
          <p className="text-sm text-gray-700">End: {formatDate(booking.end_date)}</p>
        </div>

        {!isDriver && (
          <div className="card space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">Cost</h2>
            <p className="text-sm text-gray-700">Estimated: {formatCurrency(booking.estimated_cost)}</p>
            <p className="text-sm text-gray-700">Discount: {formatCurrency(booking.discount_amount || 0)}</p>
            {booking.discount_code && (
              <p className="text-sm text-gray-700">Code: {booking.discount_code}</p>
            )}
          </div>
        )}

        <div className="card space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">Locations</h2>
          <p className="text-sm text-gray-700">
            Pickup: {booking.pickup_location_label || booking.pickup_location_type || 'N/A'}
          </p>
          <p className="text-sm text-gray-700">Drop-off: {booking.dropoff_location || 'N/A'}</p>
          <p className="text-sm text-gray-700">
            Drop-off Verification: {booking.dropoff_verified ? 'Verified' : 'Pending'}
          </p>
        </div>
      </div>

      {booking.notes && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Notes</h2>
          <p className="text-sm text-gray-700">{booking.notes}</p>
        </div>
      )}

      {!isDriver && booking.status === 'PENDING' && (
        <div className="flex gap-3">
          <button onClick={handleConfirm} className="btn btn-primary flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            Confirm
          </button>
          <button onClick={handleCancel} className="btn bg-red-600 hover:bg-red-700 text-white flex items-center">
            <XCircle className="h-5 w-5 mr-2" />
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
