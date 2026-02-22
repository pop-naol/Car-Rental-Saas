'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { ArrowLeft, Phone, BadgeCheck, Star, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface DriverDetails {
  id: string
  company_id: string
  first_name: string
  last_name: string
  phone: string
  license_number: string
  license_expiry: string
  photo_url?: string | null
  status?: 'ACTIVE' | 'ON_TRIP' | 'INACTIVE'
  is_active: boolean
  total_trips: number
  average_rating: number
  on_time_percentage: number
  incidents_count: number
  performance_score: number
  created_at: string
  updated_at: string
}

export default function DriverDetailsPage() {
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

  const params = useParams()
  const router = useRouter()
  const [driver, setDriver] = useState<DriverDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [photoError, setPhotoError] = useState(false)
  const status = driver?.status || (driver?.is_active ? 'ACTIVE' : 'INACTIVE')

  useEffect(() => {
    if (!params?.id) return
    const id = Array.isArray(params.id) ? params.id[0] : params.id
    if (!id) return
    loadDriver(id)
  }, [params.id])

  useEffect(() => {
    setPhotoError(false)
  }, [driver?.photo_url])

  const loadDriver = async (id: string) => {
    try {
      const data = await api.get<{ driver: DriverDetails }>(`/drivers/${id}`)
      setDriver(data.driver)
    } catch (error) {
      toast.error('Failed to load driver profile')
      router.push('/dashboard/drivers')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!driver) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/drivers" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Driver Profile</h1>
          <p className="mt-1 text-sm text-gray-600">Detailed information and performance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            {driver.photo_url && !photoError ? (
              <img
                src={toPhotoSrc(driver.photo_url)}
                alt={`${driver.first_name} ${driver.last_name}`}
                className="h-36 w-36 rounded-full object-cover border border-gray-200"
                onError={() => setPhotoError(true)}
              />
            ) : (
              <div className="h-36 w-36 rounded-full bg-primary-100 border border-gray-200 flex items-center justify-center text-primary-700 text-4xl font-bold">
                {driver.first_name.charAt(0)}
                {driver.last_name.charAt(0)}
              </div>
            )}
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              {driver.first_name} {driver.last_name}
            </h2>
            <span
              className={`mt-2 badge ${
                status === 'ON_TRIP'
                  ? 'bg-blue-100 text-blue-800'
                  : status === 'INACTIVE'
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-green-100 text-green-800'
              }`}
            >
              {status === 'ON_TRIP' ? 'On Trip' : status === 'INACTIVE' ? 'Inactive' : 'Active'}
            </span>
          </div>
        </div>

        <div className="card lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact & License</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-1 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{driver.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <BadgeCheck className="h-4 w-4 mt-1 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">License Number</p>
                  <p className="text-sm font-medium text-gray-900">{driver.license_number}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">License Expiry</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(driver.license_expiry)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Profile Updated</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(driver.updated_at)}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Performance</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-gray-500">Trips</p>
                <p className="text-xl font-semibold text-gray-900">{driver.total_trips}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-gray-500">Rating</p>
                <p className="text-xl font-semibold text-gray-900 flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  {Number(driver.average_rating).toFixed(1)}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-gray-500">On-Time %</p>
                <p className="text-xl font-semibold text-gray-900">
                  {Number(driver.on_time_percentage).toFixed(1)}%
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-gray-500">Incidents</p>
                <p className="text-xl font-semibold text-gray-900 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  {driver.incidents_count}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
