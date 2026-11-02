import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Check, ClipboardList, Eye, Pencil, Plus, Search, Send, Trash2, X } from 'lucide-react'
import { api, errorMessage, unwrap } from '../../lib/api'
import { dateShort, fcfa, humanize } from '../../lib/format'
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
  { value: 'EN_VALIDATION', label: 'En validation' },
  { value: 'VALIDEE', label: 'Validés' },
  { value: 'REJETEE', label: 'Rejetés' },
]

const emptyLigne = () => ({ designation: '', quantite: 1, caracteristiques: '' })
const emptyForm = () => ({ objet: '', description: '', serviceDemandeur: '', budgetEstimatif: '', dateSouhaitee: '', justification: '', lignes: [emptyLigne()] })

export default function BesoinsPage() {
  const { hasRole, user } = useAuth()
  const [statut, setStatut] = useState('')
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [detail, setDetail] = useState(null)
  const [decision, setDecision] = useState(null)
  const [saving, setSaving] = useState(false)

  const canCreate = hasRole('RESPONSABLE_SERVICE', 'ADMINISTRATEUR')
  const canDecide = hasRole('DIRECTEUR', 'ADMINISTRATEUR')

  const load = useCallback(() => {
    setLoading(true)
    unwrap(api.get('/besoins', { params: { statut: statut || undefined, q: q || undefined, page, size: 10, sort: 'dateCreation,desc' } }))
      .then(setData)
      .catch(() => setData({ contenu: [], totalElements: 0, totalPages: 1, page: 0 }))
      .finally(() => setLoading(false))
  }, [statut, q, page])

  useEffect(load, [load])

  const submitSearch = (e) => {
    e.preventDefault()
    setPage(0)
    setQ(search.trim())
  }

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (b) => {
    setEditing(b)
    setFormOpen(true)
  }

  const afterAction = (message) => {
    toast.success(message)
    setFormOpen(false)
    setDetail(null)
    setDecision(null)
    load()
  }

  const act = async (url, body, message) => {
    try {
      await unwrap(api.post(url, body))
      afterAction(message)
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Besoins"
        title="Expressions de besoin"
        subtitle="Formalisez les besoins en matériels, suivez leur validation et transformez-les en marchés."
        actions={canCreate && <Button onClick={openCreate}><Plus className="w-4 h-4" /> Nouveau besoin</Button>}
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
                    <th>Service</th>
                    <th>Budget</th>
                    <th>Statut</th>
                    <th>Créé le</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.contenu.map((b) => (
                    <tr key={b.id}>
                      <td className="font-mono text-xs font-semibold text-slate-600">{b.reference}</td>
                      <td>
                        <p className="max-w-[280px] truncate font-medium text-slate-800">{b.objet}</p>
                        <p className="text-xs text-slate-500">{b.lignes?.length || 0} ligne{(b.lignes?.length || 0) > 1 ? 's' : ''}</p>
                      </td>
                      <td className="text-slate-600">{b.serviceDemandeur}</td>
                      <td className="font-medium whitespace-nowrap">{fcfa(b.budgetEstimatif)}</td>
                      <td><Badge value={b.statut} /></td>
                      <td className="whitespace-nowrap text-slate-500">{dateShort(b.dateCreation)}</td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setDetail(b)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-700" title="Détail"><Eye className="w-4 h-4" color='green' /></button>
                          {canCreate && b.statut === 'BROUILLON' && (
                            <>
                              <button onClick={() => openEdit(b)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-700" title="Modifier"><Pencil className="w-4 h-4" color='blue' /></button>
                              <button onClick={() => act(`/besoins/${b.id}/soumettre`, undefined, 'Besoin soumis pour validation')} className="rounded-lg p-1.5 text-slate-400 hover:bg-primary-50 hover:text-primary-700" title="Soumettre"><Send className="w-4 h-4" color='red'/></button>
                            </>
                          )}
                          {canDecide && b.statut === 'SOUMISE' && (
                            <button onClick={() => setDecision(b)} className="rounded-lg p-1.5 text-slate-400 hover:bg-primary-50 hover:text-primary-700" title="Décider"><Check className="w-4 h-4" color='green' /></button>
                          )}
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
          <EmptyState
            icon={ClipboardList}
            title="Aucune expression de besoin"
            description={canCreate ? 'Commencez par créer une expression de besoin pour lancer le processus.' : 'Aucun besoin ne correspond à votre recherche.'}
            action={canCreate ? <Button onClick={openCreate}><Plus className="w-4 h-4" /> Créer un besoin</Button> : null}
          />
        )}
      </Card>

      <BesoinForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        besoin={editing}
        defaultService={user?.service || ''}
        onSaved={(message) => afterAction(message)}
      />

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={detail?.objet || 'Détail du besoin'} description={detail?.reference} size="lg">
        {detail && <BesoinDetail besoin={detail} />}
      </Modal>

      <DecisionModal besoin={decision} onClose={() => setDecision(null)} onDone={afterAction} />
    </div>
  )
}

function BesoinDetail({ besoin }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Info label="Statut"><Badge value={besoin.statut} /></Info>
        <Info label="Service demandeur">{besoin.serviceDemandeur}</Info>
        <Info label="Budget estimatif">{fcfa(besoin.budgetEstimatif)}</Info>
        <Info label="Créé par">{besoin.createurNom || '—'}</Info>
        <Info label="Date souhaitée">{dateShort(besoin.dateSouhaitee)}</Info>
        <Info label="Créé le">{dateShort(besoin.dateCreation)}</Info>
      </div>
      {besoin.description && <Info label="Description"><p className="text-sm leading-6 whitespace-pre-line text-slate-600">{besoin.description}</p></Info>}
      {besoin.justification && <Info label="Justification"><p className="text-sm leading-6 whitespace-pre-line text-slate-600">{besoin.justification}</p></Info>}
      {besoin.motifRejet && (
        <div className="px-4 py-3 text-sm rounded-xl bg-rose-50 text-rose-700"><span className="font-semibold">Motif de rejet : </span>{besoin.motifRejet}</div>
      )}
      <div>
        <p className="mb-2 text-sm font-semibold text-slate-800">Matériels demandés</p>
        <div className="overflow-hidden border rounded-xl border-slate-200">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-slate-50 text-slate-500">
              <tr><th className="px-4 py-2.5">Désignation</th><th className="px-4 py-2.5">Quantité</th><th className="px-4 py-2.5">Caractéristiques</th></tr>
            </thead>
            <tbody>
              {besoin.lignes?.map((l) => (
                <tr key={l.id} className="border-t border-slate-100">
                  <td className="px-4 py-2.5 font-medium text-slate-800">{l.designation}</td>
                  <td className="px-4 py-2.5">{l.quantite}</td>
                  <td className="px-4 py-2.5 text-slate-500">{l.caracteristiques || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Info({ label, children }) {
  return (
    <div>
      <p className="text-xs font-medium tracking-wide uppercase text-slate-400">{label}</p>
      <div className="mt-0.5 text-sm font-medium text-slate-800">{children || '—'}</div>
    </div>
  )
}

function BesoinForm({ open, onClose, besoin, defaultService, onSaved }) {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    if (besoin) {
      setForm({
        objet: besoin.objet || '',
        description: besoin.description || '',
        serviceDemandeur: besoin.serviceDemandeur || '',
        budgetEstimatif: besoin.budgetEstimatif ?? '',
        dateSouhaitee: besoin.dateSouhaitee || '',
        justification: besoin.justification || '',
        lignes: besoin.lignes?.length ? besoin.lignes.map((l) => ({ designation: l.designation, quantite: l.quantite, caracteristiques: l.caracteristiques || '' })) : [emptyLigne()],
      })
    } else {
      setForm({ ...emptyForm(), serviceDemandeur: defaultService })
    }
  }, [open, besoin, defaultService])

  const setLine = (index, key, value) => {
    const lignes = form.lignes.map((l, i) => (i === index ? { ...l, [key]: value } : l))
    setForm({ ...form, lignes })
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    const payload = {
      objet: form.objet,
      description: form.description || null,
      serviceDemandeur: form.serviceDemandeur,
      budgetEstimatif: form.budgetEstimatif ? Number(form.budgetEstimatif) : null,
      dateSouhaitee: form.dateSouhaitee || null,
      justification: form.justification || null,
      lignes: form.lignes.map((l) => ({ designation: l.designation, quantite: Number(l.quantite), caracteristiques: l.caracteristiques || null })),
    }
    try {
      if (besoin) await unwrap(api.put(`/besoins/${besoin.id}`, payload))
      else await unwrap(api.post('/besoins', payload))
      onSaved(besoin ? 'Besoin mis à jour' : 'Besoin créé')
    } catch (err) {
      setError(errorMessage(err, 'Impossible d’enregistrer le besoin.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={besoin ? 'Modifier le besoin' : 'Nouvelle expression de besoin'}
      description="Renseignez l’objet, le service demandeur et les matériels concernés."
      size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Annuler</Button><Button onClick={submit} loading={saving}>{besoin ? 'Enregistrer' : 'Créer le besoin'}</Button></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Objet du besoin" required>
          <Input value={form.objet} onChange={(e) => setForm({ ...form, objet: e.target.value })} placeholder="Ex. Acquisition de matériel informatique" required maxLength={255} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Service demandeur" required>
            <Input value={form.serviceDemandeur} onChange={(e) => setForm({ ...form, serviceDemandeur: e.target.value })} placeholder="Direction des systèmes d’information" required maxLength={160} />
          </Field>
          <Field label="Budget estimatif (FCFA)">
            <Input type="number" min="1" step="1" value={form.budgetEstimatif} onChange={(e) => setForm({ ...form, budgetEstimatif: e.target.value })} placeholder="0" />
          </Field>
          <Field label="Date souhaitée">
            <Input type="date" value={form.dateSouhaitee} onChange={(e) => setForm({ ...form, dateSouhaitee: e.target.value })} />
          </Field>
        </div>
        <Field label="Description">
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Décrivez le contexte et le périmètre du besoin…" />
        </Field>
        <Field label="Justification">
          <Textarea value={form.justification} onChange={(e) => setForm({ ...form, justification: e.target.value })} placeholder="Motivation de la demande…" />
        </Field>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-800">Matériels demandés <span className="text-rose-500">*</span></p>
            <Button type="button" variant="secondary" size="sm" onClick={() => setForm({ ...form, lignes: [...form.lignes, emptyLigne()] })}><Plus className="h-3.5 w-3.5" /> Ajouter</Button>
          </div>
          <div className="space-y-2">
            {form.lignes.map((l, i) => (
              <div key={i} className="grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1.4fr_90px_1.4fr_40px]">
                <Input value={l.designation} onChange={(e) => setLine(i, 'designation', e.target.value)} placeholder="Désignation" required maxLength={160} />
                <Input type="number" min="1" value={l.quantite} onChange={(e) => setLine(i, 'quantite', e.target.value)} placeholder="Qté" required />
                <Input value={l.caracteristiques} onChange={(e) => setLine(i, 'caracteristiques', e.target.value)} placeholder="Caractéristiques (optionnel)" />
                <button type="button" disabled={form.lignes.length === 1} onClick={() => setForm({ ...form, lignes: form.lignes.filter((_, idx) => idx !== i) })} className="grid rounded-lg place-items-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
        {error && <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700">{error}</p>}
      </form>
    </Modal>
  )
}

function DecisionModal({ besoin, onClose, onDone }) {
  const [motif, setMotif] = useState('')
  const [loading, setLoading] = useState('')

  const decide = async (action) => {
    setLoading(action)
    try {
      await unwrap(api.post(`/besoins/${besoin.id}/${action}`, { motif: motif || null }))
      toast.success(action === 'valider' ? 'Besoin validé' : 'Besoin rejeté')
      setMotif('')
      onDone()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setLoading('')
    }
  }

  return (
    <Modal
      open={Boolean(besoin)}
      onClose={onClose}
      title="Décision de validation"
      description={besoin?.objet}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button variant="danger" loading={loading === 'rejeter'} onClick={() => decide('rejeter')}><X className="w-4 h-4" /> Rejeter</Button>
          <Button loading={loading === 'valider'} onClick={() => decide('valider')}><Check className="w-4 h-4" /> Valider</Button>
        </>
      }
    >
      <Field label="Motif / commentaire" hint="Obligatoire en cas de rejet, optionnel en cas de validation.">
        <Textarea value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Précisez la raison de votre décision…" />
      </Field>
    </Modal>
  )
}
