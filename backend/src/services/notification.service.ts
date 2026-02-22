import prisma from '../lib/prisma'

interface CreateNotificationInput {
  companyId: string
  userId: string
  type: string
  title: string
  message: string
  sendEmail?: boolean
  sendSms?: boolean
}

interface DriverTaskNotificationInput {
  companyId: string
  driverId: string
  title: string
  message: string
  taskId: string
}

type NotificationPriority = 'HIGH' | 'MEDIUM' | 'LOW'

interface NotificationAction {
  label: string
  href: string
}

export class NotificationService {
  private static readonly MAX_TYPE_LENGTH = 64
  private static readonly MAX_TITLE_LENGTH = 120
  private static readonly MAX_MESSAGE_LENGTH = 180

  private static trimTo(value: string, maxLength: number): string {
    if (!value) return ''
    return value.length > maxLength ? value.slice(0, maxLength) : value
  }

  private static getPriorityByType(type: string): NotificationPriority {
    const normalized = type.toUpperCase()
    if (normalized.includes('OVERDUE') || normalized.includes('FAILED') || normalized.includes('ERROR')) {
      return 'HIGH'
    }
    if (normalized.includes('MAINTENANCE') || normalized.includes('LICENSE') || normalized.includes('INVOICE')) {
      return 'MEDIUM'
    }
    return 'LOW'
  }

  private static getActionByType(type: string): NotificationAction | null {
    switch (type.toUpperCase()) {
      case 'RENTAL_OVERDUE':
        return { label: 'Review Rentals', href: '/dashboard/rentals' }
      case 'MAINTENANCE_DUE':
        return { label: 'Open Maintenance', href: '/dashboard/maintenance' }
      case 'LICENSE_EXPIRING':
        return { label: 'Open Customers', href: '/dashboard/customers' }
      case 'INVOICE_PENDING':
      case 'INVOICE_PAID':
        return { label: 'Open Financial', href: '/dashboard/financial' }
      case 'BOOKING_CREATED':
      case 'BOOKING_CONFIRMED':
      case 'PICKUP_VERIFIED':
      case 'DROPOFF_VERIFIED':
        return { label: 'Open Bookings', href: '/dashboard/bookings' }
      case 'DRIVER_TASK_ASSIGNED':
      case 'DRIVER_TASK_UPDATED':
        return { label: 'Open Assigned Tasks', href: '/dashboard/bookings' }
      default:
        return null
    }
  }

  private static enrichNotification(notification: any) {
    return {
      ...notification,
      priority: this.getPriorityByType(notification.type),
      action: this.getActionByType(notification.type),
    }
  }

  static async createNotification(data: CreateNotificationInput) {
    const payload = {
      company_id: data.companyId,
      user_id: data.userId,
      type: this.trimTo(data.type, this.MAX_TYPE_LENGTH),
      title: this.trimTo(data.title, this.MAX_TITLE_LENGTH),
      message: this.trimTo(data.message, this.MAX_MESSAGE_LENGTH),
      sent_email: data.sendEmail || false,
      sent_sms: data.sendSms || false,
    }

    let notification
    try {
      notification = await prisma.notification.create({
        data: payload,
      })
    } catch (error: any) {
      if (error?.code === 'P2000') {
        notification = await prisma.notification.create({
          data: {
            ...payload,
            title: this.trimTo(payload.title, 80),
            message: this.trimTo(payload.message, 120),
          },
        })
      } else {
        throw error
      }
    }

    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    if (data.sendEmail) {
      console.log(`[EMAIL] To: ${data.userId}, Subject: ${data.title}`)
    }

    // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
    if (data.sendSms) {
      console.log(`[SMS] To: ${data.userId}, Message: ${data.message}`)
    }

    return notification
  }

  static async getUserNotifications(userId: string, unreadOnly = false) {
    const notifications = await prisma.notification.findMany({
      where: {
        user_id: userId,
        ...(unreadOnly && { is_read: false }),
      },
      orderBy: {
        created_at: 'desc',
      },
    })

    return notifications.map((item) => this.enrichNotification(item))
  }

