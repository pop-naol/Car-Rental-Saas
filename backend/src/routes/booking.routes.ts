import { Router, Request, Response } from 'express'
import { BookingService } from '../services/booking.service'
import { authenticate } from '../middleware/auth'
import { requirePermission } from '../middleware/rbac'
import { z } from 'zod'
import { BookingStatus } from '@prisma/client'

const router = Router()

router.use(authenticate)

const createBookingSchema = z.object({
  companyId: z.string().uuid().optional(),
  customerId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  driverId: z.string().uuid().optional(),
  estimatedCost: z.number().positive(),
  discountCode: z.string().optional(),
  discountAmount: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  pickupLocationType: z.enum(['OFFICE', 'BRANCH_A', 'CUSTOM']).optional(),
  pickupLocationLabel: z.string().optional(),
  dropoffLocation: z.string().optional(),
})

const updateBookingSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  driverId: z.string().uuid().optional(),
  estimatedCost: z.number().positive().optional(),
  discountCode: z.string().optional(),
  discountAmount: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  pickupLocationType: z.enum(['OFFICE', 'BRANCH_A', 'CUSTOM']).optional(),
  pickupLocationLabel: z.string().optional(),
  dropoffLocation: z.string().optional(),
})

const verifyPickupSchema = z.object({
  location: z.string().optional(),
})

const verifyDropoffSchema = z.object({
  location: z.string().optional(),
  useAssignedLocation: z.boolean().optional(),
})

const addServiceSchema = z.object({
  serviceType: z.string().min(1),
  serviceName: z.string().min(1),
  price: z.number().positive(),
})

const checkAvailabilitySchema = z.object({
  vehicleId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
})

// POST /bookings/check-availability - Check vehicle availability
router.post(
  '/check-availability',
  requirePermission('booking:read'),
  async (req: Request, res: Response) => {
    try {
      const data = checkAvailabilitySchema.parse(req.body)

      const result = await BookingService.checkAvailability(
        data.vehicleId,
        new Date(data.startDate),
        new Date(data.endDate)
      )

      return res.json(result)
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

      console.error('Check availability error:', error)
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while checking availability',
        },
      })
    }
  }
)

// POST /bookings - Create booking
router.post('/', requirePermission('booking:create'), async (req: Request, res: Response) => {
  try {
    const data = createBookingSchema.parse(req.body)
    const targetCompanyId = data.companyId || req.user!.companyId

    if (!targetCompanyId) {
      return res.status(400).json({
        error: {
          code: 'COMPANY_REQUIRED',
          message: 'Company context is required to create booking',
        },
      })
    }

    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.companyId !== targetCompanyId) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You can only create bookings for your own company',
        },
      })
    }

    const booking = await BookingService.createBooking(
      {
        ...data,
        companyId: targetCompanyId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
      req.user!.userId
    )

    return res.status(201).json({
      message: 'Booking created successfully',
      booking,
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

    if (error instanceof Error) {
      if (error.message === 'CUSTOMER_BLACKLISTED') {
        return res.status(403).json({
          error: {
            code: 'CUSTOMER_BLACKLISTED',
            message: 'Customer is blacklisted and cannot rent',
          },
        })
      }

      if (error.message === 'LICENSE_EXPIRED') {
        return res.status(400).json({
          error: {
            code: 'LICENSE_EXPIRED',
            message: 'Customer license has expired',
          },
        })
      }

      if (error.message === 'INVALID_DATE_RANGE') {
        return res.status(400).json({
          error: {
            code: 'INVALID_DATE_RANGE',
            message: 'End date must be after start date',
          },
        })
      }

      if (error.message === 'START_DATE_IN_PAST') {
        return res.status(400).json({
          error: {
            code: 'START_DATE_IN_PAST',
            message: 'Start date cannot be in the past',
          },
        })
      }

      if (error.message === 'VEHICLE_NOT_AVAILABLE') {
        return res.status(409).json({
          error: {
            code: 'VEHICLE_NOT_AVAILABLE',
            message: 'Vehicle is not available for the selected dates',
          },
        })
      }

      if (error.message === 'VEHICLE_NOT_FOUND_OR_UNAVAILABLE') {
        return res.status(404).json({
          error: {
            code: 'VEHICLE_NOT_FOUND_OR_UNAVAILABLE',
            message: 'Vehicle not found or not available for booking',
          },
        })
      }
    }

    console.error('Create booking error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while creating booking',
      },
    })
  }
})

