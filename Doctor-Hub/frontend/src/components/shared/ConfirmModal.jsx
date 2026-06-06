import Button from '../ui/Button'

const ConfirmModal = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
  danger = false,
  loading = false,
  children,
}) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-elevated border border-surface-border">
        <div className="px-6 py-4 border-b border-surface-border">
          <h2 className="font-semibold text-slate-900">{title}</h2>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-slate-600">{message}</p>
          {children}
        </div>
        <div className="px-6 py-4 border-t border-surface-border flex gap-3 justify-end">
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} size="sm" onClick={onConfirm} disabled={loading}>
            {loading ? 'Processing...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
