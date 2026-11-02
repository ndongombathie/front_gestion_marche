import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  CheckCircle2,
  Download,
  FileText,
  Info,
  Lock,
  MapPin,
  Package,
  Send,
  ShieldCheck,
  Timer,
} from 'lucide-react'
import { api, unwrap } from '../../lib/api'
import { dateLong, dateShort, dateTime, daysLeft, fcfa, humanize } from '../../lib/format'
import { useAuth } from '../../contexts/AuthContext'
import { Badge, Button, Card, EmptyState, LoadingScreen } from '../../components/ui'

export default function OpportunityDetailPage() {
  const { id } = useParams()
  const { isAuthenticated, isFournisseur } = useAuth()
  const navigate = useNavigate()
  const [ao, setAo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    unwrap(api.get(`/appels-offres/public/${id}`))
      .then(setAo)
      .catch(() => setAo(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingScreen />
  if (!ao)
    return (
      <div className="container-page py-16">
        <Card><EmptyState title="Appel d’offres introuvable" description="Cette consultation n’existe pas ou n’est plus publique." action={<Link to="/opportunites" className="btn-primary">Retour au catalogue</Link>} /></Card>
      </div>
    )

  const left = daysLeft(ao.dateLimite)
  const apply = () => {
    if (!isAuthenticated) navigate('/connexion', { state: { from: { pathname: `/opportunites/${id}` } } })
    else if (!isFournisseur) navigate('/dashboard')
    else navigate(`/fournisseur/offres/nouveau?ao=${ao.id}`)
  }

  return (
    <div className="bg-sand-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="container-page py-4">
          <Link to="/opportunites" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primary-700">
            <ArrowLeft className="h-4 w-4" /> Retour aux appels d’offres
          </Link>
        </div>
      </div>

      <div className="container-page grid gap-6 py-8 lg:grid-cols-[1.55fr_.85fr]">
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 bg-gradient-to-br from-primary-900 to-primary-800 px-6 py-7 text-white">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-white/15 px-2.5 py-1 font-mono text-xs font-semibold">{ao.reference}</span>
                <Badge value={ao.ouvert ? 'PUBLIE' : 'CLOTURE'} label={ao.ouvert ? 'Ouvert aux candidatures' : 'Clôturé'} className="bg-white/15 text-white ring-white/25" />
                {ao.categorie && <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs">{ao.categorie}</span>}
              </div>
              <h1 className="mt-4 font-display text-2xl font-extrabold leading-tight sm:text-3xl">{ao.objet}</h1>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-primary-100/85">
                <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4" /> {ao.organisme || 'Administration'}</span>
                <span className="flex items-center gap-1.5"><CalendarClock className="h-4 w-4" /> Publié le {dateShort(ao.datePublication)}</span>
                <span className="flex items-center gap-1.5"><Package className="h-4 w-4" /> {ao.nombreOffres} offre{ao.nombreOffres > 1 ? 's' : ''} reçue{ao.nombreOffres > 1 ? 's' : ''}</span>
              </div>
            </div>
            <div className="space-y-7 p-6">
              <Section title="Présentation de la consultation">
                <p className="whitespace-pre-line text-sm leading-7 text-slate-600">{ao.description || 'Aucune description fournie.'}</p>
              </Section>

              {ao.materiels?.length > 0 && (
                <Section title="Matériels concernés" icon={Package}>
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-4 py-2.5 font-semibold">Désignation</th>
                          <th className="px-4 py-2.5 font-semibold">Quantité</th>
                          <th className="px-4 py-2.5 font-semibold">Caractéristiques</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ao.materiels.map((m) => (
                          <tr key={m.id} className="border-t border-slate-100">
                            <td className="px-4 py-2.5 font-medium text-slate-800">{m.designation}</td>
                            <td className="px-4 py-2.5 text-slate-600">{m.quantite}</td>
                            <td className="px-4 py-2.5 text-slate-500">{m.caracteristiques || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Section>
              )}

              {ao.conditionsParticipation && (
                <Section title="Conditions de participation">
                  <p className="whitespace-pre-line text-sm leading-7 text-slate-600">{ao.conditionsParticipation}</p>
                </Section>
              )}

              {ao.documentsObligatoires && (
                <Section title="Documents obligatoires" icon={FileText}>
                  <p className="whitespace-pre-line text-sm leading-7 text-slate-600">{ao.documentsObligatoires}</p>
                </Section>
              )}

              {ao.modalitesSoumission && (
                <Section title="Modalités de soumission">
                  <p className="whitespace-pre-line text-sm leading-7 text-slate-600">{ao.modalitesSoumission}</p>
                </Section>
              )}

              <Section title="Documents du dossier" icon={FileText}>
                {ao.documents?.length ? (
                  <div className="space-y-2">
                    {ao.documents.map((doc) => (
                      <a
                        key={doc.id}
                        href={`/api/documents/${doc.id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 transition hover:border-primary-300 hover:bg-primary-50/50"
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-700">
                            <FileText className="h-4 w-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-slate-800">{doc.nom}</span>
                            <span className="block text-xs text-slate-500">{humanize(doc.type)} · {(doc.taille / 1024).toFixed(0)} Ko</span>
                          </span>
                        </span>
                        <Download className="h-4 w-4 shrink-0 text-slate-400" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Aucun document n’a été joint à cette consultation.</p>
                )}
              </Section>
            </div>
          </Card>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Date limite de soumission</p>
            <p className="mt-1.5 font-display text-xl font-bold text-slate-900">{dateTime(ao.dateLimite)}</p>
            {left != null && (
              <div className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${left < 0 ? 'bg-slate-100 text-slate-500' : left <= 3 ? 'bg-rose-50 text-rose-700' : 'bg-primary-50 text-primary-700'}`}>
                <Timer className="h-4 w-4" />
                {left < 0 ? 'Date limite dépassée' : left === 0 ? 'Dernier jour pour candidater' : `Il reste ${left} jour${left > 1 ? 's' : ''}`}
              </div>
            )}
            <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-4 text-sm">
              <Row label="Budget estimatif" value={ao.budgetEstimatif ? fcfa(ao.budgetEstimatif) : 'Non communiqué'} />
              <Row label="Catégorie" value={ao.categorie || '—'} />
              <Row label="Offres reçues" value={ao.nombreOffres} />
            </div>
            <Button onClick={apply} className="mt-5 w-full" disabled={!ao.ouvert}>
              {isFournisseur ? <><Send className="h-4 w-4" /> Soumettre une offre</> : <><Lock className="h-4 w-4" /> {isAuthenticated ? 'Réservé aux fournisseurs' : 'Se connecter pour candidater'}</>}
            </Button>
            {!ao.ouvert && <p className="mt-2 text-center text-xs text-slate-500">Les candidatures sont closes pour cette consultation.</p>}
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5" /> Dossier dématérialisé et horodaté
            </p>
          </Card>

          <Card className="p-5">
            <p className="flex items-center gap-2 font-display text-sm font-bold text-slate-900"><Info className="h-4 w-4 text-primary-600" /> À savoir</p>
            <ul className="mt-3 space-y-2.5 text-xs leading-5 text-slate-500">
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-600" /> Votre dossier doit être complet avant la date limite.</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-600" /> Les offres sont évaluées selon des critères pondérés publiés.</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-600" /> Un accusé de réception est généré après soumission.</li>
            </ul>
          </Card>

          <Card className="p-5">
            <p className="font-display text-sm font-bold text-slate-900">Besoin d’aide ?</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Contactez la cellule des marchés pour toute question sur cette consultation.</p>
            <p className="mt-3 flex items-center gap-2 text-xs text-slate-600"><MapPin className="h-3.5 w-3.5 text-slate-400" /> Dakar, Sénégal</p>
          </Card>
        </aside>
      </div>
    </div>
  )
}

function Section({ title, icon: Icon, children }) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 font-display text-base font-bold text-slate-900">
        {Icon && <Icon className="h-4 w-4 text-primary-600" />} {title}
      </h2>
      {children}
    </section>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-800">{value}</span>
    </div>
  )
}
