import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileText,
  PackageCheck,
  ShoppingBag,
  Truck,
} from 'lucide-react'
import { api, unwrap } from '../../lib/api'
import { dateShort, fcfa } from '../../lib/format'
import { useAuth } from '../../contexts/AuthContext'
import { Badge, Card, EmptyState, LoadingScreen, PageHeader, StatCard } from '../../components/ui'

export default function FournisseurDashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    unwrap(api.get('/rapports/fournisseur/dashboard'))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingScreen label="Chargement de votre espace…" />
  if (!data) return <EmptyState title="Impossible de charger votre tableau de bord" />

  return (
    <div>
      <PageHeader
        eyebrow="Espace fournisseur"
        title={`Bonjour, ${user?.prenom || user?.nomComplet}`}
        subtitle="Suivez vos opportunités, offres, marchés et livraisons en un seul endroit."
        actions={<Link to="/fournisseur/opportunites" className="btn-primary"><ShoppingBag className="h-4 w-4" /> Voir les opportunités</Link>}
      />

      {data.statutValidation !== 'VALIDE' && (
        <Card className={`mb-5 flex items-start gap-3 p-4 ${data.statutValidation === 'REJETE' ? 'border-rose-200 bg-rose-50' : 'border-amber-200 bg-amber-50'}`}>
          <AlertTriangle className={`mt-0.5 h-5 w-5 shrink-0 ${data.statutValidation === 'REJETE' ? 'text-rose-600' : 'text-amber-600'}`} />
          <div>
            <p className={`text-sm font-semibold ${data.statutValidation === 'REJETE' ? 'text-rose-800' : 'text-amber-800'}`}>
              {data.statutValidation === 'REJETE' ? 'Votre dossier a été rejeté' : 'Votre dossier est en attente de validation'}
            </p>
            <p className={`mt-0.5 text-xs ${data.statutValidation === 'REJETE' ? 'text-rose-700' : 'text-amber-700'}`}>
              {data.statutValidation === 'REJETE'
                ? 'Contactez l’administration pour connaître les corrections à apporter.'
                : 'Vous pourrez soumettre des offres dès que votre compte sera validé par un administrateur.'}
            </p>
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ShoppingBag} label="Opportunités disponibles" value={data.appelsOffresDisponibles} hint="Appels d’offres ouverts" />
        <StatCard icon={FileText} label="Offres soumises" value={data.offresSoumises} hint={`${data.offresEnEvaluation} en évaluation`} tone="blue" />
        <StatCard icon={BriefcaseBusiness} label="Marchés remportés" value={data.marchesRemportes} hint={`${data.marchesEnExecution} en exécution`} tone="violet" />
        <StatCard icon={Truck} label="Livraisons planifiées" value={data.livraisonsPlanifiees} hint="À venir" tone="amber" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">Mes dernières offres</h2>
              <p className="text-xs text-slate-500">Suivi de vos candidatures</p>
            </div>
            <Link to="/fournisseur/offres" className="text-xs font-semibold text-primary-700 hover:underline">Tout voir</Link>
          </div>
          {data.dernieresOffres?.length ? (
            <div className="divide-y divide-slate-100">
              {data.dernieresOffres.map((o) => (
                <Link key={o.id} to={`/fournisseur/offres/${o.id}`} className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-sand-50">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-700"><FileText className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{o.appelOffreObjet}</p>
                    <p className="text-xs text-slate-500">{o.reference || 'Brouillon'} · {fcfa(o.montant)}</p>
                  </div>
                  <div className="text-right"><Badge value={o.statut} /><p className="mt-1 text-[11px] text-slate-400">{dateShort(o.dateCreation)}</p></div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState icon={FileText} title="Aucune offre" description="Consultez les opportunités et soumettez votre première offre." action={<Link to="/fournisseur/opportunites" className="btn-primary">Voir les opportunités</Link>} />
          )}
        </Card>

        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-base font-bold text-slate-900"><Truck className="h-4 w-4 text-primary-600" /> Prochaines livraisons</h2>
              <Link to="/fournisseur/livraisons" className="text-xs font-semibold text-primary-700 hover:underline">Voir</Link>
            </div>
            <div className="mt-3 space-y-2.5">
              {data.prochainesLivraisons?.length ? data.prochainesLivraisons.map((l) => (
                <div key={l.id} className="rounded-xl border border-slate-200 px-3.5 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-slate-800">{l.marcheObjet}</p>
                    <Badge value={l.statut} />
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500"><Clock className="h-3 w-3" /> Prévue le {dateShort(l.datePrevue)}</p>
                </div>
              )) : <p className="text-sm text-slate-500">Aucune livraison planifiée.</p>}
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-primary-900 to-primary-700 p-5 text-white">
            <PackageCheck className="h-7 w-7 text-amber-300" />
            <h3 className="mt-3 font-display text-lg font-bold">Prêt à candidater ?</h3>
            <p className="mt-1 text-sm leading-6 text-primary-100/80">Explorez les consultations ouvertes et déposez votre offre avant la date limite.</p>
            <Link to="/fournisseur/opportunites" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-primary-900 hover:bg-primary-50">
              Explorer <ArrowRight className="h-4 w-4" />
            </Link>
          </Card>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Quick to="/fournisseur/offres" icon={ClipboardCheck} title="Mes offres" text="Brouillons et offres soumises" />
        <Quick to="/fournisseur/marches" icon={BriefcaseBusiness} title="Mes marchés" text="Marchés remportés et en cours" />
        <Quick to="/fournisseur/livraisons" icon={CheckCircle2} title="Mes livraisons" text="Planifier et déclarer" />
      </div>
    </div>
  )
}

function Quick({ to, icon: Icon, title, text }) {
  return (
    <Link to={to} className="group">
      <Card className="card-hover flex items-center gap-3 p-4">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600 group-hover:bg-primary-100 group-hover:text-primary-700"><Icon className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-800">{title}</p><p className="truncate text-xs text-slate-500">{text}</p></div>
        <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-primary-600" />
      </Card>
    </Link>
  )
}
