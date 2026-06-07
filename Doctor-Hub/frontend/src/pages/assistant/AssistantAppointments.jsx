import { useEffect, useState } from 'react'
import { Calendar } from 'lucide-react'
import api from '../../lib/api'
import PageHeader from '../../components/shared/PageHeader'
import StatusBadge from '../../components/shared/StatusBadge'
import DataTable from '../../components/shared/DataTable'
import EmptyState from '../../components/shared/EmptyState'
import { Card } from '../../components/ui/Card'
import Select from '../../components/ui/Select'
import { mapAssistantAppointment, normalizeList } from '../../lib/assistantMappers'

const AssistantAppointments = () => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api.get('/api/assistant/appointments')
      .then(({ data }) => {
        if (data.success) {
          setAppointments(normalizeList(data, 'appointments', 'data').map(mapAssistantAppointment))
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all'
    ? appointments
    : appointments.filter((a) => {
        if (filter === 'pending') return ['payment_pending', 'payment_submitted', 'pending'].includes(a.status)
        return a.status === filter
      })

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
    { key: 'clinicName', label: 'Clinic' },
    { key: 'date', label: 'Date' },
    { key: 'timeSlot', label: 'Time' },
    {
      key: 'status',
      label: 'Status',
      render: (appt) => <StatusBadge status={appt.status} />,
    },
    {
      key: 'payment',
      label: 'Payment',
      render: (appt) => <StatusBadge status={appt.paymentStatus} />,
    },
  ]

  return (
    <div className="page-container">
      <PageHeader
        title="All Appointments"
        description="View all appointments for your assigned doctor"
        action={
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-40">
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        }
      />

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={Calendar}
            title="No appointments found"
            description="Appointments will appear here when patients book."
          />
        </Card>
      ) : (
        <DataTable columns={columns} data={filtered} />
      )}
    </div>
  )
}

export default AssistantAppointments
