import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, CheckCircle2, KeyRound, Mail, MapPin, Phone, UserRound } from 'lucide-react'
import AuthShell from '../../components/AuthShell'
import { Button, Field, Input } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { errorMessage } from '../../lib/api'

const EMPTY = {
  raisonSociale: '',
  ninea: '',
  rccm: '',
  adresse: '',
  telephone: '',
  email: '',
  representant: '',
  motDePasse: '',
  confirmationMotDePasse: '',
}

export default function RegisterPage() {
  const { register } = useAuth()
  const [form, setForm] = useState(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.motDePasse !== form.confirmationMotDePasse) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    setSubmitting(true)
    try {
      await register(form)
      setDone(true)
    } catch (err) {
      setError(errorMessage(err, 'Impossible de créer le compte fournisseur.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <AuthShell title="Demande envoyée" subtitle="Votre dossier fournisseur a bien été enregistré.">
        <div className="rounded-2xl border border-primary-200 bg-primary-50 p-6 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-100 text-primary-700">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <h2 className="mt-4 font-display text-lg font-bold text-slate-900">Compte en attente de validation</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Un administrateur va examiner votre dossier. Vous recevrez une notification dès que votre compte sera validé.
            Vous pourrez ensuite vous connecter et soumettre des offres.
          </p>
          <Link to="/connexion" className="btn-primary mt-5">Aller à la connexion</Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      wide
      title="Devenir fournisseur"
      subtitle="Créez votre espace pour candidater aux marchés publics de matériels et équipements."
      footer={<>Vous avez déjà un compte ? <Link to="/connexion" className="font-semibold text-primary-700 hover:underline">Se connecter</Link></>}
    >
      <form onSubmit={submit} className="space-y-5">
        <div>
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400"><Building2 className="h-3.5 w-3.5" /> Informations de l’entreprise</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Raison sociale" required className="sm:col-span-2">
              <Input value={form.raisonSociale} onChange={set('raisonSociale')} placeholder="Ex. Tech Sénégal SARL" required maxLength={160} />
            </Field>
            <Field label="NINEA" required>
              <Input value={form.ninea} onChange={set('ninea')} placeholder="Numéro NINEA" required maxLength={40} />
            </Field>
            <Field label="RCCM">
              <Input value={form.rccm} onChange={set('rccm')} placeholder="Registre du commerce" maxLength={40} />
            </Field>
            <Field label="Adresse" className="sm:col-span-2">
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input value={form.adresse} onChange={set('adresse')} placeholder="Ville, quartier, rue…" className="pl-10" maxLength={255} />
              </div>
            </Field>
            <Field label="Téléphone" required>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input value={form.telephone} onChange={set('telephone')} placeholder="+221 …" className="pl-10" required maxLength={30} />
              </div>
            </Field>
            <Field label="Email professionnel" required>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input type="email" value={form.email} onChange={set('email')} placeholder="contact@entreprise.sn" className="pl-10" required />
              </div>
            </Field>
            <Field label="Représentant légal" required className="sm:col-span-2">
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input value={form.representant} onChange={set('representant')} placeholder="Nom et prénom du représentant" className="pl-10" required maxLength={120} />
              </div>
            </Field>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400"><KeyRound className="h-3.5 w-3.5" /> Sécurité du compte</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mot de passe" required hint="8 caractères minimum">
              <Input type="password" value={form.motDePasse} onChange={set('motDePasse')} required minLength={8} autoComplete="new-password" />
            </Field>
            <Field label="Confirmation" required>
              <Input type="password" value={form.confirmationMotDePasse} onChange={set('confirmationMotDePasse')} required autoComplete="new-password" />
            </Field>
          </div>
        </div>

        {error && <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700">{error}</p>}
        <Button type="submit" loading={submitting} className="w-full">Créer mon espace fournisseur</Button>
        <p className="text-center text-xs text-slate-400">
          En créant un compte, vous acceptez les conditions d’utilisation de la plateforme.
        </p>
      </form>
    </AuthShell>
  )
}
