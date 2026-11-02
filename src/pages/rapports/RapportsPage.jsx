import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { BarChart3, CalendarRange, Download, FileSpreadsheet, FileText, RefreshCw } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api, errorMessage, unwrap } from '../../lib/api'
import { compact, dateShort, dateTime, fcfa, humanize } from '../../lib/format'
import { Button, Card, EmptyState, Field, Input, LoadingScreen, PageHeader, StatCard } from '../../components/ui'

const COLORS = ['#15803d', '#22c55e', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444', '#64748b', '#14b8a6']

export default function RapportsPage() {
  const [debut, setDebut] = useState('')
  const [fin, setFin] = useState('')
  const [data, setData] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    const params = { debut: debut || undefined, fin: fin || undefined }
    Promise.all([
      unwrap(api.get('/rapports/dashboard', { params })),
      unwrap(api.get('/rapports/historique')).catch(() => []),
    ])
      .then(([d, h]) => { setData(d); setHistory(h || []) })
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [debut, fin])

  useEffect(load, [load])

  const download = async (format) => {
    setDownloading(format)
    try {
      const response = await api.get(`/rapports/export/${format}`, {
        params: { debut: debut || undefined, fin: fin || undefined },
        responseType: 'blob',
      })
      const url = URL.createObjectURL(response.data)
      const a = document.createElement('a')
      a.href = url
      a.download = format === 'pdf' ? 'rapport-marches.pdf' : 'marches-export.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success(`Rapport ${format.toUpperCase()} téléchargé`)
      load()
    } catch (err) {
      toast.error(errorMessage(err, 'Impossible de générer le rapport.'))
    } finally {
      setDownloading('')
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Analyse"
        title="Rapports & indicateurs"
        subtitle="Analysez l’activité sur une période et exportez les rapports de pilotage."
        actions={
          <>
            <Button variant="secondary" onClick={() => download('excel')} loading={downloading === 'excel'}><FileSpreadsheet className="h-4 w-4" /> Excel</Button>
            <Button onClick={() => download('pdf')} loading={downloading === 'pdf'}><FileText className="h-4 w-4" /> PDF</Button>
          </>
        }
      />

      <Card className="mb-5 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field label="Du" className="sm:w-48"><Input type="date" value={debut} onChange={(e) => setDebut(e.target.value)} /></Field>
          <Field label="Au" className="sm:w-48"><Input type="date" value={fin} onChange={(e) => setFin(e.target.value)} /></Field>
          <Button variant="secondary" onClick={load} loading={loading}><RefreshCw className="h-4 w-4" /> Actualiser</Button>
          {(debut || fin) && <Button variant="ghost" onClick={() => { setDebut(''); setFin('') }}>Réinitialiser</Button>}
          <span className="ml-auto hidden items-center gap-1.5 text-xs text-slate-400 sm:flex"><CalendarRange className="h-4 w-4" /> Période personnalisable</span>
        </div>
      </Card>

      {loading ? (
        <LoadingScreen />
      ) : !data ? (
        <Card><EmptyState title="Impossible de charger les rapports" /></Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={BarChart3} label="Marchés" value={data.totalMarches} hint={`${data.appelsOffresPublies} appels publiés`} />
            <StatCard icon={FileText} label="Montant attribué" value={fcfa(data.montantAttribue)} hint={`Budget : ${compact(data.montantPrevisionnel)} FCFA`} tone="violet" />
            <StatCard icon={Download} label="Offres reçues" value={data.offresRecues} hint={`${data.fournisseursActifs} fournisseurs actifs`} tone="blue" />
            <StatCard icon={RefreshCw} label="Livraisons en retard" value={data.livraisonsEnRetard} hint={`Respect des délais : ${Number(data.tauxLivraisonDelais).toFixed(1)} %`} tone={data.livraisonsEnRetard ? 'rose' : 'green'} />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <Card className="p-5">
              <h2 className="font-display text-base font-bold text-slate-900">Répartition par statut</h2>
              <div className="mt-2 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.marchesParStatut || []} dataKey="valeur" nameKey="label" innerRadius={55} outerRadius={85} paddingAngle={3}>
                      {(data.marchesParStatut || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, humanize(n)]} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card className="p-5">
              <h2 className="font-display text-base font-bold text-slate-900">Marchés par catégorie</h2>
              <div className="mt-2 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.marchesParCategorie || []} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                    <Bar dataKey="valeur" name="Marchés" fill="#16a34a" radius={[6, 6, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card className="mt-5 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="font-display text-base font-bold text-slate-900">Historique des rapports</h2>
                <p className="text-xs text-slate-500">Rapports générés et horodatés</p>
              </div>
            </div>
            {history.length ? (
              <div className="table-wrap border-0">
                <table className="table-base">
                  <thead><tr><th>Titre</th><th>Format</th><th>Paramètres</th><th>Généré par</th><th>Date</th></tr></thead>
                  <tbody>
                    {history.map((r) => (
                      <tr key={r.id}>
                        <td className="font-medium text-slate-800">{r.titre}</td>
                        <td><span className="badge bg-slate-100 text-slate-600 ring-slate-200">{r.format}</span></td>
                        <td className="max-w-[240px] truncate text-xs text-slate-500">{r.parametres || '—'}</td>
                        <td className="text-slate-600">{r.generePar || '—'}</td>
                        <td className="whitespace-nowrap text-slate-500">{dateTime(r.dateGeneration)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState icon={FileText} title="Aucun rapport généré" description="Utilisez les boutons d’export pour créer votre premier rapport." />
            )}
          </Card>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <Card className="overflow-hidden">
              <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-display text-base font-bold text-slate-900">Classement fournisseurs</h2></div>
              <div className="table-wrap border-0">
                <table className="table-base">
                  <thead><tr><th>#</th><th>Fournisseur</th><th>Marchés</th><th>Montant</th></tr></thead>
                  <tbody>
                    {(data.classementFournisseurs || []).map((f, i) => (
                      <tr key={f.fournisseur}><td className="font-semibold text-slate-500">{i + 1}</td><td className="font-medium text-slate-800">{f.fournisseur}</td><td>{f.marches}</td><td className="font-semibold">{fcfa(f.montant)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
            <Card className="overflow-hidden">
              <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-display text-base font-bold text-slate-900">Marchés récents</h2></div>
              <div className="divide-y divide-slate-100">
                {(data.marchesRecents || []).slice(0, 5).map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0"><p className="truncate text-sm font-medium text-slate-800">{m.objet}</p><p className="text-xs text-slate-500">{m.reference} · {dateShort(m.dateCreation)}</p></div>
                    <span className="shrink-0 text-sm font-semibold text-slate-700">{compact(m.budgetPrevisionnel)}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
