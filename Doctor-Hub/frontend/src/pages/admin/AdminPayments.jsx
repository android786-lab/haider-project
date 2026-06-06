import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import api from '../../lib/api'
import PageHeader from '../../components/shared/PageHeader'
import StatusBadge from '../../components/shared/StatusBadge'
import DataTable from '../../components/shared/DataTable'

const API_URL = import.meta.env.VITE_API_URL || ''

const AdminPayments = () => {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    api.get('/api/admin/payments')
      .then(({ data }) => { if (data.success) setPayments(data.payments) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const columns = [
    { key: 'patientName', label: 'Patient' },
    { key: 'doctorName', label: 'Doctor' },
    { key: 'appointmentDate', label: 'Date' },
    {
      key: 'amount',
      label: 'Amount',
      render: (p) => <span className="font-medium text-slate-900">${p.amount}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (p) => <StatusBadge status={p.status} />,
    },
    {
      key: 'screenshot',
      label: 'Screenshot',
      render: (p) => p.screenshotUrl ? (
        <button onClick={() => setPreview(`${API_URL}${p.screenshotUrl}`)}
          className="text-primary-600 text-xs font-medium hover:underline">View</button>
      ) : (
        <span className="text-slate-400 text-xs">—</span>
      ),
    },
  ]

  return (
    <div className="page-container">
      <PageHeader
        title="Payments"
        description="View all payment records across the platform"
      />

      {loading ? (
        <div className="h-48 bg-white rounded-2xl animate-pulse" />
      ) : (
        <DataTable columns={columns} data={payments} emptyMessage="No payments found." />
      )}

      {preview && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setPreview(null)}>
          <div className="relative max-w-2xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreview(null)} className="absolute -top-3 -right-3 bg-white rounded-full w-8 h-8 shadow-lg flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
            <img src={preview} alt="Payment screenshot" className="max-w-full max-h-[85vh] rounded-2xl" />
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPayments
