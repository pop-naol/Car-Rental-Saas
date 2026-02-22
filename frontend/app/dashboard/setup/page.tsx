'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Building2, MapPin, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SetupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [companyId, setCompanyId] = useState('')
  const [branchId, setBranchId] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const [companyData, setCompanyData] = useState({
    name: '',
    subscriptionTier: 'premium' as 'basic' | 'premium' | 'enterprise',
  })

  const [branchData, setBranchData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
  })

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await api.post<{ company: { id: string } }>('/companies', companyData)
      setCompanyId(response.company.id)
      toast.success('Company created successfully')
      setStep(2)
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to create company')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await api.post<{ branch: { id: string } }>('/branches', {
        companyId,
        ...branchData,
      })
      setBranchId(response.branch.id)
      toast.success('Branch created successfully')
      setStep(3)
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to create branch')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFinish = () => {
    toast.success('Setup complete! You can now add vehicles and manage your fleet.')
    router.push('/dashboard')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Initial Setup</h1>
        <p className="mt-2 text-sm text-gray-600">
          Let's set up your company and first branch to get started
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full ${
              step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}
          >
            {step > 1 ? <CheckCircle className="h-6 w-6" /> : '1'}
          </div>
          <span className="ml-2 text-sm font-medium text-gray-900">Company</span>
        </div>
        <div className="flex-1 h-1 mx-4 bg-gray-200">
          <div
            className={`h-full ${step >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`}
            style={{ width: step >= 2 ? '100%' : '0%', transition: 'width 0.3s' }}
          ></div>
        </div>
        <div className="flex items-center">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full ${
              step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}
          >
            {step > 2 ? <CheckCircle className="h-6 w-6" /> : '2'}
          </div>
          <span className="ml-2 text-sm font-medium text-gray-900">Branch</span>
        </div>
        <div className="flex-1 h-1 mx-4 bg-gray-200">
          <div
            className={`h-full ${step >= 3 ? 'bg-primary-600' : 'bg-gray-200'}`}
            style={{ width: step >= 3 ? '100%' : '0%', transition: 'width 0.3s' }}
          ></div>
        </div>
        <div className="flex items-center">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full ${
              step >= 3 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}
          >
            {step >= 3 ? <CheckCircle className="h-6 w-6" /> : '3'}
          </div>
          <span className="ml-2 text-sm font-medium text-gray-900">Done</span>
        </div>
      </div>

      {/* Step 1: Create Company */}
      {step === 1 && (
        <div className="card">
          <div className="flex items-center mb-6">
            <Building2 className="h-6 w-6 text-primary-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Create Your Company</h2>
          </div>
          <form onSubmit={handleCreateCompany} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={companyData.name}
                onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                className="input"
                placeholder="Demo Car Rentals"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subscription Tier <span className="text-red-500">*</span>
              </label>
              <select
                value={companyData.subscriptionTier}
                onChange={(e) =>
                  setCompanyData({
                    ...companyData,
                    subscriptionTier: e.target.value as 'basic' | 'premium' | 'enterprise',
                  })
                }
                className="input"
              >
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Company'}
            </button>
          </form>
        </div>
      )}

      {/* Step 2: Create Branch */}
      {step === 2 && (
        <div className="card">
          <div className="flex items-center mb-6">
            <MapPin className="h-6 w-6 text-primary-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Create Your First Branch</h2>
          </div>
          <form onSubmit={handleCreateBranch} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Branch Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={branchData.name}
                onChange={(e) => setBranchData({ ...branchData, name: e.target.value })}
                className="input"
                placeholder="Main Branch"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={branchData.address}
                onChange={(e) => setBranchData({ ...branchData, address: e.target.value })}
                className="input"
                placeholder="123 Main St, City, State 12345"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={branchData.phone}
                onChange={(e) => setBranchData({ ...branchData, phone: e.target.value })}
                className="input"
                placeholder="+1-555-0100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={branchData.email}
                onChange={(e) => setBranchData({ ...branchData, email: e.target.value })}
                className="input"
                placeholder="main@demo.com"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Branch'}
            </button>
          </form>
        </div>
      )}

      {/* Step 3: Complete */}
      {step === 3 && (
        <div className="card text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Setup Complete!</h2>
          <p className="text-gray-600 mb-6">
            Your company and branch have been created successfully. You can now start managing your
            fleet.
          </p>
          <div className="space-y-3">
            <div className="bg-gray-50 p-4 rounded-lg text-left">
              <p className="text-sm text-gray-600">Company ID:</p>
              <p className="font-mono text-sm text-gray-900">{companyId}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-left">
              <p className="text-sm text-gray-600">Branch ID:</p>
              <p className="font-mono text-sm text-gray-900">{branchId}</p>
            </div>
          </div>
          <button onClick={handleFinish} className="btn btn-primary w-full mt-6">
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  )
}
