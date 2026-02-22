'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { formatDate, cn } from '@/lib/utils'
import { Plus, Search, Edit, Trash2, UserCheck, Eye, Star } from 'lucide-react'
import { toast } from 'sonner'
import { DriverForm } from '@/components/drivers/DriverForm'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'

interface Driver {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone: string
  license_number: string
  license_expiry: string
  photo_url?: string | null
  status?: 'ACTIVE' | 'ON_TRIP' | 'INACTIVE'
  is_active: boolean
  total_trips: number
  average_rating: number
  performance_score: number
}

const getDriverStatus = (driver: Driver): 'ACTIVE' | 'ON_TRIP' | 'INACTIVE' =>
  driver.status || (driver.is_active ? 'ACTIVE' : 'INACTIVE')

export default function DriversPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
  const toPhotoSrc = (value?: string | null) => {
    if (!value) return ''
    const normalized = value.replace(/\\/g, '/')
    const uploadsIndex = normalized.indexOf('/uploads/')
    if (uploadsIndex >= 0) {
      return `${API_URL}${normalized.substring(uploadsIndex)}`
    }
    const altUploadsIndex = normalized.indexOf('uploads/')
    if (altUploadsIndex >= 0) {
      return `${API_URL}/${normalized.substring(altUploadsIndex)}`
    }
    if (normalized.startsWith('http://') || normalized.startsWith('https://')) return normalized
    if (normalized.startsWith('/uploads')) return `${API_URL}${normalized}`
    if (normalized.startsWith('uploads/')) return `${API_URL}/${normalized}`
    return normalized
  }

  const { user } = useAuthStore()
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showForm, setShowForm] = useState(false)
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)
  const [deletingDriver, setDeletingDriver] = useState<Driver | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check if user has admin permissions
  const canManageDrivers = user?.role === 'SUPER_ADMIN' || user?.role === 'COMPANY_MANAGER'

  useEffect(() => {
    loadDrivers()
  }, [])

  const loadDrivers = async () => {
    try {
      const data = await api.get<{ drivers: Driver[] }>('/drivers')
      setDrivers(data.drivers)
    } catch (error) {
      toast.error('Failed to load drivers')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddDriver = async (data: any) => {
    setIsSubmitting(true)
    try {
      const DEMO_COMPANY_ID = '00000000-0000-0000-0000-000000000001'
      
      await api.post('/drivers', {
        companyId: DEMO_COMPANY_ID,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        phone: data.phone,
        licenseNumber: data.licenseNumber,
        licenseExpiry: new Date(data.licenseExpiry).toISOString(),
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : undefined,
        address: data.address,
        photoUrl: data.photoUrl,
        status: data.status,
      })
      toast.success('Driver added successfully')
      setShowForm(false)
      loadDrivers()
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to add driver')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditDriver = async (data: any) => {
    if (!editingDriver) return
    setIsSubmitting(true)
    try {
      await api.patch(`/drivers/${editingDriver.id}`, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password || undefined,
        phone: data.phone,
        licenseNumber: data.licenseNumber,
        licenseExpiry: new Date(data.licenseExpiry).toISOString(),
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : undefined,
        address: data.address,
        photoUrl: data.photoUrl,
        status: data.status,
        isActive: data.isActive,
      })
      toast.success('Driver updated successfully')
      setEditingDriver(null)
      loadDrivers()
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to update driver')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteDriver = async () => {
    if (!deletingDriver) return
    try {
      await api.delete(`/drivers/${deletingDriver.id}`)
      toast.success('Driver deleted successfully')
      setDeletingDriver(null)
      loadDrivers()
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to delete driver')
    }
  }

  const filteredDrivers = drivers.filter((driver) => {
    const matchesSearch =
      driver.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (driver.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.phone.includes(searchTerm)

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && getDriverStatus(driver) === 'ACTIVE') ||
      (statusFilter === 'ON_TRIP' && getDriverStatus(driver) === 'ON_TRIP') ||
      (statusFilter === 'INACTIVE' && getDriverStatus(driver) === 'INACTIVE')

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
          <h1 className="text-3xl font-bold text-gray-900">Drivers</h1>
          <p className="mt-2 text-sm text-gray-600">Manage your {drivers.length} drivers</p>
        </div>
        {canManageDrivers && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Add Driver
          </button>
        )}
      </div>

      <div className="card">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search drivers..."
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
            <option value="ALL">All Drivers</option>
            <option value="ACTIVE">Active Only</option>
            <option value="ON_TRIP">On Trip Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-sm font-medium text-gray-600">Total Drivers</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{drivers.length}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-600">Active</p>
          <p className="mt-2 text-2xl font-semibold text-green-600">
            {drivers.filter((d) => getDriverStatus(d) === 'ACTIVE' || getDriverStatus(d) === 'ON_TRIP').length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-600">Avg Rating</p>
          <p className="mt-2 text-2xl font-semibold text-yellow-600">
            {(drivers.reduce((acc, d) => acc + Number(d.average_rating), 0) / drivers.length || 0).toFixed(1)}
          </p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">License</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDrivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {driver.photo_url ? (
                        <img
                          src={toPhotoSrc(driver.photo_url)}
                          alt={`${driver.first_name} ${driver.last_name}`}
                          className="flex-shrink-0 h-10 w-10 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <UserCheck className="h-5 w-5 text-primary-600" />
                        </div>
                      )}
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {driver.first_name} {driver.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{driver.email || 'No email'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{driver.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{driver.license_number}</div>
                    <div className="text-sm text-gray-500">Exp: {formatDate(driver.license_expiry)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className="text-sm font-medium text-gray-900">
                        {Number(driver.average_rating).toFixed(1)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">{driver.total_trips} trips</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getDriverStatus(driver) === 'ON_TRIP' ? (
                      <span className="badge bg-blue-100 text-blue-800">On Trip</span>
                    ) : getDriverStatus(driver) === 'INACTIVE' ? (
                      <span className="badge bg-gray-100 text-gray-800">Inactive</span>
                    ) : (
                      <span className="badge bg-green-100 text-green-800">Active</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Link href={`/dashboard/drivers/${driver.id}`} className="text-gray-600 hover:text-primary-600">
                        <Eye className="h-5 w-5" />
                      </Link>
                      {canManageDrivers && (
                        <>
                          <button onClick={() => setEditingDriver(driver)} className="text-gray-600 hover:text-primary-600">
                            <Edit className="h-5 w-5" />
                          </button>
                          <button onClick={() => setDeletingDriver(driver)} className="text-gray-600 hover:text-red-600">
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDrivers.length === 0 && (
          <div className="text-center py-12">
            <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No drivers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search' : 'Get started by adding a new driver'}
            </p>
          </div>
        )}
      </div>

      {(showForm || editingDriver) && (
        <DriverForm
          driver={editingDriver}
          onSubmit={editingDriver ? handleEditDriver : handleAddDriver}
          onClose={() => {
            setShowForm(false)
            setEditingDriver(null)
          }}
          isLoading={isSubmitting}
        />
      )}

      {deletingDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Driver</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete{' '}
              <span className="font-semibold">
                {deletingDriver.first_name} {deletingDriver.last_name}
              </span>
              ?
            </p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setDeletingDriver(null)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleDeleteDriver} className="btn bg-red-600 hover:bg-red-700 text-white">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