// GET /bookings - List bookings
router.get('/', requirePermission('booking:read'), async (req: Request, res: Response) => {
  try {
    const { branchId, customerId, vehicleId, status, startDate, endDate } = req.query

    const companyId = req.user!.role === 'SUPER_ADMIN' ? undefined : req.user!.companyId

    const isDriver = req.user!.role === 'DRIVER'
    const bookings = await BookingService.getBookings({
      companyId,
      branchId: branchId as string | undefined,
      customerId: customerId as string | undefined,
      vehicleId: vehicleId as string | undefined,
      driverId: isDriver ? req.user!.userId : undefined,
      status: status as BookingStatus | undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    })

    return res.json({ bookings })
  } catch (error) {
    console.error('Get bookings error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching bookings',
      },
    })
  }
})

// GET /bookings/overdue - Get overdue bookings
router.get(
  '/overdue',
  requirePermission('booking:read'),
  async (req: Request, res: Response) => {
    try {
      const companyId = req.user!.companyId!

      const bookings = await BookingService.getOverdueBookings(companyId)

      return res.json({ bookings })
    } catch (error) {
      console.error('Get overdue bookings error:', error)
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching overdue bookings',
        },
      })
    }
  }
)

// GET /bookings/:id - Get booking by ID
router.get('/:id', requirePermission('booking:read'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const booking = await BookingService.getBookingById(id)

    if (req.user!.role === 'DRIVER' && booking.driver_id !== req.user!.userId) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You can only view bookings assigned to you',
        },
      })
    }

    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.companyId !== booking.company_id) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You can only view bookings from your own company',
        },
      })
    }

    return res.json({ booking })
  } catch (error) {
    if (error instanceof Error && error.message === 'BOOKING_NOT_FOUND') {
      return res.status(404).json({
        error: {
          code: 'BOOKING_NOT_FOUND',
          message: 'Booking not found',
        },
      })
    }

    console.error('Get booking error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching booking',
      },
    })
  }
})

// PATCH /bookings/:id - Update booking
router.patch('/:id', requirePermission('booking:update'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const data = updateBookingSchema.parse(req.body)

    const booking = await BookingService.updateBooking(
      id,
      {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
      req.user!.userId,
      req.user!.companyId!
    )

    return res.json({
      message: 'Booking updated successfully',
      booking,
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

    if (error instanceof Error) {
      if (error.message === 'BOOKING_NOT_FOUND') {
        return res.status(404).json({
          error: {
            code: 'BOOKING_NOT_FOUND',
            message: 'Booking not found',
          },
        })
      }

      if (error.message === 'BOOKING_CANNOT_BE_MODIFIED') {
        return res.status(400).json({
          error: {
            code: 'BOOKING_CANNOT_BE_MODIFIED',
            message: 'Only pending or confirmed bookings can be modified',
          },
        })
      }

      if (error.message === 'INVALID_DATE_RANGE') {
        return res.status(400).json({
          error: {
            code: 'INVALID_DATE_RANGE',
            message: 'End date must be after start date',
          },
        })
      }

      if (error.message === 'VEHICLE_NOT_AVAILABLE') {
        return res.status(409).json({
          error: {
            code: 'VEHICLE_NOT_AVAILABLE',
            message: 'Vehicle is not available for the selected dates',
          },
        })
      }
    }

    console.error('Update booking error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while updating booking',
      },
    })
  }
})

// POST /bookings/:id/verify-pickup - Driver verifies pickup first
router.post('/:id/verify-pickup', requirePermission('booking:read'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const payload = verifyPickupSchema.parse(req.body)
    const booking = await BookingService.verifyPickup(
      id,
      req.user!.userId,
      req.user!.companyId!,
      payload.location
    )

    return res.json({
      message: 'Pickup verified successfully',
      booking,
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

    if (error instanceof Error && error.message === 'BOOKING_NOT_FOUND') {
      return res.status(404).json({
        error: {
          code: 'BOOKING_NOT_FOUND',
          message: 'Booking not found',
        },
      })
    }

    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You can only verify pickup for your assigned bookings',
        },
      })
    }

    console.error('Verify pickup error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message:
          error instanceof Error
            ? `An error occurred while verifying pickup: ${error.message}`
            : 'An error occurred while verifying pickup',
      },
    })
  }
})

