'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Plus, Search, Wrench, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { MaintenanceForm } from '@/components/maintenance/MaintenanceForm'

interface Maintenance {
  id: string
  type: string
  description: string
  cost: number
  date: string
  performed_by: string
  vehicle: {
    brand: string
    model: string
    plate_number: string
  }
}

export default function MaintenancePage() {
  const [maintenanceLogs, setMaintenanceLogs] = useState<Maintenance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadMaintenance()
  }, [])

  const loadMaintenance = async () => {
    try {
      const data = await api.get<{ maintenanceLogs: Maintenance[] }>('/maintenance')
      setMaintenanceLogs(data.maintenanceLogs)
    } catch (error) {
      toast.error('Failed to load maintenance logs')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddMaintenance = async (data: any) => {
    setIsSubmitting(true)
    try {
      const DEMO_COMPANY_ID = '00000000-0000-0000-0000-000000000001'
      
      await api.post('/maintenance', {
        companyId: DEMO_COMPANY_ID,
        vehicleId: data.vehicleId,
        type: data.type,
        description: data.description,
        cost: data.cost,
        date: new Date(data.date).toISOString(),
        performedBy: data.performedBy,
        nextMaintenanceDate: data.nextMaintenanceDate
          ? new Date(data.nextMaintenanceDate).toISOString()
          : undefined,
        nextMaintenanceOdometer: data.nextMaintenanceOdometer,
      })
      toast.success('Maintenance log added successfully')
      setShowForm(false)
      loadMaintenance()
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to add maintenance log')
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredMaintenance = maintenanceLogs.filter((log) =>
    log.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.vehicle.model.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
          <h1 className="text-3xl font-bold text-gray-900">Maintenance</h1>
          <p className="mt-2 text-sm text-gray-600">Track vehicle maintenance and repairs</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          Log Maintenance
        </button>
      </div>

      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search maintenance logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performed By</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMaintenance.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {log.vehicle.brand} {log.vehicle.model}
                    </div>
                    <div className="text-sm text-gray-500">{log.vehicle.plate_number}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{log.type}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{log.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(log.date)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(log.cost)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{log.performed_by}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredMaintenance.length === 0 && (
          <div className="text-center py-12">
            <Wrench className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No maintenance logs found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search' : 'Get started by logging maintenance'}
            </p>
          </div>
        )}
      </div>

      {showForm && (
        <MaintenanceForm
          onSubmit={handleAddMaintenance}
          onClose={() => setShowForm(false)}
          isLoading={isSubmitting}
        />
      )}
    </div>
  )
}
