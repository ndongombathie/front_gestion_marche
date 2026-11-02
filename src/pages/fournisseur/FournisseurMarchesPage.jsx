import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BriefcaseBusiness, CalendarDays, ChevronRight, MapPin, PackageCheck, Truck } from 'lucide-react'
import { api, unwrap } from '../../lib/api'
import { dateShort, fcfa, humanize } from '../../lib/format'
import { Badge, Card, EmptyState, LoadingScreen, Modal, PageHeader, ProgressBar, StatCard } from '../../components/ui'

export default function FournisseurMarchesPage() {
  const [marches, setMarches] = useState([])
  const [livraisons, setLivraisons] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    Promise.all([
      unwrap(api.get('/marches/mes-marches')).catch(() => []),
      unwrap(api.get('/livraisons/mes-livraisons')).catch(() => []),
    ]).then(([m, l]) => {
      setMarches(m || [])
      setLivraisons(l || [])
    }).finally(() => setLoading(false))
  }, [])

  const byMarche = useMemo(() => {
    const map = {}
    livraisons.forEach((l) => { (map[l.marcheId] ||= []).push(l) })
    return map
  }, [livraisons])

  const totalAttribue = marches.reduce((sum, m) => sum + Number(m.montantAttribue || 0), 0)
  const enExecution = marches.filter((m) => ['ATTRIBUE', 'EN_EXECUTION'].includes(m.statut)).length
  const receptionnes = livraisons.filter((l) => l.statut === 'RECEPTIONNEE').length

  if (loading) return <LoadingScreen />

  return (
    <div>
      <PageHeader eyebrow="Exécution" title="Mes marchés" subtitle="Marchés qui vous ont été attribués et leur avancement." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={BriefcaseBusiness} label="Marchés remportés" value={marches.length} />
        <StatCard icon={PackageCheck} label="Montant total" value={fcfa(totalAttribue)} tone="violet" />
        <StatCard icon={Truck} label="Livraisons réceptionnées" value={receptionnes} hint={`${enExecution} marché(s) en exécution`} tone="amber" />
      </div>

      <div className="mt-5 space-y-4">
        {marches.length ? marches.map((m) => {
          const ls = byMarche[m.id] || []
          const done = ls.filter((l) => l.statut === 'RECEPTIONNEE').length
          const pct = ls.length ? Math.round((done / ls.length) * 100) : 0
          return (
            <Card key={m.id} className="p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-[11px] font-semibold text-slate-600">{m.reference}</span>
                    <Badge value={m.statut} />
                  </div>
                  <h2 className="mt-2 font-display text-lg font-bold text-slate-900">{m.objet}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">{m.description || 'Marché attribué'}</p>
                </div>
                <div className="shrink-0 text-left sm:text-right">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Montant attribué</p>
                  <p className="font-display text-lg font-bold text-primary-800">{fcfa(m.montantAttribue)}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Info icon={CalendarDays} label="Début d’exécution" value={dateShort(m.dateDebutExecution)} />
                <Info icon={CalendarDays} label="Fin prévue" value={dateShort(m.dateFinExecution)} />
                <Info icon={Truck} label="Livraisons" value={`${done} / ${ls.length} réceptionnée(s)`} />
              </div>

              {ls.length > 0 && (
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500"><span>Avancement des livraisons</span><span className="font-semibold text-slate-700">{pct}%</span></div>
                  <ProgressBar value={pct} />
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  {ls.slice(0, 3).map((l) => <Badge key={l.id} value={l.statut} label={`Livraison · ${dateShort(l.datePrevue)}`} />)}
                </div>
                <button onClick={() => setSelected(m)} className="inline-flex items-center gap-1 text-sm font-semibold text-primary-700 hover:underline">Détail <ChevronRight className="h-4 w-4" /></button>
              </div>
            </Card>
          )
        }) : (
          <Card><EmptyState icon={BriefcaseBusiness} title="Aucun marché remporté" description="Vos marchés attribués apparaîtront ici après validation par le directeur." action={<Link to="/fournisseur/opportunites" className="btn-primary">Voir les opportunités</Link>} /></Card>
        )}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.objet} size="lg">
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2"><span className="badge bg-slate-100 text-slate-700 ring-slate-200 font-mono">{selected.reference}</span><Badge value={selected.statut} /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Info icon={CalendarDays} label="Date de début" value={dateShort(selected.dateDebutExecution)} />
              <Info icon={CalendarDays} label="Date de fin" value={dateShort(selected.dateFinExecution)} />
              <Info icon={MapPin} label="Mode de passation" value={humanize(selected.modePassation)} />
              <Info icon={PackageCheck} label="Montant attribué" value={fcfa(selected.montantAttribue)} />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-bold text-slate-900">Prestations</h3>
              <div className="table-wrap">
                <table className="table-base">
                  <thead><tr><th>Désignation</th><th>Quantité</th><th>Unité</th></tr></thead>
                  <tbody>{selected.lignes?.map((l) => <tr key={l.id}><td className="font-medium">{l.designation}</td><td>{l.quantite}</td><td>{l.unite || '—'}</td></tr>)}</tbody>
                </table>
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-bold text-slate-900">Livraisons</h3>
              <div className="space-y-2">
                {(byMarche[selected.id] || []).length ? byMarche[selected.id].map((l) => (
                  <div key={l.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm">
                    <span className="text-slate-700">Prévue le {dateShort(l.datePrevue)}</span>
                    <Badge value={l.statut} />
                  </div>
                )) : <p className="text-sm text-slate-500">Aucune livraison planifiée.</p>}
              </div>
              <Link to="/fournisseur/livraisons" className="btn-secondary mt-3">Gérer les livraisons</Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function Info({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3.5 py-2.5">
      <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-slate-400"><Icon className="h-3 w-3" /> {label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-800">{value || '—'}</p>
    </div>
  )
}
