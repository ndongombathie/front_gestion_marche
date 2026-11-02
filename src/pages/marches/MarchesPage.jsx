import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { BriefcaseBusiness, Check, Eye, Pencil, Plus, Search, Send, Trash2, X } from 'lucide-react'
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
  { value: 'EN_PREPARATION', label: 'Préparation' },
  { value: 'EN_VALIDATION', label: 'Validation' },
  { value: 'PUBLIE', label: 'Publiés' },
  { value: 'EN_EVALUATION', label: 'Évaluation' },
  { value: 'ATTRIBUE', label: 'Attribués' },
  { value: 'EN_EXECUTION', label: 'Exécution' },
  { value: 'CLOTURE', label: 'Clôturés' },
]

const MODES = [
  ['APPEL_OFFRES_OUVERT', 'Appel d’offres ouvert'],
  ['APPEL_OFFRES_RESTREINT', 'Appel d’offres restreint'],
  ['DEMANDE_RENSEIGNEMENTS_PRIX', 'Demande de renseignements et de prix'],
  ['ENTENTE_DIRECTE', 'Entente directe'],
]

const emptyLine = () => ({ designation: '', quantite: 1, caracteristiques: '', prixUnitaireEstime: '' })
const emptyCritere = () => ({ libelle: '', type: 'TECHNIQUE', ponderation: 20, description: '' })
const emptyForm = () => ({
  objet: '',
  description: '',
  budgetPrevisionnel: '',
  modePassation: 'APPEL_OFFRES_OUVERT',
  expressionBesoinId: '',
  dateDebutExecution: '',
  dateFinExecution: '',
  observations: '',
  lignes: [emptyLine()],
  criteres: [
    { libelle: 'Qualité technique', type: 'TECHNIQUE', ponderation: 60, description: 'Conformité et qualité de l’offre technique' },
    { libelle: 'Prix', type: 'FINANCIER', ponderation: 40, description: 'Compétitivité du montant proposé' },
  ],
})

