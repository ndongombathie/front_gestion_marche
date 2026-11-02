import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  Download,
  FileText,
  Gavel,
  Megaphone,
  Package,
  Send,
  ShoppingBag,
  Timer,
  Users,
  X,
} from 'lucide-react'
import { api, errorMessage, unwrap } from '../../lib/api'
import { dateShort, dateTime, daysLeft, fcfa, humanize } from '../../lib/format'
import { useAuth } from '../../contexts/AuthContext'
import { Badge, Button, Card, EmptyState, Field, Input, LoadingScreen, Modal, PageHeader, Textarea } from '../../components/ui'

export default function AppelOffreDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasRole } = useAuth()
  const [ao, setAo] = useState(null)
  const [offres, setOffres] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancel, setCancel] = useState(false)
  const [prolong, setProlong] = useState(false)

  const canManage = hasRole('RESPONSABLE_SERVICE', 'ADMINISTRATEUR')
  const canEvaluate = hasRole('MEMBRE_COMMISSION', 'ADMINISTRATEUR')

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      unwrap(api.get(`/appels-offres/${id}`)),
      unwrap(api.get(`/offres/appel-offre/${id}`)).catch(() => []),
    ])
      .then(([a, o]) => {
        setAo(a)
        setOffres(o || [])
      })
      .catch(() => setAo(null))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(load, [load])

  if (loading) return <LoadingScreen />
  if (!ao) return <Card><EmptyState title="Appel d’offres introuvable" action={<Link to="/appels-offres" className="btn-primary">Retour</Link>} /></Card>

  const left = daysLeft(ao.dateLimite)

  const publish = async () => {
    try {
      await unwrap(api.post(`/appels-offres/${ao.id}/publier`))
      toast.success('Appel d’offres publié')
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <div>
      <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primary-700"><ArrowLeft className="h-4 w-4" /> Retour</button>
      <PageHeader
        eyebrow={ao.reference}
        title={ao.objet}
        subtitle={`${ao.organisme || 'Administration'} · ${ao.marcheReference || 'Sans marché rattaché'}`}
        actions={
          <>
            {canManage && ao.statut === 'BROUILLON' && <Button onClick={publish}><Megaphone className="h-4 w-4" /> Publier</Button>}
            {canManage && ao.statut === 'PUBLIE' && <Button variant="secondary" onClick={() => setProlong(true)}><Timer className="h-4 w-4" /> Prolonger</Button>}
            {canManage && ao.statut === 'PUBLIE' && <Button variant="danger" onClick={() => setCancel(true)}><X className="h-4 w-4" /> Annuler</Button>}
            {canEvaluate && ao.statut === 'PUBLIE' && <Button onClick={() => navigate(`/evaluations?ao=${ao.id}`)}><Gavel className="h-4 w-4" /> Évaluer</Button>}
          </>
        }
      >
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge value={ao.statut} />
          {ao.categorie && <span className="badge bg-slate-100 text-slate-600 ring-slate-200">{ao.categorie}</span>}
          <span className="badge bg-slate-100 text-slate-600 ring-slate-200">{ao.nombreOffres} offre{ao.nombreOffres > 1 ? 's' : ''}</span>
          {ao.budgetEstimatif && <span className="badge bg-primary-50 text-primary-700 ring-primary-200">{fcfa(ao.budgetEstimatif)}</span>}
        </div>
      </PageHeader>

      <div className="grid gap-5 xl:grid-cols-[1.55fr_.85fr]">
        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="font-display text-base font-bold text-slate-900">Présentation</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{ao.description || 'Aucune description.'}</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Info label="Organisme" value={ao.organisme} />
              <Info label="Publié par" value={ao.publiePar} />
              <Info label="Date de publication" value={dateShort(ao.datePublication)} />
              <Info label="Date limite" value={dateTime(ao.dateLimite)} />
              <Info label="Budget public" value={ao.budgetPublic ? 'Oui' : 'Non'} />
              <Info label="Ouvert" value={ao.ouvert ? 'Oui' : 'Non'} />
            </div>
          </Card>

          {ao.materiels?.length > 0 && (
            <Card className="overflow-hidden">
              <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
                <Package className="h-4 w-4 text-primary-600" /><h2 className="font-display text-base font-bold text-slate-900">Matériels concernés</h2>
              </div>
              <div className="table-wrap border-0">
                <table className="table-base">
                  <thead><tr><th>Désignation</th><th>Quantité</th><th>Caractéristiques</th><th>PU estimé</th></tr></thead>
                  <tbody>
                    {ao.materiels.map((m) => (
                      <tr key={m.id}><td className="font-medium text-slate-800">{m.designation}</td><td>{m.quantite}</td><td className="text-slate-500">{m.caracteristiques || '—'}</td><td>{m.prixUnitaireEstime ? fcfa(m.prixUnitaireEstime) : '—'}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="flex items-center gap-2 font-display text-base font-bold text-slate-900"><Users className="h-4 w-4 text-primary-600" /> Offres reçues</h2>
              <span className="text-xs text-slate-500">{offres.length} offre{offres.length > 1 ? 's' : ''}</span>
            </div>
            {offres.length ? (
              <div className="table-wrap border-0">
                <table className="table-base">
                  <thead><tr><th>Référence</th><th>Fournisseur</th><th>Montant</th><th>Délai</th><th>Statut</th><th></th></tr></thead>
                  <tbody>
                    {offres.map((o) => (
                      <tr key={o.id}>
                        <td className="font-mono text-xs font-semibold text-slate-600">{o.reference || 'Brouillon'}</td>
                        <td><p className="font-medium text-slate-800">{o.raisonSociale}</p><p className="text-xs text-slate-500">{o.ninea}</p></td>
                        <td className="whitespace-nowrap font-medium">{fcfa(o.montant)}</td>
                        <td className="text-slate-600">{o.delaiLivraisonJours ? `${o.delaiLivraisonJours} j` : '—'}</td>
                        <td><Badge value={o.statut} /></td>
                        <td className="text-right"><Link to={`/evaluations?ao=${ao.id}&offre=${o.id}`} className="btn-secondary btn-sm">Évaluer</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState icon={ShoppingBag} title="Aucune offre reçue" description="Les offres des fournisseurs apparaîtront ici après soumission." />
            )}
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <TextBlock title="Conditions de participation" value={ao.conditionsParticipation} />
            <TextBlock title="Documents obligatoires" value={ao.documentsObligatoires} />
            <TextBlock title="Modalités de soumission" value={ao.modalitesSoumission} />
            <Card className="p-5">
              <h3 className="font-display text-sm font-bold text-slate-900">Documents joints</h3>
              {ao.documents?.length ? (
                <div className="mt-3 space-y-2">
                  {ao.documents.map((d) => (
                    <a key={d.id} href={`/api/documents/${d.id}/download`} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-sm hover:border-primary-300 hover:bg-primary-50/50">
                      <span className="flex min-w-0 items-center gap-2"><FileText className="h-4 w-4 shrink-0 text-primary-600" /><span className="truncate">{d.nom}</span></span>
                      <Download className="h-4 w-4 shrink-0 text-slate-400" />
                    </a>
                  ))}
                </div>
              ) : <p className="mt-2 text-sm text-slate-500">Aucun document joint.</p>}
            </Card>
          </div>
        </div>

        <aside className="space-y-5">
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Date limite</p>
            <p className="mt-1 font-display text-lg font-bold text-slate-900">{dateTime(ao.dateLimite)}</p>
            {left != null && (
              <div className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${left < 0 ? 'bg-slate-100 text-slate-500' : left <= 3 ? 'bg-rose-50 text-rose-700' : 'bg-primary-50 text-primary-700'}`}>
                <CalendarClock className="h-4 w-4" /> {left < 0 ? 'Date dépassée' : left === 0 ? 'Dernier jour' : `J-${left}`}
              </div>
            )}
            {ao.marcheId && <Link to={`/marches/${ao.marcheId}`} className="btn-secondary mt-4 w-full"><Building2 className="h-4 w-4" /> Voir le marché</Link>}
            <Link to={`/evaluations?ao=${ao.id}`} className="btn-primary mt-2 w-full"><Gavel className="h-4 w-4" /> Ouvrir l’évaluation</Link>
          </Card>
          <Card className="p-5">
            <h3 className="font-display text-sm font-bold text-slate-900">Suivi</h3>
            <div className="mt-3 space-y-3 text-sm">
              <Row label="Offres reçues" value={ao.nombreOffres} />
              <Row label="Statut" value={<Badge value={ao.statut} />} />
              <Row label="Ouvert" value={ao.ouvert ? 'Oui' : 'Non'} />
              <Row label="Créé le" value={dateShort(ao.dateCreation)} />
            </div>
          </Card>
        </aside>
      </div>

      <ProlongModal open={prolong} onClose={() => setProlong(false)} ao={ao} onDone={() => { setProlong(false); toast.success('Date limite prolongée'); load() }} />
      <CancelModal open={cancel} onClose={() => setCancel(false)} ao={ao} onDone={() => { setCancel(false); toast.success('Appel d’offres annulé'); load() }} />
    </div>
  )
}

function Info({ label, value }) {
  return <div><p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p><p className="mt-0.5 text-sm font-medium text-slate-800">{value || '—'}</p></div>
}

function Row({ label, value }) {
  return <div className="flex items-center justify-between gap-3"><span className="text-slate-500">{label}</span><span className="font-medium text-slate-800">{value}</span></div>
}

function TextBlock({ title, value }) {
  return (
    <Card className="p-5">
      <h3 className="font-display text-sm font-bold text-slate-900">{title}</h3>
      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{value || 'Non précisé.'}</p>
    </Card>
  )
}

function ProlongModal({ open, onClose, ao, onDone }) {
  const [date, setDate] = useState('')
  const [justification, setJustification] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setLoading(true)
    try {
      await unwrap(api.post(`/appels-offres/${ao.id}/prolonger`, { nouvelleDateLimite: date, justification }))
      setDate('')
      setJustification('')
      onDone()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Prolonger la date limite" description={ao?.objet} footer={<><Button variant="secondary" onClick={onClose}>Annuler</Button><Button onClick={submit} loading={loading}>Prolonger</Button></>}>
      <div className="space-y-4">
        <Field label="Nouvelle date limite" required><Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Justification" required><Textarea value={justification} onChange={(e) => setJustification(e.target.value)} /></Field>
      </div>
    </Modal>
  )
}

function CancelModal({ open, onClose, ao, onDone }) {
  const [motif, setMotif] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setLoading(true)
    try {
      await unwrap(api.post(`/appels-offres/${ao.id}/annuler`, { motif }))
      setMotif('')
      onDone()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Annuler l’appel d’offres" description={ao?.objet} footer={<><Button variant="secondary" onClick={onClose}>Fermer</Button><Button variant="danger" onClick={submit} loading={loading}>Confirmer</Button></>}>
      <Field label="Motif" required><Textarea value={motif} onChange={(e) => setMotif(e.target.value)} /></Field>
    </Modal>
  )
}
