import { useEffect, useState } from 'react'
import { Calendar } from 'lucide-react'
import api from '../../lib/api'
import PageHeader from '../../components/shared/PageHeader'
import StatusBadge from '../../components/shared/StatusBadge'
import DataTable from '../../components/shared/DataTable'
import EmptyState from '../../components/shared/EmptyState'
import { Card } from '../../components/ui/Card'
import Select from '../../components/ui/Select'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: '', date: '' })

  const fetchAppointments = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.status) params.set('status', filters.status)
    if (filters.date) params.set('date', filters.date)

    api.get(`/api/admin/appointments?${params}`)
      .then(({ data }) => { if (data.success) setAppointments(data.appointments || data.data || []) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchAppointments() }, [filters])

  const columns = [
    { key: 'patientName', label: 'Patient' },
    { key: 'doctorName', label: 'Doctor' },
    { key: 'clinicName', label: 'Clinic' },
    { key: 'date', label: 'Date' },
    { key: 'timeSlot', label: 'Time' },
    {
      key: 'status',
      label: 'Status',
      render: (a) => <StatusBadge status={a.status} />,
    },
    {
      key: 'payment',
      label: 'Payment',
      render: (a) => <StatusBadge status={a.paymentStatus} />,
    },
  ]

  return (
    <div className="page-container">
      <PageHeader
        title="Appointments"
        description="View and filter all platform appointments"
      />

      <div className="flex flex-wrap gap-3 mb-4">
        <Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="w-44">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
        <Input type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} className="w-44" />
        {(filters.status || filters.date) && (
          <Button variant="ghost" size="sm" onClick={() => setFilters({ status: '', date: '' })}>
            Clear filters
          </Button>
        )}
      </div>

      {loading ? (
        <div className="h-48 bg-white rounded-2xl animate-pulse" />
      ) : appointments.length === 0 ? (
        <Card>
          <EmptyState icon={Calendar} title="No appointments found" description="Try adjusting your filters." />
        </Card>
      ) : (
        <DataTable columns={columns} data={appointments} />
      )}
    </div>
  )
}

export default AdminAppointments
