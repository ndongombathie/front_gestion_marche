import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Building2, CheckCircle2, KeyRound, Mail, MapPin, Phone, Save, ShieldCheck, UserRound } from 'lucide-react'
import { api, errorMessage, unwrap } from '../../lib/api'
import { dateLong, humanize, initials } from '../../lib/format'
import { useAuth } from '../../contexts/AuthContext'
import { Badge, Button, Card, Field, Input, PageHeader } from '../../components/ui'

export default function ProfilPage() {
  const { user, updateUser, isFournisseur } = useAuth()
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', telephone: '', motDePasseActuel: '', nouveauMotDePasse: '' })
  const [saving, setSaving] = useState(false)
  const [fournisseur, setFournisseur] = useState(null)
  const [societe, setSociete] = useState({ raisonSociale: '', rccm: '', adresse: '', telephone: '', representant: '' })
  const [savingSociete, setSavingSociete] = useState(false)

  useEffect(() => {
    if (!user) return
    setForm({ nom: user.nom || '', prenom: user.prenom || '', email: user.email || '', telephone: user.telephone || '', motDePasseActuel: '', nouveauMotDePasse: '' })
    if (isFournisseur) {
      unwrap(api.get('/fournisseurs/me'))
        .then((f) => {
          setFournisseur(f)
          setSociete({ raisonSociale: f.raisonSociale || '', rccm: f.rccm || '', adresse: f.adresse || '', telephone: f.telephone || '', representant: f.representant || '' })
        })
        .catch(() => {})
    }
  }, [user, isFournisseur])

  const saveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        nom: form.nom,
        prenom: form.prenom,
        email: form.email,
        telephone: form.telephone || null,
        motDePasseActuel: form.motDePasseActuel || null,
        nouveauMotDePasse: form.nouveauMotDePasse || null,
      }
      const updated = await unwrap(api.put('/auth/profile', payload))
      updateUser(updated)
      setForm({ ...form, motDePasseActuel: '', nouveauMotDePasse: '' })
      toast.success('Profil mis à jour')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const saveSociete = async (e) => {
    e.preventDefault()
    setSavingSociete(true)
    try {
      const updated = await unwrap(api.put('/fournisseurs/me', societe))
      setFournisseur(updated)
      toast.success('Informations de l’entreprise mises à jour')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSavingSociete(false)
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Compte" title="Mon profil" subtitle="Gérez vos informations personnelles, votre mot de passe et votre entreprise." />

      <div className="grid gap-5 lg:grid-cols-[.8fr_1.4fr]">
        <div className="space-y-5">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-primary-900 to-primary-700 px-5 py-7 text-center text-white">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white/15 text-xl font-bold ring-1 ring-white/25">{initials(user?.nomComplet)}</span>
              <p className="mt-3 font-display text-lg font-bold">{user?.nomComplet}</p>
              <p className="text-xs text-primary-100/80">{user?.email}</p>
              <div className="mt-2 flex justify-center"><span className="badge bg-white/15 text-white ring-white/25">{humanize(user?.role)}</span></div>
            </div>
            <div className="space-y-3 p-5 text-sm">
              <Row icon={UserRound} label="Nom complet" value={user?.nomComplet} />
              <Row icon={Mail} label="Email" value={user?.email} />
              <Row icon={Phone} label="Téléphone" value={user?.telephone || '—'} />
              <Row icon={ShieldCheck} label="Statut" value={<Badge value={user?.statut} />} />
              <Row icon={CheckCircle2} label="Compte créé" value={dateLong(user?.dateCreation)} />
              {isFournisseur && fournisseur && <Row icon={Building2} label="Entreprise" value={fournisseur.raisonSociale} />}
              {isFournisseur && fournisseur && <Row icon={ShieldCheck} label="Validation" value={<Badge value={fournisseur.statutValidation} />} />}
            </div>
          </Card>

          {isFournisseur && fournisseur?.statutValidation === 'EN_ATTENTE' && (
            <Card className="border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Votre dossier est en attente de validation. Vous ne pourrez pas soumettre d’offres tant qu’un administrateur ne l’a pas approuvé.
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="font-display text-base font-bold text-slate-900">Informations personnelles</h2>
            <form onSubmit={saveProfile} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nom" required><Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required /></Field>
                <Field label="Prénom" required><Input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} required /></Field>
                <Field label="Email" required><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></Field>
                <Field label="Téléphone"><Input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} /></Field>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400"><KeyRound className="h-3.5 w-3.5" /> Changer le mot de passe</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Mot de passe actuel"><Input type="password" value={form.motDePasseActuel} onChange={(e) => setForm({ ...form, motDePasseActuel: e.target.value })} autoComplete="current-password" /></Field>
                  <Field label="Nouveau mot de passe" hint="8 caractères minimum"><Input type="password" value={form.nouveauMotDePasse} onChange={(e) => setForm({ ...form, nouveauMotDePasse: e.target.value })} autoComplete="new-password" minLength={8} /></Field>
                </div>
              </div>
              <div className="flex justify-end"><Button type="submit" loading={saving}><Save className="h-4 w-4" /> Enregistrer</Button></div>
            </form>
          </Card>

          {isFournisseur && (
            <Card className="p-5">
              <h2 className="font-display text-base font-bold text-slate-900">Informations de l’entreprise</h2>
              <form onSubmit={saveSociete} className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Raison sociale" required className="sm:col-span-2"><Input value={societe.raisonSociale} onChange={(e) => setSociete({ ...societe, raisonSociale: e.target.value })} required /></Field>
                  <Field label="NINEA"><Input value={fournisseur?.ninea || ''} disabled /></Field>
                  <Field label="RCCM"><Input value={societe.rccm} onChange={(e) => setSociete({ ...societe, rccm: e.target.value })} /></Field>
                  <Field label="Téléphone" required><Input value={societe.telephone} onChange={(e) => setSociete({ ...societe, telephone: e.target.value })} required /></Field>
                  <Field label="Représentant" required><Input value={societe.representant} onChange={(e) => setSociete({ ...societe, representant: e.target.value })} required /></Field>
                  <Field label="Adresse" className="sm:col-span-2"><Input value={societe.adresse} onChange={(e) => setSociete({ ...societe, adresse: e.target.value })} /></Field>
                </div>
                <div className="flex justify-end"><Button type="submit" loading={savingSociete}><Save className="h-4 w-4" /> Mettre à jour</Button></div>
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-400">{label}</p>
        <div className="truncate text-sm font-medium text-slate-700">{value || '—'}</div>
      </div>
    </div>
  )
}
