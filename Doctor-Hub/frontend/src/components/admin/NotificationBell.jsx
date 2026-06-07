import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import Badge from '../ui/Badge'

const NotificationBell = () => {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchInbox = () => {
    api.get('/api/inbox')
      .then(({ data }) => {
        if (data.success) {
          setNotifications(data.notifications || data.data || [])
          setUnreadCount(data.unreadCount ?? 0)
        }
      })
      .catch(() => {})
  }

  useEffect(() => {
    fetchInbox()
    const interval = setInterval(fetchInbox, 30000)
    return () => clearInterval(interval)
  }, [])

  const markRead = async (id) => {
    await api.patch(`/api/inbox/${id}/read`)
    fetchInbox()
  }

  return (
    <div className="relative px-3 mb-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
      >
        <Bell className="w-4 h-4" />
        Notifications
        {unreadCount > 0 && (
          <Badge variant="danger" className="ml-auto">{unreadCount}</Badge>
        )}
      </button>

      {open && (
        <div className="absolute left-3 right-3 top-full mt-1 bg-white border border-surface-border rounded-xl shadow-elevated z-50 max-h-64 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-xs text-slate-400 p-4 text-center">No notifications</p>
          ) : (
            notifications.slice(0, 8).map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => markRead(n.id)}
                className={`w-full text-left px-3 py-2.5 border-b border-surface-border last:border-0 hover:bg-slate-50 ${!n.is_read ? 'bg-primary-50/50' : ''}`}
              >
                <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
              </button>
            ))
          )}
          {notifications.some((n) => n.type === 'admin_approval_request') && (
            <Link
              to="/admin/approvals"
              onClick={() => setOpen(false)}
              className="block text-center text-xs text-primary-600 font-medium py-2 hover:bg-slate-50"
            >
              Review admin requests →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationBell
