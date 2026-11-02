import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AlertTriangle, CalendarDays, CheckCircle2, Eye, PackageCheck, Search, Truck } from 'lucide-react'
import { api, errorMessage, unwrap } from '../../lib/api'
import { dateLong, dateShort, humanize } from '../../lib/format'
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
  Select,
  Tabs,
  Textarea,
} from '../../components/ui'

const TABS = [
  { value: '', label: 'Toutes' },
  { value: 'PLANIFIEE', label: 'Planifiées' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'LIVREE', label: 'Livrées' },
  { value: 'EN_RETARD', label: 'En retard' },
  { value: 'RECEPTIONNEE', label: 'Réceptionnées' },
]

export default function LivraisonsPage() {
  const { hasRole } = useAuth()
  const [statut, setStatut] = useState('')
  const [q, setQ] = useState('')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)
  const [reception, setReception] = useState(null)

  const canReceive = hasRole('RESPONSABLE_SERVICE', 'ADMINISTRATEUR')

  const load = useCallback(() => {
    setLoading(true)
    unwrap(api.get('/livraisons'))
      .then((d) => setData(d || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return data.filter((l) => {
      if (statut && l.statut !== statut) return false
      if (!term) return true
      return [l.marcheObjet, l.marcheReference, l.raisonSociale].some((v) => String(v || '').toLowerCase().includes(term))
    })
  }, [data, statut, q])

  const counts = useMemo(() => Object.fromEntries(TABS.map((t) => [t.value, t.value ? data.filter((l) => l.statut === t.value).length : data.length])), [data])

  return (
    <div>
      <PageHeader
        eyebrow="Exécution"
        title="Livraisons"
        subtitle="Suivez les livraisons planifiées, déclarées et réceptionnées pour chaque marché."
      />

      <Card className="mb-4 p-3.5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <Tabs tabs={TABS.map((t) => ({ ...t, count: counts[t.value] }))} active={statut} onChange={setStatut} />
          <div className="relative flex-1 xl:max-w-xs xl:self-end">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Marché, fournisseur…" className="pl-10" />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <LoadingScreen />
        ) : filtered.length ? (
          <div className="table-wrap border-0">
            <table className="table-base">
              <thead><tr><th>Marché</th><th>Fournisseur</th><th>Date prévue</th><th>Date effective</th><th>Statut</th><th>Réception</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <p className="max-w-[280px] truncate font-medium text-slate-800">{l.marcheObjet}</p>
                      <p className="font-mono text-xs text-slate-500">{l.marcheReference}</p>
                    </td>
                    <td className="text-slate-600">{l.raisonSociale}</td>
                    <td className="whitespace-nowrap">
                      <span className={l.statut === 'EN_RETARD' ? 'font-semibold text-rose-600' : 'text-slate-600'}>{dateShort(l.datePrevue)}</span>
                    </td>
                    <td className="whitespace-nowrap text-slate-500">{dateShort(l.dateEffective)}</td>
                    <td><Badge value={l.statut} /></td>
                    <td>{l.reception ? <Badge value={l.reception.statut} /> : <span className="text-xs text-slate-400">En attente</span>}</td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setDetail(l)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-700" title="Détail"><Eye className="h-4 w-4" /></button>
                        {canReceive && !l.reception && ['LIVREE', 'EN_RETARD', 'EN_COURS'].includes(l.statut) && (
                          <button onClick={() => setReception(l)} className="rounded-lg p-1.5 text-slate-400 hover:bg-primary-50 hover:text-primary-700" title="Réceptionner"><PackageCheck className="h-4 w-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={Truck} title="Aucune livraison" description="Les livraisons planifiées par les fournisseurs apparaîtront ici." />
        )}
      </Card>

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title="Détail de la livraison" description={detail?.marcheReference} size="lg">
        {detail && <LivraisonDetail livraison={detail} />}
      </Modal>

      <ReceptionModal livraison={reception} onClose={() => setReception(null)} onDone={() => { setReception(null); toast.success('Réception enregistrée'); load() }} />
    </div>
  )
}

function LivraisonDetail({ livraison }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Info label="Marché" value={livraison.marcheObjet} />
        <Info label="Référence" value={livraison.marcheReference} />
        <Info label="Fournisseur" value={livraison.raisonSociale} />
        <Info label="Statut" value={<Badge value={livraison.statut} />} />
        <Info label="Date prévue" value={dateLong(livraison.datePrevue)} />
        <Info label="Date effective" value={dateLong(livraison.dateEffective)} />
      </div>
      {livraison.observations && <Info label="Observations"><p className="text-sm leading-6 text-slate-600">{livraison.observations}</p></Info>}
      <div>
        <p className="mb-2 text-sm font-semibold text-slate-800">Lignes livrées</p>
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-2.5">Désignation</th><th className="px-4 py-2.5">Attendu</th><th className="px-4 py-2.5">Livré</th></tr></thead>
            <tbody>
              {livraison.lignes?.map((l) => (
                <tr key={l.id} className="border-t border-slate-100">
                  <td className="px-4 py-2.5 font-medium text-slate-800">{l.designation}</td>
                  <td className="px-4 py-2.5">{l.quantiteAttendue}</td>
                  <td className={`px-4 py-2.5 font-semibold ${l.quantiteLivree >= l.quantiteAttendue ? 'text-primary-700' : 'text-amber-600'}`}>{l.quantiteLivree}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {livraison.reception && (
        <div className="rounded-xl border border-primary-200 bg-primary-50/60 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-primary-900"><CheckCircle2 className="h-4 w-4" /> Réception {humanize(livraison.reception.statut)}</p>
          <p className="mt-1 text-xs text-slate-600">Le {dateLong(livraison.reception.dateReception)} par {livraison.reception.receptionnaire || '—'}</p>
          {livraison.reception.reserves && <p className="mt-2 text-xs text-amber-700"><span className="font-semibold">Réserves : </span>{livraison.reception.reserves}</p>}
          {livraison.reception.observations && <p className="mt-1 text-xs text-slate-600">{livraison.reception.observations}</p>}
        </div>
      )}
    </div>
  )
}

function Info({ label, children, value }) {
  return <div><p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p><div className="mt-0.5 text-sm font-medium text-slate-800">{children || value || '—'}</div></div>
}

function ReceptionModal({ livraison, onClose, onDone }) {
  const [form, setForm] = useState({ dateReception: new Date().toISOString().slice(0, 10), statut: 'ACCEPTEE', observations: '', reserves: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (livraison) setForm({ dateReception: new Date().toISOString().slice(0, 10), statut: 'ACCEPTEE', observations: '', reserves: '' })
  }, [livraison])

  const submit = async () => {
    setLoading(true)
    try {
      await unwrap(api.post(`/livraisons/${livraison.id}/reception`, {
        dateReception: form.dateReception,
        statut: form.statut,
        observations: form.observations || null,
        reserves: form.reserves || null,
      }))
      onDone()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={Boolean(livraison)} onClose={onClose} title="Enregistrer la réception" description={livraison?.marcheObjet} footer={<><Button variant="secondary" onClick={onClose}>Annuler</Button><Button onClick={submit} loading={loading}><PackageCheck className="h-4 w-4" /> Enregistrer</Button></>}>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date de réception" required>
            <Input type="date" value={form.dateReception} onChange={(e) => setForm({ ...form, dateReception: e.target.value })} />
          </Field>
          <Field label="Statut" required>
            <Select value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}>
              <option value="ACCEPTEE">Acceptée</option>
              <option value="ACCEPTEE_AVEC_RESERVES">Acceptée avec réserves</option>
              <option value="REFUSEE">Refusée</option>
            </Select>
          </Field>
        </div>
        <Field label="Observations"><Textarea value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} /></Field>
        <Field label="Réserves"><Textarea value={form.reserves} onChange={(e) => setForm({ ...form, reserves: e.target.value })} /></Field>
      </div>
    </Modal>
  )
}
