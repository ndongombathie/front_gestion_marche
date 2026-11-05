import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarClock,
  ChartNoAxesCombined,
  CheckCircle2,
  FileSearch,
  Handshake,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  Users,
} from 'lucide-react'
import { api, unwrap } from '../../lib/api'
import { compact, dateShort, daysLeft, fcfa } from '../../lib/format'
import { Badge, Card, Skeleton } from '../../components/ui'

const STEPS = [
  { icon: FileSearch, title: 'Consultez les appels d’offres', text: 'Parcourez le catalogue public, filtrez par catégorie ou organisme et téléchargez les cahiers des charges.' },
  { icon: FileSearch, title: 'Préparez votre offre', text: 'Créez votre dossier en ligne, joignez les pièces administratives et techniques, puis soumettez avant la date limite.' },
  { icon: BadgeCheck, title: 'Suivez l’évaluation', text: 'La commission évalue selon des critères pondérés transparents. Le classement est consolidé automatiquement.' },
  { icon: Truck, title: 'Exécutez et livrez', text: 'Planifiez les livraisons, déclarez-les et faites constater la réception par l’administration.' },
]

export default function HomePage() {
  const [stats, setStats] = useState(null)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    unwrap(api.get('/public/statistiques')).then(setStats).catch(() => setStats(null))
  }, [])

  const search = (e) => {
    e.preventDefault()
    navigate(`/opportunites?q=${encodeURIComponent(query)}`)
  }

  return (
    <div>
      <section className="relative overflow-hidden bg-primary-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(34,197,94,0.28),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(184,154,99,0.2),transparent_50%)]" />
        <div className="absolute border rounded-full -right-24 top-10 h-72 w-72 border-white/10" />
        <div className="absolute border rounded-full -right-10 top-24 h-96 w-96 border-white/5" />
        <div className="container-page relative grid gap-12 py-16 sm:py-20 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:py-24">
          <div className="animate-fade-up">
            
            <h1 className="mt-5 max-w-3xl font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Les marchés publics de matériels, <span className="text-primary-300">simplifiés et transparents.</span>
            </h1>
            <p className="max-w-xl mt-5 text-base leading-7 text-primary-100/80 sm:text-lg">
              De l’expression du besoin à la réception des livraisons, MarchéPro centralise chaque étape du cycle de vie
              des marchés et connecte l’administration aux fournisseurs.
            </p>
            <form onSubmit={search} className="flex flex-col max-w-xl gap-2 p-2 mt-8 bg-white rounded-2xl shadow-soft sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher un appel d’offres, un matériel…"
                  className="w-full rounded-xl border-0 bg-transparent py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
              <button className="btn-primary shrink-0">
                Rechercher <ArrowRight className="w-4 h-4" />
              </button>
            </form>
            <div className="flex flex-wrap items-center mt-6 text-xs gap-x-6 gap-y-2 text-primary-100/70">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-primary-300" /> Traçabilité complète</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-primary-300" /> Dossiers 100 % en ligne</span>
              <span className="flex items-center gap-1.5"><Handshake className="w-4 h-4 text-primary-300" /> Évaluation équitable</span>
            </div>
          </div>

          <div className="animate-fade-up rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-xl [animation-delay:120ms]">
            <div className="p-5 bg-white shadow-2xl rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">Portail public</p>
                  <p className="text-lg font-bold font-display text-slate-900">Aperçu en temps réel</p>
                </div>
                <span className="badge bg-primary-50 text-primary-700 ring-primary-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-500" /> En ligne
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-5">
                {[
                  { label: 'Appels publiés', value: stats?.appelsOffresPublies, icon: ShoppingBag },
                  { label: 'Marchés suivis', value: stats?.marchesTotal, icon: Building2 },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl border border-slate-100 bg-sand-50 p-3.5">
                    <s.icon className="w-4 h-4 text-primary-600" />
                    <p className="mt-2 text-xl font-bold font-display text-slate-900">
                      {s.value == null ? <span className="inline-block w-10 h-6 rounded animate-pulse bg-slate-200" /> : s.raw ? `${s.value} FCFA` : s.value}
                    </p>
                    <p className="text-[11px] text-slate-500">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="p-4 mt-4 text-white rounded-2xl bg-primary-900">
                <p className="text-xs text-primary-200">Prochaine échéance</p>
                {stats?.bientotExpires?.[0] ? (
                  <>
                    <p className="mt-1 text-sm font-semibold line-clamp-1">{stats.bientotExpires[0].objet}</p>
                    <p className="mt-1 text-[11px] text-primary-200">
                      Date limite : {dateShort(stats.bientotExpires[0].dateLimite)}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-sm font-semibold">Aucune échéance imminente</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* <section className="relative z-10 -mt-8 container-page">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: ShoppingBag, label: 'Appels d’offres publiés', value: stats?.appelsOffresPublies ?? '—', tone: 'bg-primary-50 text-primary-700' },
            { icon: Building2, label: 'Marchés accompagnés', value: stats?.marchesTotal ?? '—', tone: 'bg-blue-50 text-blue-700' },
            { icon: Users, label: 'Fournisseurs actifs', value: stats?.fournisseursActifs ?? '—', tone: 'bg-amber-50 text-amber-700' },
            { icon: ChartNoAxesCombined, label: 'Montant attribué', value: stats ? fcfa(stats.montantAttribue) : '—', tone: 'bg-violet-50 text-violet-700' },
          ].map((s) => (
            <Card key={s.label} className="flex items-center gap-3 p-4">
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${s.tone}`}>
                <s.icon className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <p className="text-lg font-bold truncate font-display text-slate-900">{s.value}</p>
                <p className="text-xs truncate text-slate-500">{s.label}</p>
              </div>
            </Card>
          ))}
        </div>
      </section> */}

      <section className="py-16 container-page sm:py-20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">Opportunités</p>
            <h2 className="mt-1 section-title">Derniers appels d’offres</h2>
            <p className="max-w-xl mt-2 text-sm text-slate-500">
              Consultez les consultations en cours et soumettez votre offre avant la date limite.
            </p>
          </div>
          <Link to="/opportunites" className="btn-secondary shrink-0">
            Voir tout le catalogue <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid gap-4 mt-8 md:grid-cols-2 lg:grid-cols-3">
          {!stats &&
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-5">
                <Skeleton className="w-24 h-4" />
                <Skeleton className="w-full h-5 mt-3" />
                <Skeleton className="w-3/4 h-5 mt-2" />
                <Skeleton className="w-full mt-5 h-9" />
              </Card>
            ))}
          {stats?.recents?.map((ao) => <OpportunityCard key={ao.id} ao={ao} />)}
          {stats && !stats.recents?.length && (
            <Card className="p-10 text-sm text-center col-span-full text-slate-500">Aucun appel d’offres publié pour le moment.</Card>
          )}
        </div>
      </section>

      <section className="py-16 bg-white sm:py-20">
        <div className="container-page">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">Fonctionnement</p>
            <h2 className="mt-1 section-title">Un parcours clair, de bout en bout</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Quatre étapes structurées pour sécuriser la commande publique et donner à chaque fournisseur les mêmes chances.
            </p>
          </div>
          <div className="grid gap-5 mt-10 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <div key={step.title} className="relative p-5 border rounded-2xl border-slate-200 bg-sand-50">
                <span className="absolute text-3xl font-extrabold right-4 top-4 font-display text-slate-200">0{i + 1}</span>
                <span className="grid text-white h-11 w-11 place-items-center rounded-xl bg-primary-700">
                  <step.icon className="w-5 h-5" />
                </span>
                <h3 className="mt-4 text-base font-bold font-display text-slate-900">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-500">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 container-page sm:py-20">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">Catégories</p>
            <h2 className="mt-1 section-title">Tous les besoins en matériels et équipements</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Mobilier, informatique, véhicules, équipements techniques, fournitures de bureau… Les consultations couvrent
              l’ensemble des familles de produits nécessaires aux services publics.
            </p>
            <div className="flex flex-wrap gap-2 mt-6">
              {(stats?.categories?.length ? stats.categories : ['Informatique', 'Mobilier', 'Véhicules', 'Équipements', 'Fournitures']).map((c) => (
                <Link
                  key={c}
                  to={`/opportunites?categorie=${encodeURIComponent(c)}`}
                  className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-800"
                >
                  {c}
                </Link>
              ))}
            </div>
          </div>
          <Card className="overflow-hidden">
            <div className="p-6 text-white bg-gradient-to-br from-primary-800 to-primary-950">
              <h3 className="text-xl font-bold font-display">Vous êtes fournisseur ?</h3>
              <p className="mt-2 text-sm leading-6 text-primary-100/80">
                Créez votre compte, faites valider votre dossier et candidatez aux marchés publics depuis un espace unique.
              </p>
            </div>
            <div className="grid gap-3 p-6 sm:grid-cols-2">
              {[
                ['Dossier numérique', 'Toutes vos pièces centralisées et réutilisables.'],
                ['Suivi en temps réel', 'Statut de chaque offre et marché à portée de main.'],
                ['Notifications', 'Alertes sur les échéances et décisions.'],
                ['Assistant intelligent', 'Réponses instantanées à vos questions.'],
              ].map(([t, d]) => (
                <div key={t} className="rounded-xl border border-slate-100 bg-sand-50 p-3.5">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-primary-600" /> {t}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{d}</p>
                </div>
              ))}
              <div className="sm:col-span-2">
                <Link to="/inscription" className="w-full btn-primary">
                  Créer mon espace fournisseur <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  )
}

function OpportunityCard({ ao }) {
  const left = daysLeft(ao.dateLimite)
  return (
    <Link to={`/opportunites/${ao.id}`} className="group">
      <Card className="flex flex-col h-full p-5 card-hover">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-[11px] font-semibold text-slate-600">{ao.reference}</span>
          <Badge value={ao.ouvert ? 'PUBLIE' : 'CLOTURE'} label={ao.ouvert ? 'Ouvert' : 'Clôturé'} />
        </div>
        <h3 className="mt-3 text-base font-bold leading-snug line-clamp-2 font-display text-slate-900 group-hover:text-primary-800">
          {ao.objet}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-slate-500">{ao.description || ao.organisme}</p>
        <div className="mt-4 space-y-2 text-xs text-slate-500">
          <p className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5 text-slate-400" /> {ao.organisme || 'Administration'}</p>
          <p className="flex items-center gap-2"><CalendarClock className="h-3.5 w-3.5 text-slate-400" /> Limite : {dateShort(ao.dateLimite)}</p>
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3.5">
          <div>
            <p className="text-[11px] text-slate-400">Budget estimatif</p>
            <p className="text-sm font-semibold text-slate-800">{ao.budgetEstimatif ? fcfa(ao.budgetEstimatif) : 'Non communiqué'}</p>
          </div>
          {left != null && left >= 0 && (
            <span className={`text-xs font-semibold ${left <= 3 ? 'text-rose-600' : 'text-primary-700'}`}>
              {left === 0 ? 'Dernier jour' : `J-${left}`}
            </span>
          )}
        </div>
      </Card>
    </Link>
  )
}
