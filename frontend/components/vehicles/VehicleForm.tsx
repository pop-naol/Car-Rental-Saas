'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'

const vehicleSchema = z.object({
  vin: z.string().min(17, 'VIN must be 17 characters').max(17, 'VIN must be 17 characters'),
  plateNumber: z.string().min(1, 'Plate number is required'),
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  fuelType: z.enum(['Gasoline', 'Diesel', 'Electric', 'Hybrid']),
  transmission: z.enum(['Automatic', 'Manual']),
  status: z.enum(['AVAILABLE', 'RESERVED', 'RENTED', 'MAINTENANCE', 'OUT_OF_SERVICE']).optional(),
  dailyRate: z.number().min(0, 'Daily rate must be positive'),
  weeklyRate: z.number().min(0, 'Weekly rate must be positive'),
  monthlyRate: z.number().min(0, 'Monthly rate must be positive'),
  currentOdometer: z.number().min(0, 'Odometer must be positive'),
  currentFuel: z.number().min(0).max(100, 'Fuel must be between 0 and 100'),
  purchaseCost: z.number().min(0, 'Purchase cost must be positive').optional(),
  color: z.string().optional(),
  seats: z.number().min(1).max(50).optional(),
})

type VehicleFormData = z.infer<typeof vehicleSchema>

interface VehicleFormProps {
  vehicle?: any
  onSubmit: (data: VehicleFormData) => Promise<void>
  onClose: () => void
  isLoading?: boolean
}

export function VehicleForm({ vehicle, onSubmit, onClose, isLoading }: VehicleFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: vehicle
      ? {
          vin: vehicle.vin,
          plateNumber: vehicle.plate_number,
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year,
          fuelType: vehicle.fuel_type,
          transmission: vehicle.transmission,
          status: vehicle.status,
          dailyRate: Number(vehicle.daily_rate),
          weeklyRate: Number(vehicle.weekly_rate),
          monthlyRate: Number(vehicle.monthly_rate),
          currentOdometer: vehicle.current_odometer,
          currentFuel: vehicle.current_fuel,
          purchaseCost: vehicle.purchase_cost ? Number(vehicle.purchase_cost) : undefined,
          color: vehicle.color,
          seats: vehicle.seats,
        }
      : {
          year: new Date().getFullYear(),
          currentFuel: 100,
          currentOdometer: 0,
          status: 'AVAILABLE',
        },
  })

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {vehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  VIN <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('vin')}
                  type="text"
                  maxLength={17}
                  className="input"
                  placeholder="1HGBH41JXMN109186"
                />
                {errors.vin && (
                  <p className="mt-1 text-sm text-red-600">{errors.vin.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plate Number <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('plateNumber')}
                  type="text"
                  className="input"
                  placeholder="ABC-1234"
                />
                {errors.plateNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.plateNumber.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('brand')}
                  type="text"
                  className="input"
                  placeholder="Toyota"
                />
                {errors.brand && (
                  <p className="mt-1 text-sm text-red-600">{errors.brand.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('model')}
                  type="text"
                  className="input"
                  placeholder="Camry"
                />
                {errors.model && (
                  <p className="mt-1 text-sm text-red-600">{errors.model.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('year', { valueAsNumber: true })}
                  type="number"
                  className="input"
                  placeholder="2024"
                />
                {errors.year && (
                  <p className="mt-1 text-sm text-red-600">{errors.year.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <input
                  {...register('color')}
                  type="text"
                  className="input"
                  placeholder="Black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fuel Type <span className="text-red-500">*</span>
                </label>
                <select {...register('fuelType')} className="input">
                  <option value="Gasoline">Gasoline</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Electric">Electric</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
                {errors.fuelType && (
                  <p className="mt-1 text-sm text-red-600">{errors.fuelType.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transmission <span className="text-red-500">*</span>
                </label>
                <select {...register('transmission')} className="input">
                  <option value="Automatic">Automatic</option>
                  <option value="Manual">Manual</option>
                </select>
                {errors.transmission && (
                  <p className="mt-1 text-sm text-red-600">{errors.transmission.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select {...register('status')} className="input">
                  <option value="AVAILABLE">Available</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="RENTED">Rented</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="OUT_OF_SERVICE">Out of Service</option>
                </select>
                {errors.status && (
                  <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seats</label>
                <input
                  {...register('seats', { valueAsNumber: true })}
                  type="number"
                  className="input"
                  placeholder="5"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Daily Rate ($) <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('dailyRate', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  className="input"
                  placeholder="45.00"
                />
                {errors.dailyRate && (
                  <p className="mt-1 text-sm text-red-600">{errors.dailyRate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weekly Rate ($) <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('weeklyRate', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  className="input"
                  placeholder="280.00"
                />
                {errors.weeklyRate && (
                  <p className="mt-1 text-sm text-red-600">{errors.weeklyRate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Rate ($) <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('monthlyRate', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  className="input"
                  placeholder="1000.00"
                />
                {errors.monthlyRate && (
                  <p className="mt-1 text-sm text-red-600">{errors.monthlyRate.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Vehicle Status */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Odometer (km) <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('currentOdometer', { valueAsNumber: true })}
                  type="number"
                  className="input"
                  placeholder="5000"
                />
                {errors.currentOdometer && (
                  <p className="mt-1 text-sm text-red-600">{errors.currentOdometer.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fuel Level (%) <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('currentFuel', { valueAsNumber: true })}
                  type="number"
                  min="0"
                  max="100"
                  className="input"
                  placeholder="100"
                />
                {errors.currentFuel && (
                  <p className="mt-1 text-sm text-red-600">{errors.currentFuel.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Cost ($)
                </label>
                <input
                  {...register('purchaseCost', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  className="input"
                  placeholder="28000.00"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Saving...' : vehicle ? 'Update Vehicle' : 'Add Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
