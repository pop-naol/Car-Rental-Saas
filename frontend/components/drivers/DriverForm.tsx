'use client'

import { ChangeEvent, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'

const driverSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().optional().refine((value) => !value || value.length >= 8, {
    message: 'Password must be at least 8 characters',
  }),
  phone: z.string().min(1, 'Phone is required'),
  licenseNumber: z.string().min(1, 'License number is required'),
  licenseExpiry: z.string().min(1, 'License expiry is required'),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  photoUrl: z.string().optional(),
  status: z.enum(['ACTIVE', 'ON_TRIP', 'INACTIVE']),
  isActive: z.boolean().optional(),
})

type DriverFormData = z.infer<typeof driverSchema>

interface DriverFormProps {
  driver?: any
  onSubmit: (data: DriverFormData) => Promise<void>
  onClose: () => void
  isLoading?: boolean
}

export function DriverForm({ driver, onSubmit, onClose, isLoading }: DriverFormProps) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
  const toPhotoSrc = (value?: string | null) =>
    value && value.startsWith('/uploads') ? `${API_URL}${value}` : value || ''

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
    defaultValues: driver
      ? {
          firstName: driver.first_name,
          lastName: driver.last_name,
          email: driver.email,
          password: '',
          phone: driver.phone,
          licenseNumber: driver.license_number,
          licenseExpiry: driver.license_expiry?.split('T')[0],
          dateOfBirth: driver.date_of_birth?.split('T')[0],
          address: driver.address,
          photoUrl: toPhotoSrc(driver.photo_url),
          status: driver.status || (driver.is_active ? 'ACTIVE' : 'INACTIVE'),
          isActive: driver.is_active,
        }
      : { isActive: true, photoUrl: '', status: 'ACTIVE', email: '', password: '' },
  })

  const currentPhotoUrl = watch('photoUrl')
  const [photoPreview, setPhotoPreview] = useState<string>(currentPhotoUrl || '')

  useEffect(() => {
    setPhotoPreview(currentPhotoUrl || '')
  }, [currentPhotoUrl])

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      return
    }

    const maxBytes = 2 * 1024 * 1024
    if (file.size > maxBytes) {
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const value = typeof reader.result === 'string' ? reader.result : ''
      setValue('photoUrl', value, { shouldDirty: true })
    }
    reader.readAsDataURL(file)
  }

  const clearPhoto = () => {
    setValue('photoUrl', '', { shouldDirty: true })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {driver ? 'Edit Driver' : 'Add New Driver'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <input type="hidden" {...register('photoUrl')} />

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Photo</h3>
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                {photoPreview ? (
                  <img src={photoPreview} alt="Driver profile" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs text-gray-500">
                    No photo
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="input" />
                {photoPreview && (
                  <button type="button" onClick={clearPhoto} className="btn btn-secondary">
                    Remove Photo
                  </button>
                )}
                <p className="text-xs text-gray-500">Upload JPG/PNG/WebP, up to 2MB.</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input {...register('firstName')} type="text" className="input" />
                {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input {...register('lastName')} type="text" className="input" />
                {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input {...register('email')} type="email" className="input" required />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {driver ? 'New Password (Optional)' : 'Password'}
                </label>
                <input
                  {...register('password')}
                  type="password"
                  className="input"
                  required={!driver}
                  minLength={8}
                />
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input {...register('phone')} type="tel" className="input" />
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input {...register('dateOfBirth')} type="date" className="input" />
                {errors.dateOfBirth && <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input {...register('address')} type="text" className="input" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">License Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Number <span className="text-red-500">*</span>
                </label>
                <input {...register('licenseNumber')} type="text" className="input" />
                {errors.licenseNumber && <p className="mt-1 text-sm text-red-600">{errors.licenseNumber.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Expiry <span className="text-red-500">*</span>
                </label>
                <input {...register('licenseExpiry')} type="date" className="input" />
                {errors.licenseExpiry && <p className="mt-1 text-sm text-red-600">{errors.licenseExpiry.message}</p>}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select {...register('status')} className="input">
              <option value="ACTIVE">Active</option>
              <option value="ON_TRIP">On Trip</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Saving...' : driver ? 'Update Driver' : 'Add Driver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
