'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

const bookingSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  vehicleId: z.string().min(1, 'Vehicle is required'),
  driverId: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  estimatedCost: z.number().min(0, 'Cost must be positive'),
  pickupLocationType: z.enum(['OFFICE', 'BRANCH_A', 'CUSTOM']),
  pickupLocationLabel: z.string().optional(),
  dropoffLocation: z.string().optional(),
  notes: z.string().optional(),
})

type BookingFormData = z.infer<typeof bookingSchema>

interface BookingFormProps {
  onSubmit: (data: BookingFormData) => Promise<void>
  onClose: () => void
  isLoading?: boolean
  initialValues?: Partial<BookingFormData>
}

export function BookingForm({ onSubmit, onClose, isLoading, initialValues }: BookingFormProps) {
  const [customers, setCustomers] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    watch,
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      pickupLocationType: 'OFFICE',
      ...initialValues,
    },
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [customersData, vehiclesData, driversData] = await Promise.all([
        api.get<{ customers: any[] }>('/customers'),
        api.get<{ vehicles: any[] }>('/vehicles?status=AVAILABLE'),
        api.get<{ drivers: any[] }>('/drivers?isActive=true'),
      ])
      setCustomers(customersData.customers)
      setVehicles(vehiclesData.vehicles)
      setDrivers(driversData.drivers)
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  const selectedVehicle = vehicles.find((v) => v.id === watch('vehicleId'))
  const startDate = watch('startDate')
  const endDate = watch('endDate')

  useEffect(() => {
    if (selectedVehicle && startDate && endDate) {
      const days = Math.ceil(
        (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
      )
      const cost = days * Number(selectedVehicle.daily_rate)
      if (Number.isFinite(cost) && cost >= 0) {
        setValue('estimatedCost', Number(cost.toFixed(2)))
      }
    }
  }, [selectedVehicle, startDate, endDate, setValue])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">New Booking</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer <span className="text-red-500">*</span>
                </label>
                <select {...register('customerId')} className="input">
                  <option value="">Select Customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.first_name} {customer.last_name} - {customer.email}
                    </option>
                  ))}
                </select>
                {errors.customerId && <p className="mt-1 text-sm text-red-600">{errors.customerId.message}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle <span className="text-red-500">*</span>
                </label>
                <select {...register('vehicleId')} className="input">
                  <option value="">Select Vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.brand} {vehicle.model} - {vehicle.plate_number} (${vehicle.daily_rate}/day)
                    </option>
                  ))}
                </select>
                {errors.vehicleId && <p className="mt-1 text-sm text-red-600">{errors.vehicleId.message}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Driver (Optional)</label>
                <select {...register('driverId')} className="input">
                  <option value="">No Driver</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.first_name} {driver.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input {...register('startDate')} type="datetime-local" className="input" />
                {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input {...register('endDate')} type="datetime-local" className="input" />
                {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Cost ($) <span className="text-red-500">*</span>
                </label>
                <input {...register('estimatedCost', { valueAsNumber: true })} type="number" step="0.01" className="input" />
                {errors.estimatedCost && <p className="mt-1 text-sm text-red-600">{errors.estimatedCost.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pickup Location <span className="text-red-500">*</span>
                </label>
                <select {...register('pickupLocationType')} className="input">
                  <option value="OFFICE">Office</option>
                  <option value="BRANCH_A">Branch A</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Label</label>
                <input {...register('pickupLocationLabel')} type="text" className="input" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Drop-off Location</label>
                <input {...register('dropoffLocation')} type="text" className="input" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea {...register('notes')} rows={3} className="input" />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
