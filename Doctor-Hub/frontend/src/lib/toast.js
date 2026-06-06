import { toast } from 'react-toastify'

export const showSuccess = (message) => toast.success(message)
export const showError = (message) => toast.error(message || 'Something went wrong.')
export const showInfo = (message) => toast.info(message)

export const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || 'Something went wrong.'
