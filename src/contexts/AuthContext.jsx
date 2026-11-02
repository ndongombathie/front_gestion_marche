import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { api, unwrap } from '../lib/api'

const AuthContext = createContext(null)

const TOKEN_KEY = 'marchepro_token'
const USER_KEY = 'marchepro_user'

function readUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null')
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(readUser)
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)))

  const persist = useCallback((nextToken, nextUser) => {
    if (nextToken) localStorage.setItem(TOKEN_KEY, nextToken)
    else localStorage.removeItem(TOKEN_KEY)
    if (nextUser) localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
    else localStorage.removeItem(USER_KEY)
    setToken(nextToken)
    setUser(nextUser)
  }, [])

  const refresh = useCallback(async () => {
    if (!localStorage.getItem(TOKEN_KEY)) return null
    try {
      const me = await unwrap(api.get('/auth/me'))
      persist(localStorage.getItem(TOKEN_KEY), me)
      return me
    } catch {
      return null
    }
  }, [persist])

  useEffect(() => {
    let active = true
    ;(async () => {
      if (!localStorage.getItem(TOKEN_KEY)) {
        setLoading(false)
        return
      }
      const me = await refresh()
      if (!active) return
      if (!me) persist(null, null)
      setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [refresh, persist])

  const login = useCallback(
    async (email, motDePasse) => {
      const data = await unwrap(api.post('/auth/login', { email, motDePasse }))
      persist(data.token, data.utilisateur)
      toast.success(`Bienvenue, ${data.utilisateur.prenom || data.utilisateur.nomComplet}`)
      return data.utilisateur
    },
    [persist],
  )

  const register = useCallback(
    async (payload) => {
      const data = await unwrap(api.post('/auth/register/fournisseur', payload))
      toast.success('Inscription enregistrée. Votre compte sera validé par un administrateur.')
      return data
    },
    [],
  )

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      /* ignore */
    }
    persist(null, null)
  }, [persist])

  const updateUser = useCallback(
    (nextUser) => {
      persist(localStorage.getItem(TOKEN_KEY), nextUser)
    },
    [persist],
  )

  const hasRole = useCallback(
    (...roles) => {
      if (!user) return false
      const flat = roles.flat()
      return flat.includes(user.role)
    },
    [user],
  )

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token && user),
      isFournisseur: user?.role === 'FOURNISSEUR',
      isInternal: Boolean(user && user.role !== 'FOURNISSEUR'),
      isAdmin: user?.role === 'ADMINISTRATEUR',
      login,
      register,
      logout,
      refresh,
      updateUser,
      hasRole,
    }),
    [token, user, loading, login, register, logout, refresh, updateUser, hasRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
