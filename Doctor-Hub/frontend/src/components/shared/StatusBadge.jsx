import Badge from '../ui/Badge'

const STATUS_VARIANT = {
  pending: 'warning',
  payment_pending: 'warning',
  payment_submitted: 'info',
  confirmed: 'info',
  verified: 'success',
  completed: 'success',
  paid: 'success',
  rejected: 'danger',
  cancelled: 'danger',
  not_submitted: 'default',
}

const StatusBadge = ({ status }) => (
  <Badge variant={STATUS_VARIANT[status] || 'default'}>
    {status?.replace(/_/g, ' ')}
  </Badge>
)

export default StatusBadge
