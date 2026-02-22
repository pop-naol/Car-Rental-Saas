'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, getStatusColor, cn } from '@/lib/utils'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth'

interface RentalDetails {
  id: string
  status: string
  start_date: string
  end_date: string
  actual_return_date?: string | null
  start_odometer: number
  end_odometer?: number | null
  start_fuel: number
  end_fuel?: number | null
  base_cost: number
  late_fee: number
  mileage_fee: number
  damage_cost: number
  total_cost: number
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
  }
  booking?: {
    notes?: string | null
  }
}

export default function RentalDetailsPage() {
  const { user } = useAuthStore()
  const isDriver = user?.role === 'DRIVER'
  const params = useParams()
  const router = useRouter()
  const [rental, setRental] = useState<RentalDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
    if (params.id) loadRental()
  }, [params.id])

  const loadRental = async () => {
    try {
      const data = await api.get<{ rental: RentalDetails }>(`/rentals/${params.id}`)
      setRental(data.rental)
    } catch {
      toast.error('Failed to load rental details')
      router.push('/dashboard/rentals')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEndRental = async () => {
    if (!rental) return
    const endOdometer = prompt('Enter end odometer')
    const endFuel = prompt('Enter end fuel percentage (0-100)')
    const damageCost = prompt('Enter damage cost (optional, default 0)') || '0'
    const damageNotes = prompt('Enter damage notes (optional)') || ''
    if (!endOdometer || !endFuel) return

    try {
      await api.post(`/rentals/${rental.id}/end`, {
        endOdometer: Number(endOdometer),
        endFuel: Number(endFuel),
        damageCost: Number(damageCost),
        damageNotes,
      })
      toast.success('Rental completed successfully')
      loadRental()
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

  if (!rental) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/rentals" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rental Details</h1>
            <p className="mt-1 text-sm text-gray-600">ID: {rental.id}</p>
          </div>
        </div>
        <span className={cn('badge text-sm', getStatusColor(rental.status))}>{rental.status}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Customer</h2>
          <p className="text-sm font-medium text-gray-900">
            {rental.customer.first_name} {rental.customer.last_name}
          </p>
          <p className="text-sm text-gray-600">{rental.customer.email}</p>
          <p className="text-sm text-gray-600">{rental.customer.phone}</p>
        </div>

        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Vehicle</h2>
          <p className="text-sm font-medium text-gray-900">
            {rental.vehicle.brand} {rental.vehicle.model}
          </p>
          <p className="text-sm text-gray-600">{rental.vehicle.plate_number}</p>
        </div>

        <div className="card space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">Trip</h2>
          <p className="text-sm text-gray-700">Start: {formatDate(rental.start_date)}</p>
          <p className="text-sm text-gray-700">Planned End: {formatDate(rental.end_date)}</p>
          <p className="text-sm text-gray-700">
            Actual Return: {rental.actual_return_date ? formatDate(rental.actual_return_date) : 'Not returned'}
          </p>
          <p className="text-sm text-gray-700">Start Odometer: {rental.start_odometer}</p>
          <p className="text-sm text-gray-700">End Odometer: {rental.end_odometer ?? 'N/A'}</p>
          <p className="text-sm text-gray-700">Start Fuel: {rental.start_fuel}%</p>
          <p className="text-sm text-gray-700">End Fuel: {rental.end_fuel ?? 'N/A'}%</p>
        </div>

        {!isDriver && (
          <div className="card space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">Cost</h2>
            <p className="text-sm text-gray-700">Base: {formatCurrency(rental.base_cost)}</p>
            <p className="text-sm text-gray-700">Late Fee: {formatCurrency(rental.late_fee)}</p>
            <p className="text-sm text-gray-700">Mileage Fee: {formatCurrency(rental.mileage_fee)}</p>
            <p className="text-sm text-gray-700">Damage Cost: {formatCurrency(rental.damage_cost)}</p>
            <p className="text-base font-semibold text-gray-900">Total: {formatCurrency(rental.total_cost)}</p>
          </div>
        )}

        <div className="card space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">Locations</h2>
          <p className="text-sm text-gray-700">Pickup: {parseLocations(rental.booking?.notes).pickup}</p>
          <p className="text-sm text-gray-700">Drop-off: {parseLocations(rental.booking?.notes).dropoff}</p>
        </div>
      </div>

      {!isDriver && rental.status === 'ACTIVE' && (
        <button onClick={handleEndRental} className="btn btn-primary flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          End Rental
        </button>
      )}
    </div>
  )
}
