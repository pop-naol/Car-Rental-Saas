'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

const maintenanceSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  type: z.string().min(1, 'Type is required'),
  description: z.string().min(1, 'Description is required'),
  cost: z.number().min(0, 'Cost must be positive'),
  date: z.string().min(1, 'Date is required'),
  performedBy: z.string().min(1, 'Performed by is required'),
  nextMaintenanceDate: z.string().optional(),
  nextMaintenanceOdometer: z.number().optional(),
})

type MaintenanceFormData = z.infer<typeof maintenanceSchema>

interface MaintenanceFormProps {
  onSubmit: (data: MaintenanceFormData) => Promise<void>
  onClose: () => void
  isLoading?: boolean
}

export function MaintenanceForm({ onSubmit, onClose, isLoading }: MaintenanceFormProps) {
  const [vehicles, setVehicles] = useState<any[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
  })

  useEffect(() => {
    loadVehicles()
  }, [])

  const loadVehicles = async () => {
    try {
      const data = await api.get<{ vehicles: any[] }>('/vehicles')
      setVehicles(data.vehicles)
    } catch (error) {
      console.error('Failed to load vehicles:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Log Maintenance</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Maintenance Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle <span className="text-red-500">*</span>
                </label>
                <select {...register('vehicleId')} className="input">
                  <option value="">Select Vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.brand} {vehicle.model} - {vehicle.plate_number}
                    </option>
                  ))}
                </select>
                {errors.vehicleId && <p className="mt-1 text-sm text-red-600">{errors.vehicleId.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type <span className="text-red-500">*</span>
                </label>
                <input {...register('type')} type="text" className="input" placeholder="Oil Change" />
                {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <input {...register('date')} type="datetime-local" className="input" />
                {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea {...register('description')} rows={3} className="input" />
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost ($) <span className="text-red-500">*</span>
                </label>
                <input {...register('cost', { valueAsNumber: true })} type="number" step="0.01" className="input" />
                {errors.cost && <p className="mt-1 text-sm text-red-600">{errors.cost.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Performed By <span className="text-red-500">*</span>
                </label>
                <input {...register('performedBy')} type="text" className="input" placeholder="John's Auto Shop" />
                {errors.performedBy && <p className="mt-1 text-sm text-red-600">{errors.performedBy.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Next Maintenance Date</label>
                <input {...register('nextMaintenanceDate')} type="date" className="input" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Next Maintenance Odometer</label>
                <input {...register('nextMaintenanceOdometer', { valueAsNumber: true })} type="number" className="input" />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Log Maintenance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
