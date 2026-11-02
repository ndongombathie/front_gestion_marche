import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('marchepro_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url || ''
    if (status === 401 && !url.includes('/auth/login') && !url.includes('/public')) {
      localStorage.removeItem('marchepro_token')
      localStorage.removeItem('marchepro_user')
      if (!window.location.pathname.startsWith('/connexion')) {
        window.location.href = '/connexion'
      }
    }
    return Promise.reject(error)
  },
)

export function errorMessage(error, fallback = 'Une erreur est survenue.') {
  const data = error?.response?.data
  if (!data) return error?.message || fallback
  if (typeof data === 'string') return data
  if (data.message && data.message !== 'Erreur de validation') return data.message
  if (data.errors) {
    const first = Object.values(data.errors)[0]
    if (first) return first
  }
  if (data.message) return data.message
  return fallback
}

export async function unwrap(promise) {
  const response = await promise
  return response.data?.data
}
