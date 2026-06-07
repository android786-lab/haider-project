import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, ArrowRight, MessageCircle } from 'lucide-react'
import api from '../../lib/api'
import PageHeader from '../../components/shared/PageHeader'
import StatusBadge from '../../components/shared/StatusBadge'
import DataTable from '../../components/shared/DataTable'
import EmptyState from '../../components/shared/EmptyState'
import { Card } from '../../components/ui/Card'
import Select from '../../components/ui/Select'
import Badge from '../../components/ui/Badge'
import {
  mapDoctorAppointment,
  normalizeDoctorAppointments,
} from '../../lib/doctorPortalMappers'

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    Promise.all([
      api.get('/api/doctor/appointments'),
      api.get('/api/appointments/live'),
    ])
      .then(([apptRes, liveRes]) => {
        const liveIds = new Set((liveRes.data?.live || []).map((a) => a.id))
        if (apptRes.data.success) {
          setAppointments(
            normalizeDoctorAppointments(apptRes.data).map((row) =>
              mapDoctorAppointment(row, { isLive: liveIds.has(row.id) })
            )
          )
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all'
    ? appointments
    : appointments.filter((a) => a.status === filter)

  const columns = [
    {
      key: 'patient',
      label: 'Patient',
      render: (appt) => (
        <div>
          <p className="font-medium text-slate-900">{appt.patientName}</p>
          <p className="text-xs text-slate-500">{appt.patientEmail}</p>
        </div>
      ),
    },
    { key: 'date', label: 'Date' },
    { key: 'time', label: 'Time' },
    {
      key: 'status',
      label: 'Status',
      render: (appt) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={appt.status} />
          {appt.isLive && <Badge variant="success">Live</Badge>}
        </div>
      ),
    },
    {
      key: 'payment',
      label: 'Payment',
      render: (appt) => (
        <div>
          <StatusBadge status={appt.paymentStatus} />
          {appt.feeLabel && <p className="text-xs text-slate-500 mt-0.5">{appt.feeLabel}</p>}
        </div>
      ),
    },
    {
      key: 'action',
      label: '',
      render: (appt) => (
        <div className="flex items-center gap-3">
          {appt.chatEnabled && (
            <Link
              to={`/doctor/messages?patient=${appt.patient_id}`}
              className="text-primary-600 text-xs font-medium hover:underline inline-flex items-center gap-1"
            >
              <MessageCircle className="w-3 h-3" /> Chat
            </Link>
          )}
          <Link
            to={`/doctor/appointments/${appt.id}`}
            className="text-primary-600 text-xs font-medium hover:underline inline-flex items-center gap-1"
          >
            View <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      ),
    },
  ]

  return (
    <div className="page-container">
      <PageHeader
        title="Appointments"
        description="View and manage patient appointments"
        action={
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-40">
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="payment_pending">Payment Pending</option>
            <option value="payment_submitted">Payment Submitted</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
          </Select>
        }
      />

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={Calendar}
            title="No appointments found"
            description="Appointments will appear here when patients book with you."
          />
        </Card>
      ) : (
        <DataTable columns={columns} data={filtered} />
      )}
    </div>
  )
}

export default DoctorAppointments
