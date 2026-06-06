import { useEffect, useState } from 'react'
import api from '../../lib/api'
import ConfirmModal from '../../components/shared/ConfirmModal'
import { showSuccess } from '../../lib/toast'
import PageLoader from '../../components/shared/PageLoader'
import PageHeader from '../../components/shared/PageHeader'
import DataTable from '../../components/shared/DataTable'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'

const AdminUsers = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [filter, setFilter] = useState('all')

  const fetchUsers = () => {
    api.get('/api/superadmin/users')
      .then(({ data }) => { if (data.success) setUsers(data.users) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [])

  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const { data } = await api.delete(`/api/superadmin/users/${deleteTarget.id}`)
      showSuccess(data.message)
      setDeleteTarget(null)
      fetchUsers()
    } catch {
      // toast via interceptor
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <PageLoader message="Loading users..." />

  const filtered = filter === 'all' ? users : users.filter((u) => u.role === filter)

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (u) => <span className="capitalize">{u.role}</span> },
    {
      key: 'joined',
      label: 'Joined',
      render: (u) => new Date(u.createdAt).toLocaleDateString(),
    },
    {
      key: 'action',
      label: 'Action',
      render: (u) => u.role !== 'superadmin' ? (
        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(u)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50">
          Delete
        </Button>
      ) : (
        <span className="text-slate-400 text-xs">Protected</span>
      ),
    },
  ]

  return (
    <div className="page-container">
      <PageHeader
        title="User Management"
        description="Delete users — medical history records are always preserved."
      />

      <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-44 mb-4">
        <option value="all">All Roles</option>
        <option value="patient">Patients</option>
        <option value="doctor">Doctors</option>
        <option value="assistant">Assistants</option>
        <option value="admin">Admins</option>
      </Select>

      <DataTable columns={columns} data={filtered} emptyMessage="No users found." />

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete User"
        message={`Permanently delete ${deleteTarget?.name}? Medical history will be preserved if it exists.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

export default AdminUsers
