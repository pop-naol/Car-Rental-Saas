'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { MapPin, Phone, Mail, Plus, Edit, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

interface Branch {
  id: string
  name: string
  address: string
  phone: string
  email: string
  is_active: boolean
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    isActive: true,
  })

  useEffect(() => {
    loadBranches()
  }, [])

  const loadBranches = async () => {
    try {
      const data = await api.get<{ branches: Branch[] }>('/branches')
      setBranches(data.branches)
    } catch {
      toast.error('Failed to load branches')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const DEMO_COMPANY_ID = '00000000-0000-0000-0000-000000000001'

      if (editingBranch) {
        await api.patch(`/branches/${editingBranch.id}`, {
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          isActive: formData.isActive,
        })
        toast.success('Branch updated successfully')
      } else {
        await api.post('/branches', {
          companyId: DEMO_COMPANY_ID,
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
        })
        toast.success('Branch created successfully')
      }

      setShowForm(false)
      setEditingBranch(null)
      setFormData({ name: '', address: '', phone: '', email: '', isActive: true })
      loadBranches()
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to save branch')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch)
    setFormData({
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      email: branch.email,
      isActive: branch.is_active,
    })
    setShowForm(true)
  }

  const handleDelete = async () => {
    if (!deletingBranch) return
    try {
      await api.delete(`/branches/${deletingBranch.id}`)
      toast.success('Branch deleted successfully')
      setDeletingBranch(null)
      loadBranches()
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to delete branch')
    }
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Branches</h1>
          <p className="mt-2 text-sm text-gray-600">Manage your {branches.length} branches</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          Add Branch
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {branches.map((branch) => (
          <div key={branch.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{branch.name}</h3>
                {branch.is_active ? (
                  <span className="badge bg-green-100 text-green-800 mt-2">Active</span>
                ) : (
                  <span className="badge bg-gray-100 text-gray-800 mt-2">Inactive</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleEdit(branch)} className="text-gray-600 hover:text-primary-600">
                  <Edit className="h-4 w-4" />
                </button>
                <button onClick={() => setDeletingBranch(branch)} className="text-gray-600 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-600">{branch.address}</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">{branch.phone}</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">{branch.email}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingBranch ? 'Edit Branch' : 'Add New Branch'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditingBranch(null)
                  setFormData({ name: '', address: '', phone: '', email: '', isActive: true })
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <input
                type="text"
                placeholder="Branch Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                required
              />
              <input
                type="text"
                placeholder="Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="input"
                required
              />
              <input
                type="text"
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
                required
              />

              {editingBranch && (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active Branch</span>
                </label>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingBranch(null)
                    setFormData({ name: '', address: '', phone: '', email: '', isActive: true })
                  }}
                  className="btn btn-secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingBranch ? 'Update Branch' : 'Add Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingBranch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Branch</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-semibold">{deletingBranch.name}</span>?
            </p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setDeletingBranch(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleDelete} className="btn bg-red-600 hover:bg-red-700 text-white">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
