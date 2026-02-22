'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, getStatusColor, cn } from '@/lib/utils'
import {
  ArrowLeft,
  Car,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  Gauge,
  Fuel,
  Settings,
  MapPin,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'

interface Vehicle {
  id: string
  vin: string
  plate_number: string
  brand: string
  model: string
  year: number
  status: string
  daily_rate: number
  weekly_rate: number
  monthly_rate: number
  fuel_type: string
  transmission: string
  current_odometer: number
  current_fuel: number
  color?: string
  seats?: number
  purchase_cost?: number
  total_revenue?: number
  created_at: string
  updated_at: string
  branch?: {
    id: string
    name: string
    address: string
  }
  company?: {
    id: string
    name: string
  }
  _count?: {
    rentals: number
    bookings: number
    maintenanceLogs: number
  }
}

export default function VehicleDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const canManageVehicles = user?.role === 'SUPER_ADMIN' || user?.role === 'COMPANY_MANAGER'
  const isEmployee = user?.role === 'EMPLOYEE'
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      loadVehicle()
    }
  }, [params.id])

  const loadVehicle = async () => {
    try {
      const data = await api.get<{ vehicle: Vehicle }>(`/vehicles/${params.id}`)
      setVehicle(data.vehicle)
    } catch (error) {
      toast.error('Failed to load vehicle details')
      router.push('/dashboard/vehicles')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!vehicle || !confirm(`Are you sure you want to delete ${vehicle.brand} ${vehicle.model}?`))
      return

    try {
      await api.delete(`/vehicles/${vehicle.id}`)
      toast.success('Vehicle deleted successfully')
      router.push('/dashboard/vehicles')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete vehicle')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!vehicle) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/vehicles"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {vehicle.brand} {vehicle.model}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {vehicle.year} • {vehicle.plate_number}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          {canManageVehicles && (
            <>
              <Link href="/dashboard/vehicles" className="btn btn-secondary flex items-center">
                <Edit className="h-5 w-5 mr-2" />
                Manage Fleet
              </Link>
              <button onClick={handleDelete} className="btn bg-red-600 hover:bg-red-700 text-white flex items-center">
                <Trash2 className="h-5 w-5 mr-2" />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div>
        <span className={cn('badge text-lg px-4 py-2', getStatusColor(vehicle.status))}>
          {vehicle.status}
        </span>
      </div>

      {/* Main Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vehicle Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Car className="h-5 w-5 mr-2 text-primary-600" />
              Vehicle Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">VIN</p>
                <p className="mt-1 font-mono text-sm font-medium text-gray-900">{vehicle.vin}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Plate Number</p>
                <p className="mt-1 font-medium text-gray-900">{vehicle.plate_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Brand</p>
                <p className="mt-1 font-medium text-gray-900">{vehicle.brand}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Model</p>
                <p className="mt-1 font-medium text-gray-900">{vehicle.model}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Year</p>
                <p className="mt-1 font-medium text-gray-900">{vehicle.year}</p>
              </div>
              {vehicle.color && (
                <div>
                  <p className="text-sm text-gray-600">Color</p>
                  <p className="mt-1 font-medium text-gray-900">{vehicle.color}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Fuel Type</p>
                <p className="mt-1 font-medium text-gray-900">{vehicle.fuel_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Transmission</p>
                <p className="mt-1 font-medium text-gray-900">{vehicle.transmission}</p>
              </div>
              {vehicle.seats && (
                <div>
                  <p className="text-sm text-gray-600">Seats</p>
                  <p className="mt-1 font-medium text-gray-900">{vehicle.seats}</p>
                </div>
              )}
            </div>
          </div>

          {/* Current Status */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Settings className="h-5 w-5 mr-2 text-primary-600" />
              Current Status
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <Gauge className="h-4 w-4 mr-1" />
                  Odometer
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {vehicle.current_odometer.toLocaleString()} km
                </p>
              </div>
              <div>
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <Fuel className="h-4 w-4 mr-1" />
                  Fuel Level
                </div>
                <p className="text-2xl font-bold text-gray-900">{vehicle.current_fuel}%</p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: `${vehicle.current_fuel}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-primary-600" />
              Pricing
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Daily Rate</p>
                <p className="mt-1 text-2xl font-bold text-primary-600">
                  {formatCurrency(vehicle.daily_rate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Weekly Rate</p>
                <p className="mt-1 text-2xl font-bold text-primary-600">
                  {formatCurrency(vehicle.weekly_rate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Monthly Rate</p>
                <p className="mt-1 text-2xl font-bold text-primary-600">
                  {formatCurrency(vehicle.monthly_rate)}
                </p>
              </div>
            </div>
          </div>

          {/* Location */}
          {vehicle.branch && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-primary-600" />
                Location
              </h2>
              <div>
                <p className="font-medium text-gray-900">{vehicle.branch.name}</p>
                <p className="mt-1 text-sm text-gray-600">{vehicle.branch.address}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Statistics */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Total Rentals</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {vehicle._count?.rentals || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Bookings</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {vehicle._count?.bookings || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Maintenance Records</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {vehicle._count?.maintenanceLogs || 0}
                </p>
              </div>
              {vehicle.total_revenue !== undefined && (
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="mt-1 text-3xl font-bold text-primary-600">
                    {formatCurrency(vehicle.total_revenue)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Financial Info */}
          {vehicle.purchase_cost && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial</h2>
              <div>
                <p className="text-sm text-gray-600">Purchase Cost</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {formatCurrency(vehicle.purchase_cost)}
                </p>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-primary-600" />
              Timeline
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Added</p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {formatDate(vehicle.created_at)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {formatDate(vehicle.updated_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                href={`/dashboard/bookings?vehicleId=${vehicle.id}`}
                className="btn btn-primary w-full justify-center"
              >
                Create Booking
              </Link>
              {!isEmployee && (
                <Link
                  href={`/dashboard/maintenance?vehicleId=${vehicle.id}`}
                  className="btn btn-secondary w-full justify-center"
                >
                  Log Maintenance
                </Link>
              )}
              <Link
                href={`/dashboard/rentals?vehicleId=${vehicle.id}`}
                className="btn btn-secondary w-full justify-center flex items-center"
              >
                <FileText className="h-4 w-4 mr-2" />
                View Rentals
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
