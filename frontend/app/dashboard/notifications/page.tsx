'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { toast } from 'sonner'

interface NotificationItem {
  id: string
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
  priority?: 'HIGH' | 'MEDIUM' | 'LOW'
  action?: {
    label: string
    href: string
  } | null
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isMarkingAll, setIsMarkingAll] = useState(false)

  useEffect(() => {
    loadNotifications()
  }, [unreadOnly])

  const loadNotifications = async () => {
    try {
      const data = await api.get<{ notifications: NotificationItem[]; unreadCount: number }>('/notifications', {
        unreadOnly,
      })
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch (error) {
      toast.error('Failed to load notifications')
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`, {})
      await loadNotifications()
    } catch (error) {
      toast.error('Failed to mark notification as read')
    }
  }

  const markAllAsRead = async () => {
    setIsMarkingAll(true)
    try {
      await api.patch('/notifications/read-all', {})
      toast.success('All notifications marked as read')
      await loadNotifications()
    } catch (error) {
      toast.error('Failed to mark all as read')
    } finally {
      setIsMarkingAll(false)
    }
  }

  const priorityColor = (priority?: string) => {
    if (priority === 'HIGH') return 'bg-red-100 text-red-800'
    if (priority === 'MEDIUM') return 'bg-yellow-100 text-yellow-800'
    return 'bg-gray-100 text-gray-800'
  }

  const sortedNotifications = useMemo(() => {
    const rank = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const
    return [...notifications].sort((a, b) => {
      const ap = rank[(a.priority || 'LOW') as keyof typeof rank]
      const bp = rank[(b.priority || 'LOW') as keyof typeof rank]
      if (ap !== bp) return ap - bp
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [notifications])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-2 text-sm text-gray-600">{unreadCount} unread notifications</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUnreadOnly((value) => !value)}
            className={`btn ${unreadOnly ? 'btn-primary' : 'btn-secondary'}`}
          >
            {unreadOnly ? 'Show All' : 'Unread Only'}
          </button>
          <button
            onClick={markAllAsRead}
            disabled={isMarkingAll || unreadCount === 0}
            className="btn btn-secondary inline-flex items-center"
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            {isMarkingAll ? 'Marking...' : 'Mark All Read'}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {sortedNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`card ${!notification.is_read ? 'bg-blue-50 border-blue-200' : ''}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center flex-wrap gap-2">
                  <Bell className="h-5 w-5 text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-900">{notification.title}</h3>
                  <span className={`badge ${priorityColor(notification.priority)}`}>
                    {notification.priority || 'LOW'}
                  </span>
                  {!notification.is_read && (
                    <span className="badge bg-blue-100 text-blue-800">New</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                <p className="mt-1 text-xs text-gray-500">{formatDate(notification.created_at)}</p>
                {notification.action && (
                  <div className="mt-3">
                    <Link href={notification.action.href} className="btn btn-primary text-sm">
                      {notification.action.label}
                    </Link>
                  </div>
                )}
              </div>
              {!notification.is_read && (
                <button
                  onClick={() => markAsRead(notification.id)}
                  className="text-blue-600 hover:text-blue-700"
                  title="Mark as read"
                >
                  <Check className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {sortedNotifications.length === 0 && (
        <div className="card text-center py-12">
          <Bell className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
          <p className="mt-1 text-sm text-gray-500">You're all caught up!</p>
        </div>
      )}
    </div>
  )
}
