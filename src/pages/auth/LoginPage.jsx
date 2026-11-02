import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Lock, Mail, Sparkles } from 'lucide-react'
import AuthShell from '../../components/AuthShell'
import { Button, Field, Input } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { errorMessage } from '../../lib/api'

const DEMOS = [
  { label: 'Administrateur', email: 'admin@marchepro.sn', motDePasse: 'Admin@2026' },
  { label: 'Responsable', email: 'responsable@marchepro.sn', motDePasse: 'Responsable@2026' },
  { label: 'Commission', email: 'commission@marchepro.sn', motDePasse: 'Commission@2026' },
  { label: 'Directeur', email: 'directeur@marchepro.sn', motDePasse: 'Directeur@2026' },
  { label: 'Fournisseur', email: 'fournisseur@demo.sn', motDePasse: 'Fournisseur@2026' },
]

export default function LoginPage() {
  const { login, isAuthenticated, isFournisseur, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', motDePasse: '' })
  const [show, setShow] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!loading && isAuthenticated) {
    return <Navigate to={isFournisseur ? '/fournisseur' : '/dashboard'} replace />
  }

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const user = await login(form.email.trim(), form.motDePasse)
      const fallback = user.role === 'FOURNISSEUR' ? '/fournisseur' : '/dashboard'
      const from = location.state?.from?.pathname
      navigate(from && from !== '/connexion' ? from : fallback, { replace: true })
    } catch (err) {
      setError(errorMessage(err, 'Email ou mot de passe incorrect.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Connexion à votre espace"
      subtitle="Accédez à vos marchés, offres et livraisons en quelques secondes."
      footer={<>Pas encore de compte fournisseur ? <Link to="/inscription" className="font-semibold text-primary-700 hover:underline">S’inscrire</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Adresse email" required>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="vous@exemple.sn" className="pl-10" required autoComplete="email" />
          </div>
        </Field>
        <Field label="Mot de passe" required>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type={show ? 'text' : 'password'}
              value={form.motDePasse}
              onChange={(e) => setForm({ ...form, motDePasse: e.target.value })}
              placeholder="••••••••"
              className="pl-10 pr-10"
              required
              autoComplete="current-password"
            />
            <button type="button" onClick={() => setShow((v) => !v)} className="absolute -translate-y-1/2 right-3 top-1/2 text-slate-400 hover:text-slate-600">
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Field>
        <div className="flex items-center justify-between text-sm">
          <Link to="/mot-de-passe-oublie" className="font-medium text-primary-700 hover:underline">Mot de passe oublié ?</Link>
        </div>
        {error && <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700">{error}</p>}
        <Button type="submit" loading={submitting} className="w-full">Se connecter</Button>
      </form>

      <div className="p-4 bg-white border border-dashed mt-7 rounded-2xl border-slate-300">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Comptes de démonstration
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {DEMOS.map((d) => (
            <button
              key={d.email}
              onClick={() => {
                setForm({ email: d.email, motDePasse: d.motDePasse })
                toast.success(`Identifiants ${d.label} pré-remplis`)
              }}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-800"
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </AuthShell>
  )
}