  static async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: {
        user_id: userId,
        is_read: false,
      },
    })
  }

  static async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    })

    if (!notification) {
      throw new Error('NOTIFICATION_NOT_FOUND')
    }

    if (notification.user_id !== userId) {
      throw new Error('FORBIDDEN')
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { is_read: true },
    })
  }

  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        user_id: userId,
        is_read: false,
      },
      data: {
        is_read: true,
      },
    })
  }

  static async notifyDriverTaskAssigned(data: DriverTaskNotificationInput) {
    return this.createNotification({
      companyId: data.companyId,
      userId: data.driverId,
      type: 'DRIVER_TASK_ASSIGNED',
      title: data.title,
      message: data.message,
    })
  }

  static async notifyDriverTaskUpdated(data: DriverTaskNotificationInput) {
    return this.createNotification({
      companyId: data.companyId,
      userId: data.driverId,
      type: 'DRIVER_TASK_UPDATED',
      title: data.title,
      message: data.message,
    })
  }

  // Check for upcoming maintenance and send notifications
  static async checkMaintenanceDue(companyId: string) {
    const now = new Date()
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(now.getDate() + 7)

    const dueMaintenance = await prisma.maintenanceLog.findMany({
      where: {
        company_id: companyId,
        next_maintenance_date: {
          gte: now,
          lte: sevenDaysFromNow,
        },
      },
      include: {
        vehicle: {
          select: {
            brand: true,
            model: true,
            plate_number: true,
          },
        },
      },
    })

    // Get company managers
    const managers = await prisma.user.findMany({
      where: {
        company_id: companyId,
        role: 'COMPANY_MANAGER',
        is_active: true,
      },
    })

    for (const maintenance of dueMaintenance) {
      for (const manager of managers) {
        await this.createNotification({
          companyId,
          userId: manager.id,
          type: 'MAINTENANCE_DUE',
          title: 'Maintenance Due Soon',
          message: `Vehicle ${maintenance.vehicle.brand} ${maintenance.vehicle.model} (${maintenance.vehicle.plate_number}) has maintenance due on ${maintenance.next_maintenance_date?.toLocaleDateString()}`,
          sendEmail: true,
        })
      }
    }

    return dueMaintenance.length
  }

  // Check for overdue rentals and send notifications
  static async checkOverdueRentals(companyId: string) {
    const now = new Date()

    const overdueRentals = await prisma.rental.findMany({
      where: {
        company_id: companyId,
        status: 'ACTIVE',
        end_date: { lt: now },
      },
      include: {
        customer: true,
        vehicle: {
          select: {
            brand: true,
            model: true,
            plate_number: true,
          },
        },
      },
    })

    // Get company managers
    const managers = await prisma.user.findMany({
      where: {
        company_id: companyId,
        role: 'COMPANY_MANAGER',
        is_active: true,
      },
    })

    for (const rental of overdueRentals) {
      for (const manager of managers) {
        await this.createNotification({
          companyId,
          userId: manager.id,
          type: 'RENTAL_OVERDUE',
          title: 'Rental Overdue',
          message: `Rental for ${rental.customer.first_name} ${rental.customer.last_name} - Vehicle ${rental.vehicle.brand} ${rental.vehicle.model} (${rental.vehicle.plate_number}) is overdue`,
          sendEmail: true,
        })
      }
    }

    return overdueRentals.length
  }

  // Check for expiring licenses
  static async checkExpiringLicenses(companyId: string) {
    const now = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(now.getDate() + 30)

    // Check customer licenses
    const expiringCustomers = await prisma.customer.findMany({
      where: {
        company_id: companyId,
        license_expiry: {
          gte: now,
          lte: thirtyDaysFromNow,
        },
      },
    })

    // Check driver licenses
    const expiringDrivers = await prisma.driver.findMany({
      where: {
        company_id: companyId,
        license_expiry: {
          gte: now,
          lte: thirtyDaysFromNow,
        },
      },
    })

    // Get company managers
    const managers = await prisma.user.findMany({
      where: {
        company_id: companyId,
        role: 'COMPANY_MANAGER',
        is_active: true,
      },
    })

    for (const customer of expiringCustomers) {
      for (const manager of managers) {
        await this.createNotification({
          companyId,
          userId: manager.id,
          type: 'LICENSE_EXPIRING',
          title: 'Customer License Expiring',
          message: `Customer ${customer.first_name} ${customer.last_name}'s license expires on ${customer.license_expiry.toLocaleDateString()}`,
          sendEmail: true,
        })
      }
    }

    for (const driver of expiringDrivers) {
      for (const manager of managers) {
        await this.createNotification({
          companyId,
          userId: manager.id,
          type: 'LICENSE_EXPIRING',
          title: 'Driver License Expiring',
          message: `Driver ${driver.first_name} ${driver.last_name}'s license expires on ${driver.license_expiry.toLocaleDateString()}`,
          sendEmail: true,
        })
      }
    }

    return expiringCustomers.length + expiringDrivers.length
  }
}
