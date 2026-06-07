import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import api from '../../lib/api'
import PageHeader from '../../components/shared/PageHeader'
import DataTable from '../../components/shared/DataTable'
import ConfirmModal from '../../components/shared/ConfirmModal'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Label from '../../components/ui/Label'
import Select from '../../components/ui/Select'
import { Card, CardContent } from '../../components/ui/Card'
import { showSuccess } from '../../lib/toast'

const EMPTY_FORM = {
  name: '',
  email: '',
  password: '',
  phone: '',
  doctor_id: '',
}

const AdminAssistants = () => {
  const [assistants, setAssistants] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchData = () => {
    setLoading(true)
    Promise.all([
      api.get('/api/assistants'),
      api.get('/api/admin/doctors'),
    ])
      .then(([asstRes, docRes]) => {
        if (asstRes.data.success) setAssistants(asstRes.data.data || [])
        if (docRes.data.success) setDoctors(docRes.data.doctors || docRes.data.data || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const openAdd = async () => {
    try {
      const { data } = await api.get('/api/admin/doctors')
      const freshDoctors = data.success ? (data.doctors || data.data || []) : doctors
      if (data.success) setDoctors(freshDoctors)
      const defaultDoctorId = freshDoctors[0]?.user_id || freshDoctors[0]?.id || ''
      setForm({ ...EMPTY_FORM, doctor_id: defaultDoctorId })
      setModal({ mode: 'add' })
    } catch {
      setForm({ ...EMPTY_FORM, doctor_id: doctors[0]?.user_id || doctors[0]?.id || '' })
      setModal({ mode: 'add' })
    }
  }

  const openEdit = (assistant) => {
    setForm({
      name: assistant.name || '',
      email: assistant.email || '',
      password: '',
      phone: assistant.phone || '',
      doctor_id: assistant.doctor_id || doctors[0]?.user_id || doctors[0]?.id || '',
    })
    setModal({ mode: 'edit', assistant })
  }

  const saveAssistant = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (modal.mode === 'add') {
        if (!form.doctor_id) {
          return
        }
        const { data } = await api.post('/api/assistants', {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          phone: form.phone?.trim() || '',
          doctor_id: form.doctor_id,
        })
        if (data.success) {
          showSuccess(data.message)
          setModal(null)
          fetchData()
        }
      } else {
        const { data } = await api.patch(`/api/assistants/${modal.assistant.user_id}`, {
          name: form.name,
          phone: form.phone,
          doctor_id: form.doctor_id,
        })
        if (data.success) {
          showSuccess(data.message)
          setModal(null)
          fetchData()
        }
      }
    } catch {
      // toast
    } finally {
      setSaving(false)
    }
  }

  const deleteAssistant = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const { data } = await api.delete(`/api/assistants/${deleteTarget.user_id}`)
      if (data.success) {
        showSuccess(data.message)
        setDeleteTarget(null)
        fetchData()
      }
    } catch {
      // toast
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    {
      key: 'name',
      label: 'Assistant',
      render: (a) => (
        <div>
          <p className="font-medium text-slate-900">{a.name}</p>
          <p className="text-xs text-slate-500">{a.email}</p>
        </div>
      ),
    },
    {
      key: 'doctor',
      label: 'Assigned Doctor',
      render: (a) => a.doctor_name || '—',
    },
    { key: 'phone', label: 'Phone', render: (a) => a.phone || '—' },
    {
      key: 'actions',
      label: 'Actions',
      render: (a) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => openEdit(a)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="danger" onClick={() => setDeleteTarget(a)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="page-container">
      <PageHeader
        title="Assistants"
        description="Create assistants and assign them to doctors. Assistants log in via Staff Login."
        action={
          <Button onClick={openAdd} disabled={doctors.length === 0}>
            <Plus className="w-4 h-4" /> Add Assistant
          </Button>
        }
      />

      {doctors.length === 0 && !loading && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-4">
          Add at least one doctor before creating assistants.
        </p>
      )}

      {loading ? (
        <div className="h-48 bg-white rounded-2xl animate-pulse" />
      ) : (
        <DataTable columns={columns} data={assistants} emptyMessage="No assistants yet." />
      )}

      {modal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                {modal.mode === 'add' ? 'Add Assistant' : 'Edit Assistant'}
              </h2>
              <form onSubmit={saveAssistant} className="space-y-4">
                <div>
                  <Label>Full name *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required disabled={modal.mode === 'edit'} />
                </div>
                {modal.mode === 'add' && (
                  <div>
                    <Label>Password *</Label>
                    <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
                  </div>
                )}
                <div>
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <Label>Assign to Doctor *</Label>
                  <Select value={form.doctor_id} onChange={(e) => setForm({ ...form, doctor_id: e.target.value })} required>
                    <option value="">Select doctor</option>
                    {doctors.map((d) => {
                      const doctorId = d.user_id || d.id
                      return (
                        <option key={doctorId} value={doctorId}>
                          {d.name} — {d.specialization || d.speciality || 'General Physician'}
                        </option>
                      )
                    })}
                  </Select>
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <Button type="button" variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
                  <Button type="submit" disabled={saving}>{saving ? 'Saving...' : modal.mode === 'add' ? 'Create Assistant' : 'Save'}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Assistant"
        message={`Delete assistant ${deleteTarget?.name}?`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={deleteAssistant}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

export default AdminAssistants
