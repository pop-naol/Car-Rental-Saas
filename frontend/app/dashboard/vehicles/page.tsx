'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { formatCurrency, getStatusColor, cn } from '@/lib/utils'
import { Plus, Search, Filter, Edit, Trash2, Car, Eye, X } from 'lucide-react'
import { toast } from 'sonner'
import { VehicleForm } from '@/components/vehicles/VehicleForm'
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
  branch?: {
    name: string
  }
}

export default function VehiclesPage() {
  const { user } = useAuthStore()
  const canManageVehicles = user?.role === 'SUPER_ADMIN' || user?.role === 'COMPANY_MANAGER'
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [fuelTypeFilter, setFuelTypeFilter] = useState('ALL')
  const [transmissionFilter, setTransmissionFilter] = useState('ALL')
  const [showFilters, setShowFilters] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadVehicles()
  }, [])

  const loadVehicles = async () => {
    try {
      const data = await api.get<{ vehicles: Vehicle[] }>('/vehicles')
      setVehicles(data.vehicles)
    } catch (error) {
      toast.error('Failed to load vehicles')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddVehicle = async (data: any) => {
    setIsSubmitting(true)
    try {
      // Use demo company and branch IDs
      const DEMO_COMPANY_ID = '00000000-0000-0000-0000-000000000001'
      const DEMO_BRANCH_ID = '00000000-0000-0000-0000-000000000002'

      await api.post('/vehicles', {
        companyId: DEMO_COMPANY_ID,
        branchId: DEMO_BRANCH_ID,
        vin: data.vin,
        plateNumber: data.plateNumber,
        brand: data.brand,
        model: data.model,
        year: data.year,
        fuelType: data.fuelType,
        transmission: data.transmission,
        status: data.status || 'AVAILABLE',
        dailyRate: data.dailyRate,
        weeklyRate: data.weeklyRate,
        monthlyRate: data.monthlyRate,
        currentOdometer: data.currentOdometer || 0,
        currentFuel: data.currentFuel || 100,
        purchaseCost: data.purchaseCost,
        color: data.color,
        seats: data.seats,
      })
      toast.success('Vehicle added successfully')
      setShowForm(false)
      loadVehicles()
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || 'Failed to add vehicle'
      toast.error(errorMessage)
      console.error('Add vehicle error:', error.response?.data)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditVehicle = async (data: any) => {
    if (!editingVehicle) return
    setIsSubmitting(true)
    try {
      await api.patch(`/vehicles/${editingVehicle.id}`, {
        plateNumber: data.plateNumber,
        brand: data.brand,
        model: data.model,
        year: data.year,
        fuelType: data.fuelType,
        transmission: data.transmission,
        status: data.status,
        dailyRate: data.dailyRate,
        weeklyRate: data.weeklyRate,
        monthlyRate: data.monthlyRate,
        currentOdometer: data.currentOdometer,
        currentFuel: data.currentFuel,
        purchaseCost: data.purchaseCost,
        color: data.color,
        seats: data.seats,
      })
      toast.success('Vehicle updated successfully')
      setEditingVehicle(null)
      loadVehicles()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update vehicle')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteVehicle = async () => {
    if (!deletingVehicle) return
    try {
      await api.delete(`/vehicles/${deletingVehicle.id}`)
      toast.success('Vehicle deleted successfully')
      setDeletingVehicle(null)
      loadVehicles()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete vehicle')
    }
  }

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.plate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.vin.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'ALL' || vehicle.status === statusFilter
    const matchesFuelType = fuelTypeFilter === 'ALL' || vehicle.fuel_type === fuelTypeFilter
    const matchesTransmission =
      transmissionFilter === 'ALL' || vehicle.transmission === transmissionFilter

    return matchesSearch && matchesStatus && matchesFuelType && matchesTransmission
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vehicles</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your fleet of {vehicles.length} vehicles
          </p>
        </div>
        {canManageVehicles && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Add Vehicle
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="ALL">All Status</option>
            <option value="AVAILABLE">Available</option>
            <option value="RESERVED">Reserved</option>
            <option value="RENTED">Rented</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="OUT_OF_SERVICE">Out of Service</option>
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary flex items-center justify-center"
          >
            <Filter className="h-5 w-5 mr-2" />
            {showFilters ? 'Hide Filters' : 'More Filters'}
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 gap-4 md:grid-cols-2">
            <select
              value={fuelTypeFilter}
              onChange={(e) => setFuelTypeFilter(e.target.value)}
              className="input"
            >
              <option value="ALL">All Fuel Types</option>
              <option value="Gasoline">Gasoline</option>
              <option value="Diesel">Diesel</option>
              <option value="Electric">Electric</option>
              <option value="Hybrid">Hybrid</option>
            </select>

            <select
              value={transmissionFilter}
              onChange={(e) => setTransmissionFilter(e.target.value)}
              className="input"
            >
              <option value="ALL">All Transmissions</option>
              <option value="Automatic">Automatic</option>
              <option value="Manual">Manual</option>
            </select>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
        {['AVAILABLE', 'RESERVED', 'RENTED', 'MAINTENANCE', 'OUT_OF_SERVICE'].map((status) => {
          const count = vehicles.filter((v) => v.status === status).length
          return (
            <div key={status} className="card">
              <p className="text-sm font-medium text-gray-600">{status.replace('_', ' ')}</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{count}</p>
            </div>
          )
        })}
      </div>

      {/* Vehicle Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredVehicles.map((vehicle) => (
          <div key={vehicle.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center">
                  <Car className="h-5 w-5 text-gray-400 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {vehicle.brand} {vehicle.model}
                  </h3>
                </div>
                <p className="mt-1 text-sm text-gray-500">{vehicle.year}</p>
              </div>
              <span className={cn('badge', getStatusColor(vehicle.status))}>
                {vehicle.status}
              </span>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Plate:</span>
                <span className="font-medium text-gray-900">{vehicle.plate_number}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">VIN:</span>
                <span className="font-mono text-xs text-gray-900">{vehicle.vin}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Fuel:</span>
                <span className="text-gray-900">{vehicle.fuel_type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Transmission:</span>
                <span className="text-gray-900">{vehicle.transmission}</span>
              </div>
              {vehicle.branch && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Branch:</span>
                  <span className="text-gray-900">{vehicle.branch.name}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Daily Rate</p>
                  <p className="text-xl font-bold text-primary-600">
                    {formatCurrency(vehicle.daily_rate)}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Link
                    href={`/dashboard/vehicles/${vehicle.id}`}
                    className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <Eye className="h-5 w-5" />
                  </Link>
                  {canManageVehicles && (
                    <>
                      <button
                        onClick={() => setEditingVehicle(vehicle)}
                        className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setDeletingVehicle(vehicle)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredVehicles.length === 0 && (
        <div className="text-center py-12">
          <Car className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No vehicles found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== 'ALL'
              ? 'Try adjusting your filters'
              : 'Get started by adding a new vehicle'}
          </p>
        </div>
      )}

      {/* Add/Edit Vehicle Form */}
      {canManageVehicles && (showForm || editingVehicle) && (
        <VehicleForm
          vehicle={editingVehicle}
          onSubmit={editingVehicle ? handleEditVehicle : handleAddVehicle}
          onClose={() => {
            setShowForm(false)
            setEditingVehicle(null)
          }}
          isLoading={isSubmitting}
        />
      )}

      {/* Delete Confirmation Modal */}
      {canManageVehicles && deletingVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Delete Vehicle</h3>
              <button
                onClick={() => setDeletingVehicle(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete{' '}
              <span className="font-semibold">
                {deletingVehicle.brand} {deletingVehicle.model}
              </span>{' '}
              ({deletingVehicle.plate_number})? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeletingVehicle(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button onClick={handleDeleteVehicle} className="btn bg-red-600 hover:bg-red-700 text-white">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
