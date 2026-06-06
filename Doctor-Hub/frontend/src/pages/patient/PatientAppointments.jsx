import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Plus } from 'lucide-react'
import api from '../../lib/api'
import PageHeader from '../../components/shared/PageHeader'
import StatusBadge from '../../components/shared/StatusBadge'
import EmptyState from '../../components/shared/EmptyState'
import { Card, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'

const PatientAppointments = () => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/patient/appointments')
      .then(({ data }) => { if (data.success) setAppointments(data.appointments) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-container">
      <PageHeader
        title="My Appointments"
        description="View and manage your upcoming and past appointments"
        action={
          <Link to="/patient/doctors">
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4" /> Book New
            </Button>
          </Link>
        }
      />

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)}
        </div>
      ) : appointments.length === 0 ? (
        <Card>
          <EmptyState
            icon={Calendar}
            title="No appointments yet"
            description="Browse doctors and book your first appointment."
            action={
              <Link to="/patient/doctors">
                <Button>Find a doctor</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {appointments.map((appt) => (
            <Card key={appt.id}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">Dr. {appt.doctorName}</h3>
                    <p className="text-sm text-slate-500">{appt.specialization}</p>
                    <p className="text-sm text-slate-500 mt-1">{appt.clinicName} — {appt.clinicAddress}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-900">{appt.date}</p>
                    <p className="text-sm text-slate-500">{appt.timeSlot}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <StatusBadge status={appt.status} />
                  <StatusBadge status={appt.paymentStatus} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default PatientAppointments
