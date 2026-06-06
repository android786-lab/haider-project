import { useEffect, useState } from 'react'
import { Shield } from 'lucide-react'
import api from '../../lib/api'
import ConfirmModal from '../../components/shared/ConfirmModal'
import { showSuccess } from '../../lib/toast'
import PageLoader from '../../components/shared/PageLoader'
import PageHeader from '../../components/shared/PageHeader'
import DataTable from '../../components/shared/DataTable'
import { Card, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

const AdminAdmins = () => {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [demoteTarget, setDemoteTarget] = useState(null)
  const [message, setMessage] = useState('')

  const fetchAdmins = () => {
    api.get('/api/superadmin/admins')
      .then(({ data }) => { if (data.success) setAdmins(data.admins) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchAdmins() }, [])

  const promote = async (e) => {
    e.preventDefault()
    setMessage('')
    try {
      const { data } = await api.post('/api/superadmin/admins', { email })
      if (data.success) {
        showSuccess(data.message)
        setEmail('')
        fetchAdmins()
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Promotion failed.')
    }
  }

  const [demoting, setDemoting] = useState(false)

  const demote = async () => {
    if (!demoteTarget) return
    setDemoting(true)
    try {
      const { data } = await api.put(`/api/superadmin/admins/${demoteTarget.id}/demote`)
      showSuccess(data.message)
      setDemoteTarget(null)
      fetchAdmins()
    } catch {
      // toast via interceptor
    } finally {
      setDemoting(false)
    }
  }

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'since',
      label: 'Since',
      render: (a) => new Date(a.createdAt).toLocaleDateString(),
    },
    {
      key: 'action',
      label: 'Action',
      render: (a) => (
        <Button variant="ghost" size="sm" onClick={() => setDemoteTarget(a)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50">
          Demote
        </Button>
      ),
    },
  ]

  if (loading) return <PageLoader message="Loading admins..." />

  return (
    <div className="page-container">
      <PageHeader
        title="Admin Management"
        description="Promote users to admin or remove admin privileges"
      />

      <Card className="mb-6">
        <CardContent className="pt-5">
          <form onSubmit={promote} className="flex gap-3">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="User email to promote"
              required
              className="flex-1"
            />
            <Button type="submit">
              <Shield className="w-4 h-4" /> Promote to Admin
            </Button>
          </form>
        </CardContent>
      </Card>

      {message && <p className="text-sm text-emerald-600 mb-4">{message}</p>}

      <DataTable columns={columns} data={admins} emptyMessage="No admins found." />

      <ConfirmModal
        open={!!demoteTarget}
        title="Demote Admin"
        message={`Remove admin privileges from ${demoteTarget?.name}? They will become a patient.`}
        confirmLabel="Demote"
        danger
        loading={demoting}
        onConfirm={demote}
        onCancel={() => setDemoteTarget(null)}
      />
    </div>
  )
}

export default AdminAdmins
