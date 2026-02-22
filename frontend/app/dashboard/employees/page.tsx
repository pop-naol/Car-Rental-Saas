'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Users, Mail, Shield, Plus, Edit, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth'

interface Branch {
  id: string
  name: string
}

interface Employee {
  id: string
  branch_id?: string | null
  first_name: string
  last_name: string
  email: string
  role: 'EMPLOYEE' | 'COMPANY_MANAGER'
  is_active: boolean
}

export default function EmployeesPage() {
  const { user } = useAuthStore()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'EMPLOYEE' as 'EMPLOYEE' | 'COMPANY_MANAGER',
    branchId: '',
    isActive: true,
  })

  const canManageEmployees = user?.role === 'SUPER_ADMIN' || user?.role === 'COMPANY_MANAGER'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [employeesData, branchesData] = await Promise.all([
        api.get<{ employees: Employee[] }>('/employees'),
        api.get<{ branches: Branch[] }>('/branches'),
      ])
      setEmployees(employeesData.employees)
      setBranches(branchesData.branches)
    } catch {
      toast.error('Failed to load employees')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const DEMO_COMPANY_ID = '00000000-0000-0000-0000-000000000001'

      if (editingEmployee) {
        await api.patch(`/employees/${editingEmployee.id}`, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          branchId: formData.branchId || undefined,
        })

        if (formData.isActive !== editingEmployee.is_active) {
          if (formData.isActive) {
            await api.patch(`/employees/${editingEmployee.id}/activate`, {})
          } else {
            await api.patch(`/employees/${editingEmployee.id}/deactivate`, {})
          }
        }

        toast.success('Employee updated successfully')
      } else {
        await api.post('/employees', {
          companyId: DEMO_COMPANY_ID,
          branchId: formData.branchId || undefined,
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
        })
        toast.success('Employee added successfully')
      }

      setShowForm(false)
      setEditingEmployee(null)
      resetForm()
      loadData()
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to save employee')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setFormData({
      firstName: employee.first_name,
      lastName: employee.last_name,
      email: employee.email,
      password: '',
      role: employee.role,
      branchId: employee.branch_id || '',
      isActive: employee.is_active,
    })
    setShowForm(true)
  }

  const handleDelete = async () => {
    if (!deletingEmployee) return
    try {
      await api.delete(`/employees/${deletingEmployee.id}`)
      toast.success('Employee deleted successfully')
      setDeletingEmployee(null)
      loadData()
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to delete employee')
    }
  }

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'EMPLOYEE',
      branchId: '',
      isActive: true,
    })
  }

  const handleClose = () => {
    setShowForm(false)
    setEditingEmployee(null)
    resetForm()
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
          <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
          <p className="mt-2 text-sm text-gray-600">Manage your team members</p>
        </div>
        {canManageEmployees && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Add Employee
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {employee.first_name} {employee.last_name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      {employee.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-sm text-gray-900">{employee.role}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {employee.is_active ? (
                      <span className="badge bg-green-100 text-green-800">Active</span>
                    ) : (
                      <span className="badge bg-gray-100 text-gray-800">Inactive</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {canManageEmployees ? (
                      <div className="flex justify-end space-x-2">
                        <button onClick={() => handleEdit(employee)} className="text-gray-600 hover:text-primary-600">
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setDeletingEmployee(employee)}
                          className="text-gray-600 hover:text-red-600"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">View Only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
              </h2>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input"
                    required
                    disabled={!!editingEmployee}
                  />
                </div>

                {!editingEmployee && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="input"
                      required
                      minLength={8}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value as 'EMPLOYEE' | 'COMPANY_MANAGER' })
                    }
                    className="input"
                    required
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="COMPANY_MANAGER">Company Manager</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                  <select
                    value={formData.branchId}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                    className="input"
                  >
                    <option value="">No Branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>

                {editingEmployee && (
                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Active Employee</span>
                    </label>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={handleClose} className="btn btn-secondary" disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingEmployee ? 'Update Employee' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Employee</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to disable{' '}
              <span className="font-semibold">
                {deletingEmployee.first_name} {deletingEmployee.last_name}
              </span>
              ?
            </p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setDeletingEmployee(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleDelete} className="btn bg-red-600 hover:bg-red-700 text-white">
                Disable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
