import { useEffect, useState } from 'react'
import { CreditCard, X } from 'lucide-react'
import api from '../../lib/api'
import ConfirmModal from '../../components/shared/ConfirmModal'
import PageLoader from '../../components/shared/PageLoader'
import PageHeader from '../../components/shared/PageHeader'
import DataTable from '../../components/shared/DataTable'
import EmptyState from '../../components/shared/EmptyState'
import { Card } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Textarea from '../../components/ui/Textarea'
import { showSuccess } from '../../lib/toast'
import { mapPendingPayment, normalizeList, resolveAssetUrl } from '../../lib/assistantMappers'

const API_URL = import.meta.env.VITE_API_URL || ''

const AssistantPendingPayments = () => {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [preview, setPreview] = useState(null)

  const fetchPayments = () => {
    setLoading(true)
    api.get('/api/assistant/pending-payments')
      .then(({ data }) => {
        if (data.success) {
          setPayments(normalizeList(data, 'payments', 'data').map(mapPendingPayment))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchPayments() }, [])

  const handleAction = async () => {
    if (!modal) return
    if (modal.type === 'reject' && !rejectReason.trim()) return

    setActionLoading(true)
    try {
      if (modal.type === 'verify') {
        const { data } = await api.put(`/api/assistant/payments/${modal.payment.id}/verify`)
        showSuccess(data.message || 'Payment verified. Appointment confirmed.')
      } else {
        const { data } = await api.put(`/api/assistant/payments/${modal.payment.id}/reject`, { reason: rejectReason })
        showSuccess(data.message || 'Payment rejected.')
      }
      setModal(null)
      setRejectReason('')
      fetchPayments()
    } catch {
      // toast handled by interceptor
    } finally {
      setActionLoading(false)
    }
  }

  const columns = [
    {
      key: 'patient',
      label: 'Patient',
      render: (p) => (
        <div>
          <p className="font-medium text-slate-900">{p.patientName}</p>
          <p className="text-xs text-slate-500">{p.patientEmail}</p>
        </div>
      ),
    },
    {
      key: 'appointment',
      label: 'Appointment',
      render: (p) => `${p.appointmentDate} at ${p.timeSlot}`,
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (p) => <span className="font-medium text-slate-900">${p.amount}</span>,
    },
    {
      key: 'screenshot',
      label: 'Screenshot',
      render: (p) => p.screenshotUrl ? (
        <button onClick={() => setPreview(resolveAssetUrl(p.screenshotUrl, API_URL))}
          className="text-primary-600 text-xs font-medium hover:underline">View</button>
      ) : <span className="text-slate-400 text-xs">—</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (p) => (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setModal({ type: 'verify', payment: p })}
            className="bg-emerald-600 hover:bg-emerald-700">
            Verify
          </Button>
          <Button size="sm" variant="danger" onClick={() => setModal({ type: 'reject', payment: p })}>
            Reject
          </Button>
        </div>
      ),
    },
  ]

  if (loading) return <PageLoader message="Loading pending payments..." />

  return (
    <div className="page-container">
      <PageHeader
        title="Pending Payments"
        description="Review and verify patient payment submissions"
      />

      {payments.length === 0 ? (
        <Card>
          <EmptyState
            icon={CreditCard}
            title="No pending payments"
            description="All payments have been reviewed."
          />
        </Card>
      ) : (
        <DataTable columns={columns} data={payments} />
      )}

      <ConfirmModal
        open={!!modal}
        title={modal?.type === 'verify' ? 'Verify Payment' : 'Reject Payment'}
        message={
          modal?.type === 'verify'
            ? `Confirm payment of $${modal?.payment?.amount} from ${modal?.payment?.patientName}? The appointment will be marked as confirmed.`
            : `Reject payment from ${modal?.payment?.patientName}? Please provide a reason.`
        }
        confirmLabel={modal?.type === 'verify' ? 'Verify' : 'Reject'}
        danger={modal?.type === 'reject'}
        loading={actionLoading}
        onConfirm={handleAction}
        onCancel={() => { setModal(null); setRejectReason('') }}
      >
        {modal?.type === 'reject' && (
          <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection..." rows={3}
            className="mt-3 focus:ring-red-500/20 focus:border-red-500" />
        )}
      </ConfirmModal>

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

export default AssistantPendingPayments
