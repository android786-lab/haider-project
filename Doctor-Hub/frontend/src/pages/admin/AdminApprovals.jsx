import { useEffect, useState } from 'react'
import { UserCheck, UserX } from 'lucide-react'
import api from '../../lib/api'
import PageHeader from '../../components/shared/PageHeader'
import DataTable from '../../components/shared/DataTable'
import Button from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { showSuccess } from '../../lib/toast'

const AdminApprovals = () => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchRequests = () => {
    setLoading(true)
    api.get('/api/superadmin/admin-requests')
      .then(({ data }) => { if (data.success) setRequests(data.requests || data.data || []) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchRequests() }, [])

  const approve = async (id) => {
    try {
      const { data } = await api.put(`/api/superadmin/admin-requests/${id}/approve`)
      if (data.success) {
        showSuccess(data.message)
        fetchRequests()
      }
    } catch {
      // toast
    }
  }

  const reject = async (id) => {
    const reason = window.prompt('Rejection reason (optional):') || ''
    try {
      const { data } = await api.put(`/api/superadmin/admin-requests/${id}/reject`, { reason })
      if (data.success) {
        showSuccess(data.message)
        fetchRequests()
      }
    } catch {
      // toast
    }
  }

  const columns = [
    { key: 'name', label: 'Name', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone', render: (r) => r.phone || '—' },
    {
      key: 'date',
      label: 'Requested',
      render: (r) => new Date(r.created_at).toLocaleString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => approve(r.id)} className="bg-emerald-600 hover:bg-emerald-700">
            <UserCheck className="w-3.5 h-3.5" /> Approve
          </Button>
          <Button size="sm" variant="danger" onClick={() => reject(r.id)}>
            <UserX className="w-3.5 h-3.5" /> Reject
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="page-container">
      <PageHeader
        title="Admin Approvals"
        description="Review and approve new admin registration requests"
      />

      {loading ? (
        <div className="h-48 bg-white rounded-2xl animate-pulse" />
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            No pending admin registration requests.
          </CardContent>
        </Card>
      ) : (
        <DataTable columns={columns} data={requests} />
      )}
    </div>
  )
}

export default AdminApprovals
