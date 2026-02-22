'use client'

import { ChangeEvent, useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Eye, FileText, Printer, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth'

interface DocumentItem {
  id: string
  entity_type: string
  entity_id: string
  type: string
  file_url: string
  file_name: string
  uploaded_by: string
  created_at: string
}

const DOC_TYPES = [
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'INVOICE', label: 'Invoice' },
  { value: 'OTHER_DOCUMENT', label: 'Other Document' },
]

export default function DocumentsPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
  const toFileHref = (value: string) => (value.startsWith('/uploads') ? `${API_URL}${value}` : value)
  const { user } = useAuthStore()
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedType, setSelectedType] = useState('CONTRACT')
  const [displayName, setDisplayName] = useState('')
  const [fileDataUrl, setFileDataUrl] = useState('')
  const [fileExtension, setFileExtension] = useState('')

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      const data = await api.get<{ documents: DocumentItem[] }>('/documents')
      setDocuments(data.documents)
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Failed to load documents'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const extension = file.name.split('.').pop()?.toLowerCase() || ''
    const allowed = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']
    if (!allowed.includes(extension)) {
      toast.error('Only PDF, JPG, JPEG, PNG, DOC, DOCX are allowed')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const value = typeof reader.result === 'string' ? reader.result : ''
      setFileDataUrl(value)
      setFileExtension(extension)
      if (!displayName) {
        const base = file.name.replace(/\.[^/.]+$/, '')
        setDisplayName(base)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!displayName.trim()) {
      toast.error('Please enter a file name')
      return
    }
    if (!fileDataUrl) {
      toast.error('Please choose a file')
      return
    }

    const companyId = user?.companyId || '00000000-0000-0000-0000-000000000001'
    const normalizedName = displayName.trim().replace(/[\\/:*?"<>|]/g, '_')
    const fileName = fileExtension ? `${normalizedName}.${fileExtension}` : normalizedName

    setIsUploading(true)
    try {
      await api.post('/documents', {
        companyId,
        entityType: 'COMPANY',
        entityId: companyId,
        type: selectedType,
        fileUrl: fileDataUrl,
        fileName,
      })
      toast.success('Document uploaded successfully')
      setDisplayName('')
      setFileDataUrl('')
      setFileExtension('')
      await loadDocuments()
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Failed to upload document'
      toast.error(message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/documents/${id}`)
      toast.success('Document deleted')
      await loadDocuments()
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Failed to delete document'
      toast.error(message)
    }
  }

  const handleView = (fileUrl: string) => {
    window.open(toFileHref(fileUrl), '_blank', 'noopener,noreferrer')
  }

  const handlePrint = (fileUrl: string) => {
    const printWindow = window.open(toFileHref(fileUrl), '_blank')
    if (!printWindow) {
      toast.error('Popup blocked. Please allow popups for printing.')
      return
    }

    const tryPrint = () => {
      try {
        printWindow.focus()
        printWindow.print()
      } catch {
        // no-op: some browsers/files may require manual print
      }
    }

    setTimeout(tryPrint, 1200)
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
        <p className="mt-2 text-sm text-gray-600">Upload and manage contracts, invoices, and other documents</p>
      </div>

      <div className="card space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Upload Document</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Save Name</label>
            <input
              className="input"
              type="text"
              placeholder="Enter file name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
            <select className="input" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
              {DOC_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
            <input className="input" type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={onFileChange} />
          </div>
        </div>
        <button onClick={handleUpload} disabled={isUploading} className="btn btn-primary inline-flex items-center">
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? 'Uploading...' : 'Upload Document'}
        </button>
      </div>

      <div className="card overflow-hidden">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Documents</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploaded</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <a href={toFileHref(doc.file_url)} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary-700 hover:underline">
                        {doc.file_name}
                      </a>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{doc.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(doc.created_at)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => handleView(doc.file_url)}
                        className="p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg"
                        title="View"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handlePrint(doc.file_url)}
                        className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                        title="Print"
                      >
                        <Printer className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                        title="Delete"
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
        {documents.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No documents uploaded</h3>
          </div>
        )}
      </div>
    </div>
  )
}
