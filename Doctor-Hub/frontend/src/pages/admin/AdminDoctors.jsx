import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import api from '../../lib/api'
import PageHeader from '../../components/shared/PageHeader'
import DataTable from '../../components/shared/DataTable'
import ConfirmModal from '../../components/shared/ConfirmModal'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Label from '../../components/ui/Label'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import { Card, CardContent } from '../../components/ui/Card'
import { showSuccess } from '../../lib/toast'

const EMPTY_FORM = {
  name: '',
  email: '',
  password: '',
  phone: '',
  speciality: 'General Physician',
  degree: 'MBBS',
  experience: '',
  about: '',
  fees: '',
  treatment: 'allopathic',
}

const AdminDoctors = () => {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchDoctors = () => {
    setLoading(true)
    api.get('/api/admin/doctors')
      .then(({ data }) => { if (data.success) setDoctors(data.doctors || data.data || []) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchDoctors() }, [])

  const openAdd = () => {
    setForm(EMPTY_FORM)
    setModal({ mode: 'add' })
  }

  const openEdit = (doctor) => {
    setForm({
      name: doctor.name || '',
      email: doctor.email || '',
      password: '',
      phone: doctor.phone || '',
      speciality: doctor.speciality || doctor.specialization || 'General Physician',
      degree: doctor.degree || 'MBBS',
      experience: doctor.experience || '',
      about: doctor.about || '',
      fees: doctor.fees ?? doctor.fee ?? '',
      treatment: doctor.treatment || doctor.treatmentType || 'allopathic',
    })
    setModal({ mode: 'edit', doctor })
  }

  const saveDoctor = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (modal.mode === 'add') {
        const { data } = await api.post('/api/admin/doctors', form)
        if (data.success) {
          showSuccess(data.message)
          setModal(null)
          fetchDoctors()
        }
      } else {
        const payload = { ...form }
        if (!payload.password) delete payload.password
        const { data } = await api.put(`/api/admin/doctors/${modal.doctor.id}`, payload)
        if (data.success) {
          showSuccess(data.message)
          setModal(null)
          fetchDoctors()
        }
      }
    } catch {
      // toast via interceptor
    } finally {
      setSaving(false)
    }
  }

  const toggleVerify = async (doctor) => {
    const endpoint = doctor.isVerified
      ? `/api/admin/doctors/${doctor.id}/unverify`
      : `/api/admin/doctors/${doctor.id}/verify`
    try {
      await api.put(endpoint)
      fetchDoctors()
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed.')
    }
  }

  const deleteDoctor = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const { data } = await api.delete(`/api/admin/doctors/${deleteTarget.id}`)
      if (data.success) {
        showSuccess(data.message)
        setDeleteTarget(null)
        fetchDoctors()
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
      label: 'Doctor',
      render: (d) => (
        <div>
          <p className="font-medium text-slate-900">{d.name}</p>
          <p className="text-xs text-slate-500">{d.email}</p>
        </div>
      ),
    },
    { key: 'specialization', label: 'Specialization', render: (d) => d.specialization || d.speciality || '—' },
    { key: 'treatmentType', label: 'Type', render: (d) => <span className="capitalize">{d.treatmentType || d.treatment || '—'}</span> },
    { key: 'fee', label: 'Fee', render: (d) => `Rs ${d.fee ?? d.fees ?? 0}` },
    {
      key: 'verified',
      label: 'Status',
      render: (d) => (
        <Badge variant={d.isVerified ? 'success' : 'default'}>
          {d.isVerified ? 'Verified' : 'Unverified'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (d) => (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="ghost" onClick={() => openEdit(d)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            variant={d.isVerified ? 'danger' : 'primary'}
            onClick={() => toggleVerify(d)}
            className={!d.isVerified ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
          >
            {d.isVerified ? 'Unverify' : 'Verify'}
          </Button>
          <Button size="sm" variant="danger" onClick={() => setDeleteTarget(d)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="page-container">
      <PageHeader
        title="Doctors"
        description="Add, update, or remove doctor accounts. Share credentials with doctors for login."
        action={
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4" /> Add Doctor
          </Button>
        }
      />

      {loading ? (
        <div className="h-48 bg-white rounded-2xl animate-pulse" />
      ) : (
        <DataTable columns={columns} data={doctors} emptyMessage="No doctors yet. Add your first doctor." />
      )}

      {modal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardContent className="pt-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                {modal.mode === 'add' ? 'Add New Doctor' : 'Edit Doctor'}
              </h2>
              <form onSubmit={saveDoctor} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Full name *</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required disabled={modal.mode === 'edit'} />
                  </div>
                </div>
                <div>
                  <Label>{modal.mode === 'add' ? 'Password *' : 'New password (leave blank to keep)'}</Label>
                  <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={modal.mode === 'add'} minLength={8} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Specialization</Label>
                    <Input value={form.speciality} onChange={(e) => setForm({ ...form, speciality: e.target.value })} />
                  </div>
                  <div>
                    <Label>Degree</Label>
                    <Input value={form.degree} onChange={(e) => setForm({ ...form, degree: e.target.value })} />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Experience</Label>
                    <Input value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} />
                  </div>
                  <div>
                    <Label>Fee (Rs)</Label>
                    <Input type="number" value={form.fees} onChange={(e) => setForm({ ...form, fees: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Treatment type</Label>
                  <Select value={form.treatment} onChange={(e) => setForm({ ...form, treatment: e.target.value })}>
                    <option value="allopathic">Allopathic</option>
                    <option value="homeopathic">Homeopathic</option>
                    <option value="herbal">Herbal</option>
                  </Select>
                </div>
                <div>
                  <Label>About</Label>
                  <Textarea value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} rows={3} />
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <Button type="button" variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
                  <Button type="submit" disabled={saving}>{saving ? 'Saving...' : modal.mode === 'add' ? 'Create Doctor' : 'Save Changes'}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Doctor"
        message={`Permanently delete Dr. ${deleteTarget?.name}? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={deleteDoctor}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

export default AdminDoctors
