'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, cn, getStatusColor } from '@/lib/utils'
import { Calendar, FileText, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth'

interface BookingRecord {
  id: string
  start_date: string
  end_date: string
  status: string
  estimated_cost: number
  customer: {
    first_name: string
    last_name: string
  }
  vehicle: {
    brand: string
    model: string
    plate_number: string
  }
  created_by?: {
    id: string
  } | null
}

interface RentalRecord {
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
  created_by?: {
    id: string
  } | null
}

export default function RecordsPage() {
  const { user } = useAuthStore()
  const isEmployee = user?.role === 'EMPLOYEE'
  const [bookings, setBookings] = useState<BookingRecord[]>([])
  const [rentals, setRentals] = useState<RentalRecord[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [tab, setTab] = useState<'bookings' | 'rentals'>('bookings')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [bookingData, rentalData] = await Promise.all([
          api.get<{ bookings: BookingRecord[] }>('/bookings'),
          api.get<{ rentals: RentalRecord[] }>('/rentals'),
        ])
        const scopedBookings = isEmployee && user?.id
          ? bookingData.bookings.filter((item) => item.created_by?.id === user.id)
          : bookingData.bookings
        const scopedRentals = isEmployee && user?.id
          ? rentalData.rentals.filter((item) => item.created_by?.id === user.id)
          : rentalData.rentals
        setBookings(scopedBookings)
        setRentals(scopedRentals)
      } catch (error) {
        toast.error('Failed to load records')
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  const filteredBookings = useMemo(() => {
    if (!searchTerm) return bookings
    const query = searchTerm.toLowerCase()
    return bookings.filter((item) =>
      `${item.customer.first_name} ${item.customer.last_name} ${item.vehicle.brand} ${item.vehicle.model} ${item.vehicle.plate_number}`
        .toLowerCase()
        .includes(query)
    )
  }, [bookings, searchTerm])

  const filteredRentals = useMemo(() => {
    if (!searchTerm) return rentals
    const query = searchTerm.toLowerCase()
    return rentals.filter((item) =>
      `${item.customer.first_name} ${item.customer.last_name} ${item.vehicle.brand} ${item.vehicle.model} ${item.vehicle.plate_number}`
        .toLowerCase()
        .includes(query)
    )
  }, [rentals, searchTerm])

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
        <h1 className="text-3xl font-bold text-gray-900">Records</h1>
        <p className="mt-2 text-sm text-gray-600">History of bookings and rentals</p>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              className="input pl-10"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab('bookings')}
              className={cn('btn', tab === 'bookings' ? 'btn-primary' : 'btn-secondary')}
            >
              Bookings ({bookings.length})
            </button>
            <button
              onClick={() => setTab('rentals')}
              className={cn('btn', tab === 'rentals' ? 'btn-primary' : 'btn-secondary')}
            >
              Rentals ({rentals.length})
            </button>
          </div>
        </div>
      </div>

      {tab === 'bookings' ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Details</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.customer.first_name} {item.customer.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.vehicle.brand} {item.vehicle.model} ({item.vehicle.plate_number})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(item.start_date)} to {formatDate(item.end_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(item.estimated_cost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn('badge', getStatusColor(item.status))}>{item.status}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Link href={`/dashboard/bookings/${item.id}`} className="text-primary-600 hover:text-primary-700 text-sm">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredBookings.length === 0 && (
            <div className="py-12 text-center text-gray-500">No booking records found.</div>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Details</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRentals.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.customer.first_name} {item.customer.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.vehicle.brand} {item.vehicle.model} ({item.vehicle.plate_number})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(item.start_date)} to {item.end_date ? formatDate(item.end_date) : 'Ongoing'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(item.total_cost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn('badge', getStatusColor(item.status))}>{item.status}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Link href={`/dashboard/rentals/${item.id}`} className="text-primary-600 hover:text-primary-700 text-sm">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredRentals.length === 0 && (
            <div className="py-12 text-center text-gray-500">No rental records found.</div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-primary-600" />
            <p className="text-sm text-gray-700">Total Booking Records: <span className="font-semibold">{bookings.length}</span></p>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary-600" />
            <p className="text-sm text-gray-700">Total Rental Records: <span className="font-semibold">{rentals.length}</span></p>
          </div>
        </div>
      </div>
    </div>
  )
}
