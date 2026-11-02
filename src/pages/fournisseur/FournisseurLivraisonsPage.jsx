import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { CalendarPlus, CheckCircle2, Clock, PackageCheck, Truck } from 'lucide-react'
import { api, errorMessage, unwrap } from '../../lib/api'
import { dateShort, dateTime, humanize } from '../../lib/format'
import { Badge, Button, Card, EmptyState, Field, Input, LoadingScreen, Modal, PageHeader, Select, StatCard, Tabs, Textarea } from '../../components/ui'

const TABS = [
  { value: '', label: 'Toutes' },
  { value: 'PLANIFIEE', label: 'Planifiées' },
  { value: 'LIVREE', label: 'Livrées' },
  { value: 'EN_RETARD', label: 'En retard' },
  { value: 'RECEPTIONNEE', label: 'Réceptionnées' },
]

export default function FournisseurLivraisonsPage() {
  const [livraisons, setLivraisons] = useState([])
  const [marches, setMarches] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('')
  const [planOpen, setPlanOpen] = useState(false)
  const [declare, setDeclare] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = () => {
    Promise.all([
      unwrap(api.get('/livraisons/mes-livraisons')).catch(() => []),
      unwrap(api.get('/marches/mes-marches')).catch(() => []),
    ]).then(([l, m]) => { setLivraisons(l || []); setMarches(m || []) }).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const counts = useMemo(() => Object.fromEntries(TABS.map((t) => [t.value, t.value ? livraisons.filter((l) => l.statut === t.value).length : livraisons.length])), [livraisons])
  const filtered = tab ? livraisons.filter((l) => l.statut === tab) : livraisons
  const receptionnees = livraisons.filter((l) => l.statut === 'RECEPTIONNEE').length
  const enRetard = livraisons.filter((l) => l.statut === 'EN_RETARD').length

  const declareSubmit = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setSaving(true)
    try {
      await unwrap(api.put(`/livraisons/${declare.id}/declarer`, {
        dateEffective: fd.get('dateEffective'),
        observations: fd.get('observations') || null,
      }))
      toast.success('Livraison déclarée')
      setDeclare(null)
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingScreen />

  return (
    <div>
      <PageHeader
        eyebrow="Logistique"
        title="Mes livraisons"
        subtitle="Planifiez vos livraisons, déclarez-les et suivez leur réception."
        actions={<Button onClick={() => setPlanOpen(true)} disabled={!marches.length}><CalendarPlus className="h-4 w-4" /> Planifier une livraison</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Truck} label="Livraisons" value={livraisons.length} />
        <StatCard icon={CheckCircle2} label="Réceptionnées" value={receptionnees} tone="green" />
        <StatCard icon={Clock} label="En retard" value={enRetard} tone={enRetard ? 'rose' : 'slate'} />
      </div>

      <Card className="mt-5 mb-4 p-3.5">
        <Tabs tabs={TABS.map((t) => ({ ...t, count: counts[t.value] }))} active={tab} onChange={setTab} />
      </Card>

      <div className="space-y-3">
        {filtered.length ? filtered.map((l) => (
          <Card key={l.id} className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] font-semibold text-slate-500">{l.marcheReference}</span>
                  <Badge value={l.statut} />
                </div>
                <p className="mt-1 truncate font-display text-base font-bold text-slate-900">{l.marcheObjet}</p>
                <p className="mt-0.5 text-xs text-slate-500">Prévue le {dateShort(l.datePrevue)}{l.dateEffective ? ` · déclarée le ${dateShort(l.dateEffective)}` : ''}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {['PLANIFIEE', 'EN_RETARD'].includes(l.statut) && <Button size="sm" variant="secondary" onClick={() => setDeclare(l)}><Truck className="h-3.5 w-3.5" /> Déclarer</Button>}
              </div>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-[1.3fr_1fr]">
              <div className="table-wrap">
                <table className="table-base">
                  <thead><tr><th>Article</th><th>Attendu</th><th>Livré</th></tr></thead>
                  <tbody>{l.lignes?.map((li) => <tr key={li.id}><td className="font-medium">{li.designation}</td><td>{li.quantiteAttendue}</td><td>{li.quantiteLivree}</td></tr>)}</tbody>
                </table>
              </div>
              <div className="rounded-xl bg-slate-50 p-3.5">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Réception</p>
                {l.reception ? (
                  <div className="mt-1 space-y-1 text-sm">
                    <div className="flex items-center justify-between"><Badge value={l.reception.statut} /><span className="text-xs text-slate-500">{dateShort(l.reception.dateReception)}</span></div>
                    {l.reception.observations && <p className="text-xs text-slate-600">{l.reception.observations}</p>}
                    {l.reception.reserves && <p className="rounded-lg bg-amber-50 px-2 py-1 text-xs text-amber-700">Réserves : {l.reception.reserves}</p>}
                  </div>
                ) : <p className="mt-1 text-sm text-slate-500">En attente de réception par le service.</p>}
                {l.observations && <p className="mt-2 text-xs text-slate-500">{l.observations}</p>}
              </div>
            </div>
          </Card>
        )) : (
          <Card><EmptyState icon={Truck} title="Aucune livraison" description={marches.length ? 'Planifiez votre première livraison pour un marché attribué.' : 'Vous n’avez pas encore de marché attribué.'} action={marches.length ? <Button onClick={() => setPlanOpen(true)}>Planifier</Button> : <Link to="/fournisseur/opportunites" className="btn-primary">Voir les opportunités</Link>} /></Card>
        )}
      </div>

      <PlanModal open={planOpen} onClose={() => setPlanOpen(false)} marches={marches} livraisons={livraisons} onDone={() => { setPlanOpen(false); load() }} />
      <DeclareModal livraison={declare} onClose={() => setDeclare(null)} onSubmit={declareSubmit} saving={saving} />
    </div>
  )
}

function PlanModal({ open, onClose, marches, livraisons, onDone }) {
  const [marcheId, setMarcheId] = useState('')
  const [datePrevue, setDatePrevue] = useState('')
  const [observations, setObservations] = useState('')
  const [quantites, setQuantites] = useState({})
  const [saving, setSaving] = useState(false)

  const marche = marches.find((m) => String(m.id) === String(marcheId))
  const restants = useMemo(() => {
    const delivered = {}
    livraisons.filter((l) => String(l.marcheId) === String(marcheId)).forEach((l) => {
      l.lignes?.forEach((li) => { delivered[li.ligneMarcheId] = (delivered[li.ligneMarcheId] || 0) + li.quantiteLivree })
    })
    const result = {}
    marche?.lignes?.forEach((l) => { result[l.id] = Math.max(0, l.quantite - (delivered[l.id] || 0)) })
    return result
  }, [marche, livraisons, marcheId])

  useEffect(() => {
    if (!open) return
    setMarcheId(''); setDatePrevue(''); setObservations(''); setQuantites({})
  }, [open])

  useEffect(() => {
    if (!marche) return
    const next = {}
    marche.lignes?.forEach((l) => { if (restants[l.id] > 0) next[l.id] = restants[l.id] })
    setQuantites(next)
  }, [marcheId])

  const submit = async (e) => {
    e.preventDefault()
    const lignes = Object.entries(quantites).filter(([, q]) => Number(q) > 0).map(([id, q]) => ({ ligneMarcheId: Number(id), quantiteLivree: Number(q) }))
    if (!lignes.length) { toast.error('Renseignez au moins une quantité à livrer.'); return }
    setSaving(true)
    try {
      await unwrap(api.post('/livraisons', { marcheId: Number(marcheId), datePrevue, observations: observations || null, lignes }))
      toast.success('Livraison planifiée')
      onDone()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Planifier une livraison" description="Sélectionnez un marché attribué et les quantités à livrer.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Marché" required>
          <Select value={marcheId} onChange={(e) => setMarcheId(e.target.value)} required>
            <option value="">Sélectionner un marché…</option>
            {marches.filter((m) => ['ATTRIBUE', 'EN_EXECUTION'].includes(m.statut)).map((m) => <option key={m.id} value={m.id}>{m.reference} — {m.objet}</option>)}
          </Select>
        </Field>
        <Field label="Date prévue" required>
          <Input type="date" value={datePrevue} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDatePrevue(e.target.value)} required />
        </Field>
        {marche && (
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-800">Quantités à livrer</p>
            <div className="space-y-2">
              {marche.lignes?.map((l) => (
                <div key={l.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2">
                  <div className="min-w-0"><p className="truncate text-sm font-medium text-slate-800">{l.designation}</p><p className="text-xs text-slate-500">Reste : {restants[l.id] ?? l.quantite}</p></div>
                  <Input type="number" min="0" max={restants[l.id] ?? l.quantite} value={quantites[l.id] ?? ''} onChange={(e) => setQuantites({ ...quantites, [l.id]: e.target.value })} className="w-24" disabled={!restants[l.id]} />
                </div>
              ))}
            </div>
          </div>
        )}
        <Field label="Observations"><Textarea value={observations} onChange={(e) => setObservations(e.target.value)} rows={2} /></Field>
        <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Annuler</Button><Button type="submit" loading={saving} disabled={!marcheId}><PackageCheck className="h-4 w-4" /> Planifier</Button></div>
      </form>
    </Modal>
  )
}

function DeclareModal({ livraison, onClose, onSubmit, saving }) {
  return (
    <Modal open={!!livraison} onClose={onClose} title="Déclarer la livraison" description={livraison ? `${livraison.marcheReference} — ${livraison.marcheObjet}` : ''}>
      {livraison && (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600">Date prévue : <strong>{dateShort(livraison.datePrevue)}</strong> · Statut actuel : {humanize(livraison.statut)}</div>
          <Field label="Date effective de livraison" required>
            <Input name="dateEffective" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
          </Field>
          <Field label="Observations"><Textarea name="observations" rows={3} placeholder="Conditions de livraison, remarques…" /></Field>
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Annuler</Button><Button type="submit" loading={saving}><Truck className="h-4 w-4" /> Confirmer la livraison</Button></div>
        </form>
      )}
    </Modal>
  )
}
