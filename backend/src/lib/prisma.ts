import { PrismaClient } from '@prisma/client'
import { AsyncLocalStorage } from 'async_hooks'

// Context storage for tenant isolation
export const tenantContext = new AsyncLocalStorage<{
  companyId?: string
  userId?: string
  role?: string
}>()

// Models that require tenant filtering
const TENANT_MODELS = [
  'branch',
  'vehicle',
  'customer',
  'driver',
  'booking',
  'rental',
  'revenue',
  'expense',
  'invoice',
  'maintenanceLog',
  'document',
  'notification',
]

// Create Prisma client instance
const prismaClientSingleton = () => {
  const prisma = new PrismaClient()

  // Middleware for automatic company_id injection
  prisma.$use(async (params, next) => {
    const context = tenantContext.getStore()
    const companyId = context?.companyId
    const role = context?.role

    // Skip tenant filtering for Super Admin or if no company context
    if (role === 'SUPER_ADMIN' || !companyId) {
      return next(params)
    }

    // Check if this model requires tenant filtering
    if (params.model && TENANT_MODELS.includes(params.model)) {
      // Read operations - filter by company_id
      if (params.action === 'findMany' || params.action === 'findFirst') {
        params.args = params.args || {}
        params.args.where = {
          ...params.args.where,
          company_id: companyId,
        }
      }

      // Single read operations
      if (params.action === 'findUnique' || params.action === 'findUniqueOrThrow') {
        params.args = params.args || {}
        params.args.where = {
          ...params.args.where,
          company_id: companyId,
        }
      }

      // Count operations
      if (params.action === 'count') {
        params.args = params.args || {}
        params.args.where = {
          ...params.args.where,
          company_id: companyId,
        }
      }

      // Create operations - inject company_id
      if (params.action === 'create') {
        params.args = params.args || {}
        params.args.data = {
          ...params.args.data,
          company_id: companyId,
        }
      }

      // Create many operations
      if (params.action === 'createMany') {
        params.args = params.args || {}
        if (Array.isArray(params.args.data)) {
          params.args.data = params.args.data.map((item: any) => ({
            ...item,
            company_id: companyId,
          }))
        }
      }

      // Update operations - ensure company_id matches
      if (params.action === 'update' || params.action === 'updateMany') {
        params.args = params.args || {}
        params.args.where = {
          ...params.args.where,
          company_id: companyId,
        }
      }

      // Delete operations - ensure company_id matches
      if (params.action === 'delete' || params.action === 'deleteMany') {
        params.args = params.args || {}
        params.args.where = {
          ...params.args.where,
          company_id: companyId,
        }
      }
    }

    return next(params)
  })

  return prisma
}

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
