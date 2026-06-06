import axios from 'axios'
import { showError } from './toast'

const API_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/api/auth/login')) {
      localStorage.removeItem('token')
    }
    if (!error.config?.skipToast) {
      showError(error.response?.data?.message || error.message)
    }
    return Promise.reject(error)
  }
)

export default api
