import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { CalendarClock, Eye, Megaphone, Pencil, Plus, Search, ShoppingBag, Timer, X } from 'lucide-react'
import { api, errorMessage, unwrap } from '../../lib/api'
import { dateShort, dateTime, daysLeft, fcfa } from '../../lib/format'
import { useAuth } from '../../contexts/AuthContext'
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
  Tabs,
  Textarea,
} from '../../components/ui'

const STATUSES = [
  { value: '', label: 'Tous' },
  { value: 'BROUILLON', label: 'Brouillons' },
  { value: 'PUBLIE', label: 'Publiés' },
  { value: 'CLOTURE', label: 'Clôturés' },
  { value: 'ANNULE', label: 'Annulés' },
]

function toLocalInput(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function tomorrowInput() {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  d.setHours(12, 0, 0, 0)
  return toLocalInput(d)
}

export default function AppelsOffresPage() {
  const { hasRole } = useAuth()
  const [params, setParams] = useSearchParams()
  const [statut, setStatut] = useState('')
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [marches, setMarches] = useState([])
  const [cancel, setCancel] = useState(null)
  const [prolong, setProlong] = useState(null)

  const canManage = hasRole('RESPONSABLE_SERVICE', 'ADMINISTRATEUR')
  const preselectedMarche = params.get('marcheId')

  const load = useCallback(() => {
    setLoading(true)
    unwrap(api.get('/appels-offres', { params: { statut: statut || undefined, q: q || undefined, page, size: 10, sort: 'dateCreation,desc' } }))
      .then(setData)
      .catch(() => setData({ contenu: [], totalElements: 0, totalPages: 1, page: 0 }))
      .finally(() => setLoading(false))
  }, [statut, q, page])

  useEffect(load, [load])
  useEffect(() => {
    if (canManage) unwrap(api.get('/marches', { params: { size: 100, sort: 'dateCreation,desc' } })).then((d) => setMarches(d.contenu || [])).catch(() => {})
  }, [canManage])

  useEffect(() => {
    if (preselectedMarche && canManage) {
      setEditing(null)
      setFormOpen(true)
    }
  }, [preselectedMarche, canManage])

  const closeForm = () => {
    setFormOpen(false)
    if (params.get('marcheId')) {
      const next = new URLSearchParams(params)
      next.delete('marcheId')
      setParams(next, { replace: true })
    }
  }

  const after = (message) => {
    toast.success(message)
    closeForm()
    setCancel(null)
    setProlong(null)
    load()
  }

  const publish = async (ao) => {
    try {
      await unwrap(api.post(`/appels-offres/${ao.id}/publier`))
      after('Appel d’offres publié')
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const submitSearch = (e) => {
    e.preventDefault()
    setPage(0)
    setQ(search.trim())
  }

  return (
    <div>
      <PageHeader
        eyebrow="Consultations"
        title="Appels d’offres"
        subtitle="Publiez les consultations, gérez les dates limites et ouvrez la réception des offres."
        actions={canManage && <Button onClick={() => { setEditing(null); setFormOpen(true) }}><Plus className="w-4 h-4" /> Nouvel appel d’offres</Button>}
      />

      <Card className="mb-4 p-3.5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Tabs tabs={STATUSES} active={statut} onChange={(v) => { setStatut(v); setPage(0) }} />
          <form onSubmit={submitSearch} className="flex flex-1 gap-2 lg:justify-end">
            <div className="relative flex-1 lg:max-w-xs">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Objet, référence…" className="pl-10" />
            </div>
            <Button type="submit" variant="secondary">Rechercher</Button>
          </form>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <LoadingScreen />
        ) : data?.contenu?.length ? (
          <>
            <div className="border-0 table-wrap">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Référence</th>
                    <th>Objet</th>
                    <th>Date limite</th>
                    <th>Offres</th>
                    <th>Statut</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.contenu.map((ao) => {
                    const left = daysLeft(ao.dateLimite)
                    return (
                      <tr key={ao.id}>
                        <td className="font-mono text-xs font-semibold text-slate-600">{ao.reference}</td>
                        <td>
                          <Link to={`/appels-offres/${ao.id}`} className="block max-w-[320px] truncate font-medium text-slate-800 hover:text-primary-700">{ao.objet}</Link>
                          <p className="text-xs text-slate-500">{ao.marcheReference || ao.organisme || 'Sans marché rattaché'}</p>
                        </td>
                        <td>
                          <p className="text-sm whitespace-nowrap text-slate-700">{dateShort(ao.dateLimite)}</p>
                          {ao.statut === 'PUBLIE' && left != null && (
                            <p className={`text-xs font-medium ${left <= 3 ? 'text-rose-600' : 'text-slate-500'}`}>{left < 0 ? 'Dépassée' : left === 0 ? 'Dernier jour' : `J-${left}`}</p>
                          )}
                        </td>
                        <td><span className="badge bg-slate-100 text-slate-600 ring-slate-200">{ao.nombreOffres}</span></td>
                        <td><Badge value={ao.statut} /></td>
                        <td>
                          <div className="flex items-center justify-end gap-1">
                            <Link to={`/appels-offres/${ao.id}`} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-700" title="Détail"><Eye className="w-4 h-4" /></Link>
                            {canManage && ao.statut === 'BROUILLON' && (
                              <>
                                <button onClick={() => { setEditing(ao); setFormOpen(true) }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-700" title="Modifier"><Pencil className="w-4 h-4" /></button>
                                <button onClick={() => publish(ao)} className="rounded-lg p-1.5 text-slate-400 hover:bg-primary-50 hover:text-primary-700" title="Publier"><Megaphone className="w-4 h-4" /></button>
                              </>
                            )}
                            {canManage && ao.statut === 'PUBLIE' && (
                              <>
                                <button onClick={() => setProlong(ao)} className="rounded-lg p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-700" title="Prolonger"><Timer className="w-4 h-4" /></button>
                                <button onClick={() => setCancel(ao)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Annuler"><X className="w-4 h-4" /></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onChange={setPage} />
          </>
        ) : (
          <EmptyState
            icon={ShoppingBag}
            title="Aucun appel d’offres"
            description={canManage ? 'Créez une consultation à partir d’un marché puis publiez-la.' : 'Aucune consultation ne correspond à votre recherche.'}
            action={canManage ? <Button onClick={() => { setEditing(null); setFormOpen(true) }}><Plus className="w-4 h-4" /> Créer</Button> : null}
          />
        )}
      </Card>

      <AoForm open={formOpen} onClose={closeForm} ao={editing} marches={marches} defaultMarcheId={preselectedMarche} onSaved={after} />
      <ProlongModal ao={prolong} onClose={() => setProlong(null)} onDone={after} />
      <CancelModal ao={cancel} onClose={() => setCancel(null)} onDone={after} />
    </div>
  )
}

function AoForm({ open, onClose, ao, marches, defaultMarcheId, onSaved }) {
  const empty = {
    marcheId: defaultMarcheId || '',
    objet: '',
    description: '',
    categorie: '',
    organisme: '',
    conditionsParticipation: '',
    documentsObligatoires: '',
    modalitesSoumission: '',
    budgetPublic: true,
    dateLimite: tomorrowInput(),
  }
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    if (ao) {
      setForm({
        marcheId: ao.marcheId || '',
        objet: ao.objet || '',
        description: ao.description || '',
        categorie: ao.categorie || '',
        organisme: ao.organisme || '',
        conditionsParticipation: ao.conditionsParticipation || '',
        documentsObligatoires: ao.documentsObligatoires || '',
        modalitesSoumission: ao.modalitesSoumission || '',
        budgetPublic: ao.budgetPublic ?? true,
        dateLimite: toLocalInput(ao.dateLimite) || tomorrowInput(),
      })
    } else {
      setForm({ ...empty, marcheId: defaultMarcheId || '' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ao, defaultMarcheId])

  useEffect(() => {
    if (!open || ao || !form.marcheId) return
    const m = marches.find((x) => String(x.id) === String(form.marcheId))
    if (m) {
      setForm((prev) => ({
        ...prev,
        objet: prev.objet || m.objet,
        description: prev.description || m.description || '',
        categorie: prev.categorie || (m.lignes?.[0]?.designation ? 'Matériels' : ''),
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.marcheId, open, ao])

  const submit = async () => {
    setError('')
    setSaving(true)
    const payload = {
      marcheId: form.marcheId ? Number(form.marcheId) : null,
      objet: form.objet,
      description: form.description || null,
      categorie: form.categorie || null,
      organisme: form.organisme || null,
      conditionsParticipation: form.conditionsParticipation || null,
      documentsObligatoires: form.documentsObligatoires || null,
      modalitesSoumission: form.modalitesSoumission || null,
      budgetPublic: form.budgetPublic,
      dateLimite: form.dateLimite,
    }
    try {
      if (ao) await unwrap(api.put(`/appels-offres/${ao.id}`, payload))
      else await unwrap(api.post('/appels-offres', payload))
      onSaved(ao ? 'Appel d’offres mis à jour' : 'Appel d’offres créé en brouillon')
    } catch (err) {
      setError(errorMessage(err, 'Impossible d’enregistrer l’appel d’offres.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={ao ? 'Modifier l’appel d’offres' : 'Nouvel appel d’offres'}
      description="La consultation est créée en brouillon, puis publiée pour ouvrir la réception des offres."
      size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Annuler</Button><Button onClick={submit} loading={saving}>{ao ? 'Enregistrer' : 'Créer le brouillon'}</Button></>}
    >
      <div className="space-y-4">
        <Field label="Marché rattaché" hint="Les matériels et le budget du marché seront repris dans la consultation.">
          <Select value={form.marcheId} onChange={(e) => setForm({ ...form, marcheId: e.target.value })}>
            <option value="">Aucun marché rattaché</option>
            {marches.map((m) => <option key={m.id} value={m.id}>{m.reference} — {m.objet}</option>)}
          </Select>
        </Field>
        <Field label="Objet de la consultation" required>
          <Input value={form.objet} onChange={(e) => setForm({ ...form, objet: e.target.value })} required maxLength={255} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Catégorie">
            <Input value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })} placeholder="Informatique, mobilier…" maxLength={80} />
          </Field>
          <Field label="Organisme">
            <Input value={form.organisme} onChange={(e) => setForm({ ...form, organisme: e.target.value })} placeholder="Ministère, direction…" maxLength={160} />
          </Field>
          <Field label="Date limite de soumission" required>
            <Input type="datetime-local" value={form.dateLimite} onChange={(e) => setForm({ ...form, dateLimite: e.target.value })} required />
          </Field>
          <Field label="Budget public">
            <label className="flex h-[42px] items-center gap-2 rounded-xl border border-slate-300 px-3.5 text-sm text-slate-700">
              <input type="checkbox" checked={form.budgetPublic} onChange={(e) => setForm({ ...form, budgetPublic: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
              Afficher le budget estimatif aux candidats
            </label>
          </Field>
        </div>
        <Field label="Description">
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <Field label="Conditions de participation">
          <Textarea value={form.conditionsParticipation} onChange={(e) => setForm({ ...form, conditionsParticipation: e.target.value })} placeholder="Documents, qualifications, garanties…" />
        </Field>
        <Field label="Documents obligatoires">
          <Textarea value={form.documentsObligatoires} onChange={(e) => setForm({ ...form, documentsObligatoires: e.target.value })} placeholder="Offre technique, offre financière, pièces administratives…" />
        </Field>
        <Field label="Modalités de soumission">
          <Textarea value={form.modalitesSoumission} onChange={(e) => setForm({ ...form, modalitesSoumission: e.target.value })} placeholder="Format, signature, dépôt…" />
        </Field>
        {error && <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700">{error}</p>}
      </div>
    </Modal>
  )
}

function ProlongModal({ ao, onClose, onDone }) {
  const [date, setDate] = useState('')
  const [justification, setJustification] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (ao) {
      setDate('')
      setJustification('')
    }
  }, [ao])

  const submit = async () => {
    setLoading(true)
    try {
      await unwrap(api.post(`/appels-offres/${ao.id}/prolonger`, { nouvelleDateLimite: date, justification }))
      onDone('Date limite prolongée')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={Boolean(ao)} onClose={onClose} title="Prolonger la date limite" description={ao?.objet} footer={<><Button variant="secondary" onClick={onClose}>Annuler</Button><Button onClick={submit} loading={loading}>Prolonger</Button></>}>
      <div className="space-y-4">
        <Field label="Nouvelle date limite" required>
          <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required />
        </Field>
        <Field label="Justification" required>
          <Textarea value={justification} onChange={(e) => setJustification(e.target.value)} required />
        </Field>
      </div>
    </Modal>
  )
}

function CancelModal({ ao, onClose, onDone }) {
  const [motif, setMotif] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => setMotif(''), [ao])

  const submit = async () => {
    setLoading(true)
    try {
      await unwrap(api.post(`/appels-offres/${ao.id}/annuler`, { motif }))
      onDone('Appel d’offres annulé')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={Boolean(ao)} onClose={onClose} title="Annuler l’appel d’offres" description={ao?.objet} footer={<><Button variant="secondary" onClick={onClose}>Fermer</Button><Button variant="danger" onClick={submit} loading={loading}>Confirmer l’annulation</Button></>}>
      <Field label="Motif" required>
        <Textarea value={motif} onChange={(e) => setMotif(e.target.value)} required />
      </Field>
    </Modal>
  )
}
