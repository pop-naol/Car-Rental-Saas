'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft, Ban, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface CustomerDetails {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  address: string
  license_number: string
  license_expiry: string
  date_of_birth: string
  id_number?: string | null
  is_blacklisted: boolean
  loyalty_level: string
  risk_score: number
  total_spending: number
  _count?: {
    bookings: number
    rentals: number
  }
}

export default function CustomerDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [customer, setCustomer] = useState<CustomerDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (params.id) loadCustomer()
  }, [params.id])

  const loadCustomer = async () => {
    try {
      const data = await api.get<{ customer: CustomerDetails }>(`/customers/${params.id}`)
      setCustomer(data.customer)
    } catch {
      toast.error('Failed to load customer details')
      router.push('/dashboard/customers')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleBlacklist = async () => {
    if (!customer) return
    try {
      if (customer.is_blacklisted) {
        await api.patch(`/customers/${customer.id}/remove-blacklist`, {})
        toast.success('Customer removed from blacklist')
      } else {
        await api.patch(`/customers/${customer.id}/blacklist`, {})
        toast.success('Customer blacklisted')
      }
      loadCustomer()
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to update blacklist status')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!customer) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/customers" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customer Profile</h1>
            <p className="mt-1 text-sm text-gray-600">
              {customer.first_name} {customer.last_name}
            </p>
          </div>
        </div>

        <button
          onClick={handleToggleBlacklist}
          className={`btn flex items-center ${
            customer.is_blacklisted
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          {customer.is_blacklisted ? (
            <>
              <CheckCircle className="h-5 w-5 mr-2" />
              Remove Blacklist
            </>
          ) : (
            <>
              <Ban className="h-5 w-5 mr-2" />
              Blacklist
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">Contact</h2>
          <p className="text-sm text-gray-700">{customer.email}</p>
          <p className="text-sm text-gray-700">{customer.phone}</p>
          <p className="text-sm text-gray-700">{customer.address}</p>
        </div>

        <div className="card space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">License</h2>
          <p className="text-sm text-gray-700">Number: {customer.license_number}</p>
          <p className="text-sm text-gray-700">Expiry: {formatDate(customer.license_expiry)}</p>
          <p className="text-sm text-gray-700">DOB: {formatDate(customer.date_of_birth)}</p>
          {customer.id_number && <p className="text-sm text-gray-700">ID: {customer.id_number}</p>}
        </div>

        <div className="card space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">Business</h2>
          <p className="text-sm text-gray-700">Loyalty: {customer.loyalty_level}</p>
          <p className="text-sm text-gray-700">Risk Score: {customer.risk_score}</p>
          <p className="text-sm text-gray-700">Total Spending: {formatCurrency(customer.total_spending)}</p>
          <p className="text-sm text-gray-700">Bookings: {customer._count?.bookings || 0}</p>
          <p className="text-sm text-gray-700">Rentals: {customer._count?.rentals || 0}</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Status</h2>
          <span
            className={`badge ${
              customer.is_blacklisted ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
            }`}
          >
            {customer.is_blacklisted ? 'Blacklisted' : 'Active'}
          </span>
        </div>
      </div>
    </div>
  )
}
