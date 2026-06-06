import { useEffect, useState } from 'react'
import { CalendarCheck } from 'lucide-react'
import api from '../../lib/api'
import PageHeader from '../../components/shared/PageHeader'
import StatusBadge from '../../components/shared/StatusBadge'
import EmptyState from '../../components/shared/EmptyState'
import { Card, CardContent } from '../../components/ui/Card'

const AssistantBookings = () => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/assistant/bookings')
      .then(({ data }) => { if (data.success) setBookings(data.bookings) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-container">
      <PageHeader
        title="Bookings"
        description="All bookings ordered by most recent"
      />

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)}
        </div>
      ) : bookings.length === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarCheck}
            title="No bookings yet"
            description="Patient bookings will appear here."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Card key={b.id}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">{b.patientName}</h3>
                    <p className="text-sm text-slate-500">{b.clinicName} — {b.clinicAddress}</p>
                    <p className="text-sm text-slate-500 mt-1">{b.date} at {b.timeSlot}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Booked {new Date(b.createdAt).toLocaleDateString()}</p>
                    {b.amount && <p className="text-sm font-medium text-slate-900 mt-1">${b.amount}</p>}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <StatusBadge status={b.status} />
                  <StatusBadge status={b.paymentStatus} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default AssistantBookings
