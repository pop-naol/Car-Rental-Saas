import prisma from '../lib/prisma'
import { AuditService } from './audit.service'
import fs from 'fs/promises'
import path from 'path'

interface CreateDocumentInput {
  companyId: string
  entityType: string
  entityId: string
  type: string
  fileUrl: string
  fileName: string
  uploadedBy: string
}

export class DocumentService {
  private static readonly DOCUMENT_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'documents')

  private static getExtensionFromMime(mime: string): string {
    if (mime === 'application/pdf') return 'pdf'
    if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg'
    if (mime === 'image/png') return 'png'
    if (mime === 'image/webp') return 'webp'
    return 'bin'
  }

  private static async persistFileIfDataUrl(fileUrl: string, fileName: string): Promise<string> {
    if (!fileUrl.startsWith('data:')) return fileUrl

    const match = fileUrl.match(/^data:([^;]+);base64,(.+)$/)
    if (!match) return fileUrl

    const mime = match[1].toLowerCase()
    const base64 = match[2]
    const providedExt = fileName.split('.').pop()?.toLowerCase()
    const ext = providedExt || this.getExtensionFromMime(mime)
    const safeBaseName = fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '_')
    const finalName = `${Date.now()}_${safeBaseName}.${ext}`

    await fs.mkdir(this.DOCUMENT_UPLOAD_DIR, { recursive: true })
    await fs.writeFile(path.join(this.DOCUMENT_UPLOAD_DIR, finalName), Buffer.from(base64, 'base64'))

    return `/uploads/documents/${finalName}`
  }

  static async createDocument(data: CreateDocumentInput, userId: string) {
    // Validate file type
    const allowedTypes = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']
    const fileExtension = data.fileName.split('.').pop()?.toLowerCase()

    if (!fileExtension || !allowedTypes.includes(fileExtension)) {
      throw new Error('INVALID_FILE_TYPE')
    }

    const persistedFileUrl = await this.persistFileIfDataUrl(data.fileUrl, data.fileName)

    const document = await prisma.document.create({
      data: {
        company_id: data.companyId,
        entity_type: data.entityType,
        entity_id: data.entityId,
        type: data.type,
        file_url: persistedFileUrl,
        file_name: data.fileName,
        uploaded_by: data.uploadedBy,
      },
    })

    await AuditService.log({
      userId,
      companyId: data.companyId,
      action: 'CREATE',
      entityType: 'Document',
      entityId: document.id,
      newValues: document,
      ipAddress: 'system',
      userAgent: 'system',
    })

    return document
  }

  static async getDocuments(filters: {
    companyId?: string
    entityType?: string
    entityId?: string
    type?: string
  }) {
    return prisma.document.findMany({
      where: {
        company_id: filters.companyId,
        entity_type: filters.entityType,
        entity_id: filters.entityId,
        type: filters.type,
      },
      orderBy: {
        created_at: 'desc',
      },
    })
  }

  static async getDocumentById(id: string) {
    const document = await prisma.document.findUnique({
      where: { id },
    })

    if (!document) {
      throw new Error('DOCUMENT_NOT_FOUND')
    }

    return document
  }

  static async deleteDocument(id: string, userId: string, companyId: string) {
    const document = await prisma.document.findUnique({
      where: { id },
    })

    if (!document) {
      throw new Error('DOCUMENT_NOT_FOUND')
    }

    await prisma.document.delete({
      where: { id },
    })

    await AuditService.log({
      userId,
      companyId,
      action: 'DELETE',
      entityType: 'Document',
      entityId: document.id,
      oldValues: document,
      ipAddress: 'system',
      userAgent: 'system',
    })

    return { message: 'Document deleted successfully' }
  }

  // Generate unique document identifier
  static generateDocumentId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 9)
    return `DOC-${timestamp}-${random}`.toUpperCase()
  }

  // Validate file size (in bytes)
  static validateFileSize(fileSize: number, maxSizeMB = 10): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    return fileSize <= maxSizeBytes
  }
}
