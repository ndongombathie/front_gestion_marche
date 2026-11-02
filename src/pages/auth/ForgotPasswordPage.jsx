import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Mail } from 'lucide-react'
import AuthShell from '../../components/AuthShell'
import { Button, Field, Input } from '../../components/ui'
import { api, errorMessage, unwrap } from '../../lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const data = await unwrap(api.post('/auth/forgot-password', { email }))
      setResult(data)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Mot de passe oublié"
      subtitle="Indiquez l’adresse email associée à votre compte pour recevoir un lien de réinitialisation."
      footer={<Link to="/connexion" className="font-semibold text-primary-700 hover:underline">Retour à la connexion</Link>}
    >
      {result ? (
        <div className="rounded-2xl border border-primary-200 bg-primary-50 p-5 text-sm text-slate-700">
          <p className="flex items-center gap-2 font-semibold text-primary-800"><CheckCircle2 className="h-5 w-5" /> Demande prise en compte</p>
          <p className="mt-2 leading-6">{result.message || 'Si un compte existe pour cette adresse, un lien de réinitialisation a été généré.'}</p>
          {result.token && (
            <div className="mt-3 rounded-xl bg-white p-3">
              <p className="text-xs font-semibold text-slate-500">Environnement de démonstration — token :</p>
              <code className="mt-1 block break-all text-xs text-primary-800">{result.token}</code>
            </div>
          )}
          <Link to="/connexion" className="btn-secondary mt-4 w-full">Retour à la connexion</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Adresse email" required>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.sn" className="pl-10" required />
            </div>
          </Field>
          {error && <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700">{error}</p>}
          <Button type="submit" loading={submitting} className="w-full">Envoyer la demande</Button>
        </form>
      )}
    </AuthShell>
  )
}
