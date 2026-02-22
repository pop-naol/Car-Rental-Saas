'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { formatDate, cn } from '@/lib/utils'
import { Plus, Search, Filter, Edit, Trash2, Users, Ban, CheckCircle, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { CustomerForm } from '@/components/customers/CustomerForm'
import Link from 'next/link'

interface Customer {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  license_number: string
  license_expiry: string
  is_blacklisted: boolean
  loyalty_level: string
  total_spending: number
  _count?: {
    bookings: number
    rentals: number
  }
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [blacklistFilter, setBlacklistFilter] = useState('ALL')
  const [loyaltyFilter, setLoyaltyFilter] = useState('ALL')
  const [showForm, setShowForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      const data = await api.get<{ customers: Customer[] }>('/customers')
      setCustomers(data.customers)
    } catch (error) {
      toast.error('Failed to load customers')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCustomer = async (data: any) => {
    setIsSubmitting(true)
    try {
      const DEMO_COMPANY_ID = '00000000-0000-0000-0000-000000000001'
      
      await api.post('/customers', {
        companyId: DEMO_COMPANY_ID,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        licenseNumber: data.licenseNumber,
        licenseExpiry: new Date(data.licenseExpiry).toISOString(),
        dateOfBirth: new Date(data.dateOfBirth).toISOString(),
        idNumber: data.idNumber,
      })
      toast.success('Customer added successfully')
      setShowForm(false)
      loadCustomers()
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to add customer')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditCustomer = async (data: any) => {
    if (!editingCustomer) return
    setIsSubmitting(true)
    try {
      await api.patch(`/customers/${editingCustomer.id}`, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        licenseNumber: data.licenseNumber,
        licenseExpiry: new Date(data.licenseExpiry).toISOString(),
        dateOfBirth: new Date(data.dateOfBirth).toISOString(),
        idNumber: data.idNumber,
      })
      toast.success('Customer updated successfully')
      setEditingCustomer(null)
      loadCustomers()
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to update customer')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCustomer = async () => {
    if (!deletingCustomer) return
    try {
      await api.delete(`/customers/${deletingCustomer.id}`)
      toast.success('Customer deleted successfully')
      setDeletingCustomer(null)
      loadCustomers()
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to delete customer')
    }
  }

  const handleToggleBlacklist = async (customer: Customer) => {
    try {
      if (customer.is_blacklisted) {
        await api.patch(`/customers/${customer.id}/remove-blacklist`, {})
        toast.success('Customer removed from blacklist')
      } else {
        await api.patch(`/customers/${customer.id}/blacklist`, {})
        toast.success('Customer added to blacklist')
      }
      loadCustomers()
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to update blacklist status')
    }
  }

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      customer.license_number.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesBlacklist =
      blacklistFilter === 'ALL' ||
      (blacklistFilter === 'BLACKLISTED' && customer.is_blacklisted) ||
      (blacklistFilter === 'ACTIVE' && !customer.is_blacklisted)

    const matchesLoyalty = loyaltyFilter === 'ALL' || customer.loyalty_level === loyaltyFilter

    return matchesSearch && matchesBlacklist && matchesLoyalty
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
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your {customers.length} customers
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          Add Customer
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>

          <select
            value={blacklistFilter}
            onChange={(e) => setBlacklistFilter(e.target.value)}
            className="input"
          >
            <option value="ALL">All Customers</option>
            <option value="ACTIVE">Active Only</option>
            <option value="BLACKLISTED">Blacklisted Only</option>
          </select>

          <select
            value={loyaltyFilter}
            onChange={(e) => setLoyaltyFilter(e.target.value)}
            className="input"
          >
            <option value="ALL">All Loyalty Levels</option>
            <option value="STANDARD">Standard</option>
            <option value="SILVER">Silver</option>
            <option value="GOLD">Gold</option>
            <option value="PLATINUM">Platinum</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="card">
          <p className="text-sm font-medium text-gray-600">Total Customers</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{customers.length}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-600">Active</p>
          <p className="mt-2 text-2xl font-semibold text-green-600">
            {customers.filter((c) => !c.is_blacklisted).length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-600">Blacklisted</p>
          <p className="mt-2 text-2xl font-semibold text-red-600">
            {customers.filter((c) => c.is_blacklisted).length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-600">VIP (Gold+)</p>
          <p className="mt-2 text-2xl font-semibold text-yellow-600">
            {customers.filter((c) => ['GOLD', 'PLATINUM'].includes(c.loyalty_level)).length}
          </p>
        </div>
      </div>

      {/* Customer Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  License
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loyalty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.first_name} {customer.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{customer.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.license_number}</div>
                    <div className="text-sm text-gray-500">
                      Exp: {formatDate(customer.license_expiry)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={cn(
                        'badge',
                        customer.loyalty_level === 'PLATINUM' && 'bg-purple-100 text-purple-800',
                        customer.loyalty_level === 'GOLD' && 'bg-yellow-100 text-yellow-800',
                        customer.loyalty_level === 'SILVER' && 'bg-gray-100 text-gray-800',
                        customer.loyalty_level === 'STANDARD' && 'bg-blue-100 text-blue-800'
                      )}
                    >
                      {customer.loyalty_level}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {customer.is_blacklisted ? (
                      <span className="badge bg-red-100 text-red-800">Blacklisted</span>
                    ) : (
                      <span className="badge bg-green-100 text-green-800">Active</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Link
                        href={`/dashboard/customers/${customer.id}`}
                        className="text-gray-600 hover:text-primary-600"
                      >
                        <Eye className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => setEditingCustomer(customer)}
                        className="text-gray-600 hover:text-primary-600"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleToggleBlacklist(customer)}
                        className={cn(
                          'hover:text-yellow-600',
                          customer.is_blacklisted ? 'text-green-600' : 'text-yellow-600'
                        )}
                      >
                        {customer.is_blacklisted ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <Ban className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        onClick={() => setDeletingCustomer(customer)}
                        className="text-gray-600 hover:text-red-600"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search' : 'Get started by adding a new customer'}
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Customer Form */}
      {(showForm || editingCustomer) && (
        <CustomerForm
          customer={editingCustomer}
          onSubmit={editingCustomer ? handleEditCustomer : handleAddCustomer}
          onClose={() => {
            setShowForm(false)
            setEditingCustomer(null)
          }}
          isLoading={isSubmitting}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Customer</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete{' '}
              <span className="font-semibold">
                {deletingCustomer.first_name} {deletingCustomer.last_name}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setDeletingCustomer(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleDeleteCustomer} className="btn bg-red-600 hover:bg-red-700 text-white">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