export default function MarchesPage() {
  const { hasRole } = useAuth()
  const [statut, setStatut] = useState('')
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [besoins, setBesoins] = useState([])
  const [decision, setDecision] = useState(null)
  const [actionBusy, setActionBusy] = useState('')

  const canCreate = hasRole('RESPONSABLE_SERVICE', 'ADMINISTRATEUR')
  const canDecide = hasRole('DIRECTEUR', 'ADMINISTRATEUR')

  const load = useCallback(() => {
    setLoading(true)
    unwrap(api.get('/marches', { params: { statut: statut || undefined, q: q || undefined, page, size: 10, sort: 'dateCreation,desc' } }))
      .then(setData)
      .catch(() => setData({ contenu: [], totalElements: 0, totalPages: 1, page: 0 }))
      .finally(() => setLoading(false))
  }, [statut, q, page])

  useEffect(load, [load])
  useEffect(() => {
    if (canCreate) unwrap(api.get('/besoins/validees')).then(setBesoins).catch(() => setBesoins([]))
  }, [canCreate])

  const submitSearch = (e) => {
    e.preventDefault()
    setPage(0)
    setQ(search.trim())
  }

  const openEdit = (m) => {
    setEditing(m)
    setFormOpen(true)
  }

  const after = (message) => {
    toast.success(message)
    setFormOpen(false)
    setDecision(null)
    load()
  }

  const simpleAction = async (m, action, label) => {
    setActionBusy(`${m.id}-${action}`)
    try {
      await unwrap(api.post(`/marches/${m.id}/${action}`, action === 'soumettre' || action === 'cloturer' ? undefined : { motif: null }))
      after(label)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setActionBusy('')
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Marchés"
        title="Marchés publics"
        subtitle="De la préparation à la clôture : pilotez le cycle de vie de chaque marché."
        actions={canCreate && <Button onClick={() => { setEditing(null); setFormOpen(true) }}><Plus className="w-4 h-4" /> Nouveau marché</Button>}
      />

      <Card className="mb-4 p-3.5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <Tabs tabs={STATUSES} active={statut} onChange={(v) => { setStatut(v); setPage(0) }} />
          <form onSubmit={submitSearch} className="flex flex-1 gap-2 xl:justify-end">
            <div className="relative flex-1 xl:max-w-xs">
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
                    <th>Mode</th>
                    <th>Budget</th>
                    <th>Statut</th>
                    <th>Créé le</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.contenu.map((m) => (
                    <tr key={m.id}>
                      <td className="font-mono text-xs font-semibold text-slate-600">{m.reference}</td>
                      <td>
                        <Link to={`/marches/${m.id}`} className="block max-w-[300px] truncate font-medium text-slate-800 hover:text-primary-700">{m.objet}</Link>
                        <p className="text-xs text-slate-500">{m.fournisseurAttribue || `${m.nombreOffres} offre${m.nombreOffres > 1 ? 's' : ''}`}</p>
                      </td>
                      <td className="text-xs text-slate-500">{humanize(m.modePassation)}</td>
                      <td className="font-medium whitespace-nowrap">{fcfa(m.budgetPrevisionnel)}</td>
                      <td><Badge value={m.statut} /></td>
                      <td className="whitespace-nowrap text-slate-500">{dateShort(m.dateCreation)}</td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/marches/${m.id}`} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-700" title="Détail"><Eye className="w-4 h-4" color='green' /></Link>
                          {canCreate && m.statut === 'EN_PREPARATION' && (
                            <>
                              <button onClick={() => openEdit(m)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-700" title="Modifier"><Pencil className="w-4 h-4" color='blue' /></button>
                              <button disabled={actionBusy === `${m.id}-soumettre`} onClick={() => simpleAction(m, 'soumettre', 'Marché soumis pour validation')} className="rounded-lg p-1.5 text-slate-400 hover:bg-primary-50 hover:text-primary-700" title="Soumettre"><Send className="w-4 h-4" color='red' /></button>
                            </>
                          )}
                          {canDecide && m.statut === 'EN_VALIDATION' && (
                            <button onClick={() => setDecision(m)} className="rounded-lg p-1.5 text-slate-400 hover:bg-primary-50 hover:text-primary-700" title="Décider"><Check className="w-4 h-4" color='green'/></button>
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
            icon={BriefcaseBusiness}
            title="Aucun marché"
            description={canCreate ? 'Créez un marché à partir d’un besoin validé ou de zéro.' : 'Aucun marché ne correspond à votre recherche.'}
            action={canCreate ? <Button onClick={() => { setEditing(null); setFormOpen(true) }}><Plus className="w-4 h-4" /> Créer un marché</Button> : null}
          />
        )}
      </Card>

      <MarcheForm open={formOpen} onClose={() => setFormOpen(false)} marche={editing} besoins={besoins} onSaved={after} />
      <MarcheDecision marche={decision} onClose={() => setDecision(null)} onDone={after} />
    </div>
  )
}

function MarcheForm({ open, onClose, marche, besoins, onSaved }) {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    if (marche) {
      setForm({
        objet: marche.objet || '',
        description: marche.description || '',
        budgetPrevisionnel: marche.budgetPrevisionnel ?? '',
        modePassation: marche.modePassation || 'APPEL_OFFRES_OUVERT',
        expressionBesoinId: marche.expressionBesoinId || '',
        dateDebutExecution: marche.dateDebutExecution || '',
        dateFinExecution: marche.dateFinExecution || '',
        observations: marche.observations || '',
        lignes: marche.lignes?.length ? marche.lignes.map((l) => ({ designation: l.designation, quantite: l.quantite, caracteristiques: l.caracteristiques || '', prixUnitaireEstime: l.prixUnitaireEstime ?? '' })) : [emptyLine()],
        criteres: marche.criteres?.length ? marche.criteres.map((c) => ({ libelle: c.libelle, type: c.type, ponderation: c.ponderation, description: c.description || '' })) : emptyForm().criteres,
      })
    } else {
      setForm(emptyForm())
    }
  }, [open, marche])

  const setLine = (i, key, value) => setForm({ ...form, lignes: form.lignes.map((l, idx) => (idx === i ? { ...l, [key]: value } : l)) })
  const setCritere = (i, key, value) => setForm({ ...form, criteres: form.criteres.map((c, idx) => (idx === i ? { ...c, [key]: value } : c)) })

  const submit = async () => {
    setError('')
    setSaving(true)
    const payload = {
      objet: form.objet,
      description: form.description || null,
      budgetPrevisionnel: form.budgetPrevisionnel ? Number(form.budgetPrevisionnel) : null,
      modePassation: form.modePassation,
      expressionBesoinId: form.expressionBesoinId ? Number(form.expressionBesoinId) : null,
      dateDebutExecution: form.dateDebutExecution || null,
      dateFinExecution: form.dateFinExecution || null,
      observations: form.observations || null,
      lignes: form.lignes.map((l) => ({
        designation: l.designation,
        quantite: Number(l.quantite),
        caracteristiques: l.caracteristiques || null,
        prixUnitaireEstime: l.prixUnitaireEstime ? Number(l.prixUnitaireEstime) : null,
      })),
      criteres: form.criteres.filter((c) => c.libelle).map((c) => ({
        libelle: c.libelle,
        type: c.type,
        ponderation: Number(c.ponderation),
        description: c.description || null,
      })),
    }
    try {
      if (marche) await unwrap(api.put(`/marches/${marche.id}`, payload))
      else await unwrap(api.post('/marches', payload))
      onSaved(marche ? 'Marché mis à jour' : 'Marché créé')
    } catch (err) {
      setError(errorMessage(err, 'Impossible d’enregistrer le marché.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={marche ? 'Modifier le marché' : 'Nouveau marché'}
      description="Définissez l’objet, le budget, les matériels et les critères d’évaluation."
      size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Annuler</Button><Button onClick={submit} loading={saving}>{marche ? 'Enregistrer' : 'Créer le marché'}</Button></>}
    >
      <div className="space-y-4">
        <Field label="Objet du marché" required>
          <Input value={form.objet} onChange={(e) => setForm({ ...form, objet: e.target.value })} placeholder="Ex. Fourniture de matériel informatique" required maxLength={255} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Budget prévisionnel (FCFA)" required>
            <Input type="number" min="1" value={form.budgetPrevisionnel} onChange={(e) => setForm({ ...form, budgetPrevisionnel: e.target.value })} placeholder="0" required />
          </Field>
          <Field label="Mode de passation" required>
            <Select value={form.modePassation} onChange={(e) => setForm({ ...form, modePassation: e.target.value })}>
              {MODES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </Field>
          <Field label="Besoin d’origine">
            <Select value={form.expressionBesoinId} onChange={(e) => setForm({ ...form, expressionBesoinId: e.target.value })}>
              <option value="">Aucun besoin rattaché</option>
              {besoins.map((b) => <option key={b.id} value={b.id}>{b.reference} — {b.objet}</option>)}
            </Select>
          </Field>
          <Field label="Date de début d’exécution">
            <Input type="date" value={form.dateDebutExecution} onChange={(e) => setForm({ ...form, dateDebutExecution: e.target.value })} />
          </Field>
          <Field label="Date de fin d’exécution">
            <Input type="date" value={form.dateFinExecution} onChange={(e) => setForm({ ...form, dateFinExecution: e.target.value })} />
          </Field>
        </div>
        <Field label="Description">
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Périmètre, contexte, attentes…" />
        </Field>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-800">Lignes du marché <span className="text-rose-500">*</span></p>
            <Button type="button" variant="secondary" size="sm" onClick={() => setForm({ ...form, lignes: [...form.lignes, emptyLine()] })}><Plus className="h-3.5 w-3.5" /> Ajouter</Button>
          </div>
          <div className="space-y-2">
            {form.lignes.map((l, i) => (
              <div key={i} className="grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1.3fr_80px_1.3fr_120px_36px]">
                <Input value={l.designation} onChange={(e) => setLine(i, 'designation', e.target.value)} placeholder="Désignation" required maxLength={160} />
                <Input type="number" min="1" value={l.quantite} onChange={(e) => setLine(i, 'quantite', e.target.value)} placeholder="Qté" required />
                <Input value={l.caracteristiques} onChange={(e) => setLine(i, 'caracteristiques', e.target.value)} placeholder="Caractéristiques" />
                <Input type="number" min="0" value={l.prixUnitaireEstime} onChange={(e) => setLine(i, 'prixUnitaireEstime', e.target.value)} placeholder="PU estimé" />
                <button type="button" disabled={form.lignes.length === 1} onClick={() => setForm({ ...form, lignes: form.lignes.filter((_, idx) => idx !== i) })} className="grid rounded-lg place-items-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-800">Critères d’évaluation</p>
            <Button type="button" variant="secondary" size="sm" onClick={() => setForm({ ...form, criteres: [...form.criteres, emptyCritere()] })}><Plus className="h-3.5 w-3.5" /> Ajouter</Button>
          </div>
          <div className="space-y-2">
            {form.criteres.map((c, i) => (
              <div key={i} className="grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1.4fr_120px_90px_1.4fr_36px]">
                <Input value={c.libelle} onChange={(e) => setCritere(i, 'libelle', e.target.value)} placeholder="Libellé" />
                <Select value={c.type} onChange={(e) => setCritere(i, 'type', e.target.value)}>
                  <option value="TECHNIQUE">Technique</option>
                  <option value="FINANCIER">Financier</option>
                </Select>
                <Input type="number" min="1" max="100" value={c.ponderation} onChange={(e) => setCritere(i, 'ponderation', e.target.value)} placeholder="%" />
                <Input value={c.description} onChange={(e) => setCritere(i, 'description', e.target.value)} placeholder="Description" />
                <button type="button" onClick={() => setForm({ ...form, criteres: form.criteres.filter((_, idx) => idx !== i) })} className="grid rounded-lg place-items-center text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-slate-500">Total des pondérations : <span className="font-semibold text-slate-700">{form.criteres.reduce((s, c) => s + (Number(c.ponderation) || 0), 0)} %</span></p>
        </div>

        <Field label="Observations">
          <Textarea value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} />
        </Field>
        {error && <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700">{error}</p>}
      </div>
    </Modal>
  )
}

function MarcheDecision({ marche, onClose, onDone }) {
  const [motif, setMotif] = useState('')
  const [loading, setLoading] = useState('')

  const decide = async (action) => {
    setLoading(action)
    try {
      await unwrap(api.post(`/marches/${marche.id}/${action}`, { motif: motif || null }))
      toast.success(action === 'valider' ? 'Marché validé' : action === 'rejeter' ? 'Marché rejeté' : 'Marché annulé')
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
      open={Boolean(marche)}
      onClose={onClose}
      title="Décision sur le marché"
      description={marche?.objet}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button variant="danger" loading={loading === 'rejeter'} onClick={() => decide('rejeter')}><X className="w-4 h-4" /> Rejeter</Button>
          <Button loading={loading === 'valider'} onClick={() => decide('valider')}><Check className="w-4 h-4" /> Valider</Button>
        </>
      }
    >
      <Field label="Motif / commentaire" hint="Obligatoire en cas de rejet.">
        <Textarea value={motif} onChange={(e) => setMotif(e.target.value)} />
      </Field>
    </Modal>
  )
}
