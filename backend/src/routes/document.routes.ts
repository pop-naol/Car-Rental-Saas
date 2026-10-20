import { Router, Request, Response } from 'express'
import { DocumentService } from '../services/document.service'
import { authenticate } from '../middleware/auth'
import { requirePermission } from '../middleware/rbac'
import { z } from 'zod'

const router = Router()

router.use(authenticate)

const createDocumentSchema = z.object({
  companyId: z.string().uuid(),
  entityType: z.string().min(1),
  entityId: z.string().uuid(),
  type: z.string().min(1),
  fileUrl: z.string().refine(
    (value) => value.startsWith('data:') || /^https?:\/\//i.test(value) || value.startsWith('/uploads/'),
    'fileUrl must be a data URL, http(s) URL, or /uploads path'
  ),
  fileName: z.string().min(1),
})

// POST /documents - Create document
router.post('/', requirePermission('document:create'), async (req: Request, res: Response) => {
  try {
    const data = createDocumentSchema.parse(req.body)

    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.companyId !== data.companyId) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You can only create documents for your own company',
        },
      })
    }

    const document = await DocumentService.createDocument(
      {
        ...data,
        uploadedBy: req.user!.userId,
      },
      req.user!.userId
    )

    return res.status(201).json({
      message: 'Document created successfully',
      document,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors,
        },
      })
    }

    if (error instanceof Error && error.message === 'INVALID_FILE_TYPE') {
      return res.status(400).json({
        error: {
          code: 'INVALID_FILE_TYPE',
          message: 'File type not allowed. Allowed types: pdf, jpg, jpeg, png, doc, docx',
        },
      })
    }

    console.error('Create document error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while creating document',
      },
    })
  }
})

// GET /documents - List documents
router.get('/', requirePermission('document:read'), async (req: Request, res: Response) => {
  try {
    const { entityType, entityId, type } = req.query

    const companyId = req.user!.role === 'SUPER_ADMIN' ? undefined : req.user!.companyId

    const documents = await DocumentService.getDocuments({
      companyId,
      entityType: entityType as string | undefined,
      entityId: entityId as string | undefined,
      type: type as string | undefined,
    })

    return res.json({ documents })
  } catch (error) {
    console.error('Get documents error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching documents',
      },
    })
  }
})

// GET /documents/:id - Get document by ID
router.get('/:id', requirePermission('document:read'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const document = await DocumentService.getDocumentById(id)

    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.companyId !== document.company_id) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You can only view documents from your own company',
        },
      })
    }

    return res.json({ document })
  } catch (error) {
    if (error instanceof Error && error.message === 'DOCUMENT_NOT_FOUND') {
      return res.status(404).json({
        error: {
          code: 'DOCUMENT_NOT_FOUND',
          message: 'Document not found',
        },
      })
    }

    console.error('Get document error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching document',
      },
    })
  }
})

// DELETE /documents/:id - Delete document
router.delete('/:id', requirePermission('document:delete'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const result = await DocumentService.deleteDocument(id, req.user!.userId, req.user!.companyId!)

    return res.json(result)
  } catch (error) {
    if (error instanceof Error && error.message === 'DOCUMENT_NOT_FOUND') {
      return res.status(404).json({
        error: {
          code: 'DOCUMENT_NOT_FOUND',
          message: 'Document not found',
        },
      })
    }

    console.error('Delete document error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while deleting document',
      },
    })
  }
})

// POST /documents/generate-id - Generate unique document ID
router.post('/generate-id', requirePermission('document:create'), async (_req: Request, res: Response) => {
  try {
    const documentId = DocumentService.generateDocumentId()
    return res.json({ documentId })
  } catch (error) {
    console.error('Generate document ID error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while generating document ID',
      },
    })
  }
})

export default router

