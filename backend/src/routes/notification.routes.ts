import { Router, Request, Response } from 'express'
import { NotificationService } from '../services/notification.service'
import { authenticate } from '../middleware/auth'

const router = Router()

router.use(authenticate)

// GET /notifications - Get user notifications
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId
    const unreadOnly = req.query.unreadOnly === 'true'

    const notifications = await NotificationService.getUserNotifications(userId, unreadOnly)
    const unreadCount = await NotificationService.getUnreadCount(userId)
    return res.json({ notifications, unreadCount })
  } catch (error) {
    console.error('Get notifications error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching notifications',
      },
    })
  }
})

// PATCH /notifications/:id/read - Mark notification as read
router.patch('/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId

    const notification = await NotificationService.markAsRead(id, userId)
    return res.json({
      message: 'Notification marked as read',
      notification,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'NOTIFICATION_NOT_FOUND') {
      return res.status(404).json({
        error: {
          code: 'NOTIFICATION_NOT_FOUND',
          message: 'Notification not found',
        },
      })
    }

    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You can only mark your own notifications as read',
        },
      })
    }

    console.error('Mark notification as read error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while marking notification as read',
      },
    })
  }
})

// PATCH /notifications/read-all - Mark all notifications as read
router.patch('/read-all', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId
    const result = await NotificationService.markAllAsRead(userId)
    return res.json({
      message: 'All notifications marked as read',
      count: result.count,
    })
  } catch (error) {
    console.error('Mark all notifications as read error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while marking all notifications as read',
      },
    })
  }
})

export default router


