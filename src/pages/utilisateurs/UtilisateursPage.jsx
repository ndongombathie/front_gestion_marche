import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Mail, Plus, Search, Shield, ShieldOff, UserPlus, Users } from 'lucide-react'
import { api, errorMessage, unwrap } from '../../lib/api'
import { dateShort, humanize, initials } from '../../lib/format'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  LoadingScreen,
  Modal,
  PageHeader,
  Pagination,
  Select,
  Textarea,
} from '../../components/ui'

const ROLES = [
  ['ADMINISTRATEUR', 'Administrateur'],
  ['RESPONSABLE_SERVICE', 'Responsable de service'],
  ['MEMBRE_COMMISSION', 'Membre de commission'],
  ['DIRECTEUR', 'Directeur'],
  ['FOURNISSEUR', 'Fournisseur'],
]

export default function UtilisateursPage() {
  const [role, setRole] = useState('')
  const [statut, setStatut] = useState('')
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [busy, setBusy] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    unwrap(api.get('/utilisateurs', { params: { role: role || undefined, statut: statut || undefined, q: q || undefined, page, size: 10, sort: 'nom' } }))
      .then(setData)
      .catch(() => setData({ contenu: [], totalElements: 0, totalPages: 1, page: 0 }))
      .finally(() => setLoading(false))
  }, [role, statut, q, page])

  useEffect(load, [load])

  const submitSearch = (e) => {
    e.preventDefault()
    setPage(0)
    setQ(search.trim())
  }

  const toggle = async (u) => {
    setBusy(u.id)
    try {
      await unwrap(api.put(`/utilisateurs/${u.id}/statut`, { statut: u.statut === 'ACTIF' ? 'INACTIF' : 'ACTIF' }))
      toast.success(u.statut === 'ACTIF' ? 'Utilisateur désactivé' : 'Utilisateur activé')
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy('')
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Utilisateurs"
        subtitle="Gérez les comptes internes, les rôles et les accès à la plateforme."
        actions={<Button onClick={() => setCreateOpen(true)}><UserPlus className="h-4 w-4" /> Nouvel utilisateur</Button>}
      />

      <Card className="mb-4 p-3.5">
        <form onSubmit={submitSearch} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom, email…" className="pl-10" />
          </div>
          <Select value={role} onChange={(e) => { setRole(e.target.value); setPage(0) }} className="sm:w-52">
            <option value="">Tous les rôles</option>
            {ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
          <Select value={statut} onChange={(e) => { setStatut(e.target.value); setPage(0) }} className="sm:w-44">
            <option value="">Tous les statuts</option>
            <option value="ACTIF">Actifs</option>
            <option value="INACTIF">Inactifs</option>
            <option value="EN_ATTENTE">En attente</option>
          </Select>
          <Button type="submit" variant="secondary">Rechercher</Button>
        </form>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <LoadingScreen />
        ) : data?.contenu?.length ? (
          <>
            <div className="table-wrap border-0">
              <table className="table-base">
                <thead><tr><th>Utilisateur</th><th>Rôle</th><th>Statut</th><th>Dernière connexion</th><th>Créé le</th><th className="text-right">Actions</th></tr></thead>
                <tbody>
                  {data.contenu.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-100 text-xs font-bold text-primary-800">{initials(u.nomComplet)}</span>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-800">{u.nomComplet}</p>
                            <p className="flex items-center gap-1 truncate text-xs text-slate-500"><Mail className="h-3 w-3" /> {u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td><span className="badge bg-slate-100 text-slate-600 ring-slate-200">{humanize(u.role)}</span></td>
                      <td><Badge value={u.statut} /></td>
                      <td className="whitespace-nowrap text-slate-500">{u.derniereConnexion ? dateShort(u.derniereConnexion) : 'Jamais'}</td>
                      <td className="whitespace-nowrap text-slate-500">{dateShort(u.dateCreation)}</td>
                      <td>
                        <div className="flex justify-end">
                          <button onClick={() => toggle(u)} disabled={busy === u.id} className={`rounded-lg p-1.5 ${u.statut === 'ACTIF' ? 'text-slate-400 hover:bg-rose-50 hover:text-rose-600' : 'text-slate-400 hover:bg-primary-50 hover:text-primary-700'}`} title={u.statut === 'ACTIF' ? 'Désactiver' : 'Activer'}>
                            {u.statut === 'ACTIF' ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onChange={setPage} />
          </>
        ) : (
          <EmptyState icon={Users} title="Aucun utilisateur" description="Aucun compte ne correspond à votre recherche." />
        )}
      </Card>

      <CreateModal open={createOpen} onClose={() => setCreateOpen(false)} onDone={() => { setCreateOpen(false); toast.success('Utilisateur créé'); load() }} />
    </div>
  )
}

function CreateModal({ open, onClose, onDone }) {
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', telephone: '', role: 'RESPONSABLE_SERVICE', motDePasse: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setForm({ nom: '', prenom: '', email: '', telephone: '', role: 'RESPONSABLE_SERVICE', motDePasse: '' })
      setError('')
    }
  }, [open])

  const submit = async () => {
    setError('')
    setLoading(true)
    try {
      await unwrap(api.post('/utilisateurs', { ...form, telephone: form.telephone || null }))
      onDone()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nouvel utilisateur interne" description="Créez un compte et attribuez-lui un rôle." footer={<><Button variant="secondary" onClick={onClose}>Annuler</Button><Button onClick={submit} loading={loading}><Plus className="h-4 w-4" /> Créer</Button></>}>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom" required><Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required /></Field>
          <Field label="Prénom" required><Input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} required /></Field>
          <Field label="Email" required><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></Field>
          <Field label="Téléphone"><Input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} /></Field>
          <Field label="Rôle" required>
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {ROLES.filter(([v]) => v !== 'FOURNISSEUR').map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </Field>
          <Field label="Mot de passe" required hint="8 caractères minimum"><Input type="password" value={form.motDePasse} onChange={(e) => setForm({ ...form, motDePasse: e.target.value })} required minLength={8} /></Field>
        </div>
        {error && <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700">{error}</p>}
      </div>
    </Modal>
  )
}
