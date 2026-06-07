import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import Badge from '../ui/Badge'

const InboxBell = ({ messagesPath = '/patient/messages' }) => {
  const navigate = useNavigate()
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
    const interval = setInterval(fetchInbox, 20000)
    return () => clearInterval(interval)
  }, [])

  const openNotification = async (notification) => {
    await api.patch(`/api/inbox/${notification.id}/read`).catch(() => {})
    fetchInbox()
    setOpen(false)

    if (['appointment_started', 'new_message'].includes(notification.type)) {
      const meta = notification.metadata || {}
      const params = new URLSearchParams()
      if (messagesPath.includes('/doctor') && meta.patient_id) {
        params.set('patient_id', meta.patient_id)
      } else if (meta.doctor_id) {
        params.set('doctor_id', meta.doctor_id)
      }
      navigate(`${messagesPath}?${params.toString()}`)
      return
    }

    if (notification.metadata?.chat_path) {
      navigate(notification.metadata.chat_path)
    }
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
        <div className="absolute left-3 right-3 top-full mt-1 bg-white border border-surface-border rounded-xl shadow-elevated z-50 max-h-72 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-xs text-slate-400 p-4 text-center">No notifications</p>
          ) : (
            notifications.slice(0, 10).map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => openNotification(n)}
                className={`w-full text-left px-3 py-2.5 border-b border-surface-border last:border-0 hover:bg-slate-50 ${!n.is_read ? 'bg-primary-50/50' : ''}`}
              >
                <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
              </button>
            ))
          )}
          <Link
            to={messagesPath}
            onClick={() => setOpen(false)}
            className="block text-center text-xs text-primary-600 font-medium py-2 hover:bg-slate-50"
          >
            Open Messages →
          </Link>
        </div>
      )}
    </div>
  )
}

export default InboxBell
