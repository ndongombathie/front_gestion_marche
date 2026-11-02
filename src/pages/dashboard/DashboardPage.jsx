import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  ChartNoAxesCombined,
  ClipboardList,
  Handshake,
  Plus,
  ShoppingBag,
  Truck,
  Users,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api, unwrap } from '../../lib/api'
import { compact, dateShort, fcfa, humanize } from '../../lib/format'
import { useAuth } from '../../contexts/AuthContext'
import { Badge, Card, EmptyState, LoadingScreen, PageHeader, ProgressBar, StatCard } from '../../components/ui'

const PIE_COLORS = ['#15803d', '#22c55e', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444', '#64748b', '#14b8a6']

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    unwrap(api.get('/rapports/dashboard'))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingScreen label="Chargement du tableau de bord…" />
  if (!data) return <EmptyState title="Impossible de charger le tableau de bord" description="Vérifiez votre connexion puis réessayez." />

  const greeting = new Date().getHours() < 18 ? 'Bonjour' : 'Bonsoir'

  return (
    <div>
      <PageHeader
        eyebrow="Pilotage"
        title={`${greeting}, ${user?.prenom || ''}`}
        subtitle="Vue consolidée de l’activité des marchés publics de matériels et équipements."
        actions={
          <>
            <Link to="/besoins" className="btn-secondary"><Plus className="h-4 w-4" /> Nouveau besoin</Link>
            <Link to="/rapports" className="btn-primary"><ChartNoAxesCombined className="h-4 w-4" /> Rapports</Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={BriefcaseBusiness} label="Marchés suivis" value={data.totalMarches} hint="Tous statuts confondus" tone="green" />
        <StatCard icon={ShoppingBag} label="Appels d’offres publiés" value={data.appelsOffresPublies} hint="Consultations ouvertes" tone="blue" />
        <StatCard icon={ChartNoAxesCombined} label="Montant attribué" value={fcfa(data.montantAttribue)} hint={`Prévisionnel : ${compact(data.montantPrevisionnel)} FCFA`} tone="violet" />
        <StatCard icon={AlertTriangle} label="Livraisons en retard" value={data.livraisonsEnRetard} hint={`Taux de respect : ${Number(data.tauxLivraisonDelais).toFixed(1)} %`} tone={data.livraisonsEnRetard > 0 ? 'rose' : 'green'} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat icon={Users} label="Fournisseurs actifs" value={data.fournisseursActifs} />
        <MiniStat icon={Handshake} label="Offres reçues" value={data.offresRecues} />
        <MiniStat icon={Truck} label="Taux de livraison à temps" value={`${Number(data.tauxLivraisonDelais).toFixed(0)} %`} />
        <MiniStat icon={Building2} label="Budget prévisionnel" value={`${compact(data.montantPrevisionnel)} FCFA`} />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">Évolution mensuelle des marchés</h2>
              <p className="text-xs text-slate-500">Nombre de marchés créés sur les derniers mois</p>
            </div>
            <span className="badge bg-primary-50 text-primary-700 ring-primary-200">12 mois</span>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.evolutionMensuelle || []} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="evo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16a34a" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#16a34a" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
                <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Area type="monotone" dataKey="total" name="Marchés" stroke="#15803d" strokeWidth={2.5} fill="url(#evo)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-base font-bold text-slate-900">Répartition par statut</h2>
          <p className="text-xs text-slate-500">Portefeuille de marchés</p>
          <div className="mt-2 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.marchesParStatut || []} dataKey="valeur" nameKey="label" innerRadius={52} outerRadius={78} paddingAngle={3}>
                  {(data.marchesParStatut || []).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [v, humanize(n)]} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {(data.marchesParStatut || []).map((s, i) => (
              <div key={s.label} className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="truncate">{humanize(s.label)}</span>
                <span className="ml-auto font-semibold text-slate-800">{s.valeur}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.3fr_1fr]">
        <Card>
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">Marchés récents</h2>
              <p className="text-xs text-slate-500">Dernières opérations enregistrées</p>
            </div>
            <Link to="/marches" className="text-xs font-semibold text-primary-700 hover:underline">Tout voir</Link>
          </div>
          {data.marchesRecents?.length ? (
            <div className="divide-y divide-slate-100">
              {data.marchesRecents.slice(0, 5).map((m) => (
                <Link key={m.id} to={`/marches/${m.id}`} className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-sand-50">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-700"><BriefcaseBusiness className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{m.objet}</p>
                    <p className="text-xs text-slate-500">{m.reference} · {fcfa(m.budgetPrevisionnel)}</p>
                  </div>
                  <div className="text-right">
                    <Badge value={m.statut} />
                    <p className="mt-1 text-[11px] text-slate-400">{dateShort(m.dateCreation)}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="Aucun marché récent" />
          )}
        </Card>

        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-slate-900">Classement fournisseurs</h2>
              <Link to="/fournisseurs" className="text-xs font-semibold text-primary-700 hover:underline">Détails</Link>
            </div>
            <div className="mt-4 space-y-3">
              {(data.classementFournisseurs || []).slice(0, 5).map((f, i) => {
                const max = Math.max(...(data.classementFournisseurs || []).map((x) => Number(x.montant) || 0), 1)
                return (
                  <div key={f.fournisseur}>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">{i + 1}</span>
                        <span className="truncate font-medium text-slate-700">{f.fournisseur}</span>
                      </span>
                      <span className="shrink-0 font-semibold text-slate-800">{compact(f.montant)} FCFA</span>
                    </div>
                    <ProgressBar value={(Number(f.montant) / max) * 100} className="mt-1.5 h-1.5" />
                  </div>
                )
              })}
              {!data.classementFournisseurs?.length && <p className="text-sm text-slate-500">Aucune attribution validée.</p>}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 font-display text-base font-bold text-slate-900"><AlertTriangle className="h-4 w-4 text-rose-500" /> Livraisons en retard</h2>
              <Link to="/livraisons" className="text-xs font-semibold text-primary-700 hover:underline">Voir</Link>
            </div>
            <div className="mt-3 space-y-2.5">
              {(data.livraisonsEnRetardListe || []).slice(0, 3).map((l) => (
                <div key={l.id} className="rounded-xl border border-rose-100 bg-rose-50/60 px-3 py-2.5">
                  <p className="truncate text-xs font-semibold text-slate-800">{l.marcheObjet}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">{l.raisonSociale} · prévue le {dateShort(l.datePrevue)}</p>
                </div>
              ))}
              {!data.livraisonsEnRetardListe?.length && <p className="text-sm text-slate-500">Aucune livraison en retard. 🎉</p>}
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-display text-base font-bold text-slate-900">Marchés par catégorie</h2>
          <div className="mt-3 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.marchesParCategorie || []} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar dataKey="valeur" name="Marchés" radius={[6, 6, 0, 0]} fill="#16a34a" maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-display text-base font-bold text-slate-900">Actions rapides</h2>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {[
              { to: '/besoins', icon: ClipboardList, label: 'Exprimer un besoin' },
              { to: '/marches', icon: BriefcaseBusiness, label: 'Créer un marché' },
              { to: '/appels-offres', icon: ShoppingBag, label: 'Publier un appel d’offres' },
              { to: '/livraisons', icon: Truck, label: 'Planifier une livraison' },
            ].map((a) => (
              <Link key={a.to} to={a.to} className="group flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-3 transition hover:border-primary-300 hover:bg-primary-50/50">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-600 group-hover:bg-primary-100 group-hover:text-primary-700"><a.icon className="h-4 w-4" /></span>
                <span className="flex-1 text-sm font-medium text-slate-700">{a.label}</span>
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-primary-600" />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function MiniStat({ icon: Icon, label, value }) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600"><Icon className="h-4.5 w-4.5" /></span>
      <div className="min-w-0">
        <p className="truncate font-display text-lg font-bold text-slate-900">{value}</p>
        <p className="truncate text-xs text-slate-500">{label}</p>
      </div>
    </Card>
  )
}