// POST /bookings/:id/verify-dropoff - Driver verifies drop-off after pickup verification
router.post('/:id/verify-dropoff', requirePermission('booking:read'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const payload = verifyDropoffSchema.parse(req.body)
    const booking = await BookingService.verifyDropoff(
      id,
      req.user!.userId,
      req.user!.companyId!,
      payload.location,
      payload.useAssignedLocation || false
    )

    return res.json({
      message: 'Drop-off verified successfully',
      booking,
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

    if (error instanceof Error && error.message === 'BOOKING_NOT_FOUND') {
      return res.status(404).json({
        error: {
          code: 'BOOKING_NOT_FOUND',
          message: 'Booking not found',
        },
      })
    }

    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You can only verify drop-off for your assigned bookings',
        },
      })
    }

    if (error instanceof Error && error.message === 'PICKUP_NOT_VERIFIED') {
      return res.status(400).json({
        error: {
          code: 'PICKUP_NOT_VERIFIED',
          message: 'Pickup must be verified before drop-off verification',
        },
      })
    }

    if (error instanceof Error && error.message === 'ASSIGNED_DROPOFF_MISSING') {
      return res.status(400).json({
        error: {
          code: 'ASSIGNED_DROPOFF_MISSING',
          message: 'Assigned drop-off location is missing, enter drop-off manually',
        },
      })
    }

    if (error instanceof Error && error.message === 'DROPOFF_LOCATION_REQUIRED') {
      return res.status(400).json({
        error: {
          code: 'DROPOFF_LOCATION_REQUIRED',
          message: 'Drop-off location is required for verification',
        },
      })
    }

    console.error('Verify drop-off error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message:
          error instanceof Error
            ? `An error occurred while verifying drop-off: ${error.message}`
            : 'An error occurred while verifying drop-off',
      },
    })
  }
})

// PATCH /bookings/:id/confirm - Confirm booking
router.patch(
  '/:id/confirm',
  requirePermission('booking:update'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params

      const booking = await BookingService.confirmBooking(id, req.user!.userId, req.user!.companyId!)

      return res.json({
        message: 'Booking confirmed successfully',
        booking,
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'BOOKING_NOT_FOUND') {
          return res.status(404).json({
            error: {
              code: 'BOOKING_NOT_FOUND',
              message: 'Booking not found',
            },
          })
        }

        if (error.message === 'BOOKING_NOT_PENDING') {
          return res.status(400).json({
            error: {
              code: 'BOOKING_NOT_PENDING',
              message: 'Only pending bookings can be confirmed',
            },
          })
        }

        if (error.message === 'VEHICLE_NOT_AVAILABLE') {
          return res.status(409).json({
            error: {
              code: 'VEHICLE_NOT_AVAILABLE',
              message: 'Vehicle is no longer available',
            },
          })
        }
      }

      console.error('Confirm booking error:', error)
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while confirming booking',
        },
      })
    }
  }
)

// PATCH /bookings/:id/cancel - Cancel booking
router.patch(
  '/:id/cancel',
  requirePermission('booking:update'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params

      const booking = await BookingService.cancelBooking(id, req.user!.userId, req.user!.companyId!)

      return res.json({
        message: 'Booking cancelled successfully',
        booking,
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'BOOKING_NOT_FOUND') {
          return res.status(404).json({
            error: {
              code: 'BOOKING_NOT_FOUND',
              message: 'Booking not found',
            },
          })
        }

        if (error.message === 'BOOKING_CANNOT_BE_CANCELLED') {
          return res.status(400).json({
            error: {
              code: 'BOOKING_CANNOT_BE_CANCELLED',
              message: 'Only pending or confirmed bookings can be cancelled',
            },
          })
        }
      }

      console.error('Cancel booking error:', error)
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while cancelling booking',
        },
      })
    }
  }
)

// POST /bookings/:id/services - Add service to booking
router.post(
  '/:id/services',
  requirePermission('booking:update'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const data = addServiceSchema.parse(req.body)

      const service = await BookingService.addService(
        id,
        data,
        req.user!.userId,
        req.user!.companyId!
      )

      return res.status(201).json({
        message: 'Service added successfully',
        service,
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

      if (error instanceof Error) {
        if (error.message === 'BOOKING_NOT_FOUND') {
          return res.status(404).json({
            error: {
              code: 'BOOKING_NOT_FOUND',
              message: 'Booking not found',
            },
          })
        }

        if (error.message === 'BOOKING_CANNOT_BE_MODIFIED') {
          return res.status(400).json({
            error: {
              code: 'BOOKING_CANNOT_BE_MODIFIED',
              message: 'Only pending or confirmed bookings can be modified',
            },
          })
        }
      }

      console.error('Add service error:', error)
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while adding service',
        },
      })
    }
  }
)

// DELETE /bookings/services/:serviceId - Remove service from booking
router.delete(
  '/services/:serviceId',
  requirePermission('booking:update'),
  async (req: Request, res: Response) => {
    try {
      const { serviceId } = req.params

      const result = await BookingService.removeService(
        serviceId,
        req.user!.userId,
        req.user!.companyId!
      )

      return res.json(result)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'SERVICE_NOT_FOUND') {
          return res.status(404).json({
            error: {
              code: 'SERVICE_NOT_FOUND',
              message: 'Service not found',
            },
          })
        }

        if (error.message === 'BOOKING_CANNOT_BE_MODIFIED') {
          return res.status(400).json({
            error: {
              code: 'BOOKING_CANNOT_BE_MODIFIED',
              message: 'Only pending or confirmed bookings can be modified',
            },
          })
        }
      }

      console.error('Remove service error:', error)
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while removing service',
        },
      })
    }
  }
)

export default router

