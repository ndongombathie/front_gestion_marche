import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Ban,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardList,
  FileText,
  Gavel,
  Handshake,
  ListChecks,
  Package,
  Send,
  ShoppingBag,
  Truck,
  X,
} from 'lucide-react'
import { api, errorMessage, unwrap } from '../../lib/api'
import { dateLong, dateShort, fcfa, humanize } from '../../lib/format'
import { useAuth } from '../../contexts/AuthContext'
import { Badge, Button, Card, EmptyState, Field, LoadingScreen, Modal, PageHeader, ProgressBar, Textarea } from '../../components/ui'

export default function MarcheDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasRole } = useAuth()
  const [marche, setMarche] = useState(null)
  const [loading, setLoading] = useState(true)
  const [decision, setDecision] = useState(null)
  const [busy, setBusy] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    unwrap(api.get(`/marches/${id}`))
      .then(setMarche)
      .catch(() => setMarche(null))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(load, [load])

  if (loading) return <LoadingScreen />
  if (!marche) return <Card><EmptyState title="Marché introuvable" description="Ce marché n’existe pas ou vous n’y avez pas accès." action={<Link to="/marches" className="btn-primary">Retour aux marchés</Link>} /></Card>

  const canManage = hasRole('RESPONSABLE_SERVICE', 'ADMINISTRATEUR')
  const canDecide = hasRole('DIRECTEUR', 'ADMINISTRATEUR')

  const simpleAction = async (action, label, body) => {
    setBusy(action)
    try {
      await unwrap(api.post(`/marches/${id}/${action}`, body))
      toast.success(label)
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy('')
    }
  }

  const totalPonderation = (marche.criteres || []).reduce((s, c) => s + Number(c.ponderation || 0), 0)
  const executionProgress = (() => {
    if (!marche.dateDebutExecution || !marche.dateFinExecution) return 0
    const start = new Date(marche.dateDebutExecution).getTime()
    const end = new Date(marche.dateFinExecution).getTime()
    if (end <= start) return 0
    return Math.min(100, Math.max(0, ((Date.now() - start) / (end - start)) * 100))
  })()

  return (
    <div>
      <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primary-700">
        <ArrowLeft className="h-4 w-4" /> Retour
      </button>

      <PageHeader
        eyebrow={marche.reference}
        title={marche.objet}
        subtitle={`${humanize(marche.modePassation)} · créé par ${marche.createurNom || '—'}`}
        actions={
          <>
            {canManage && marche.statut === 'EN_PREPARATION' && (
              <>
                <Button variant="secondary" onClick={() => simpleAction('soumettre', 'Marché soumis pour validation')} loading={busy === 'soumettre'}><Send className="h-4 w-4" /> Soumettre</Button>
                <Button onClick={() => navigate(`/appels-offres?marcheId=${marche.id}`)}><ShoppingBag className="h-4 w-4" /> Créer l’appel d’offres</Button>
              </>
            )}
            {canDecide && marche.statut === 'EN_VALIDATION' && (
              <Button onClick={() => setDecision('validation')}><Gavel className="h-4 w-4" /> Décider</Button>
            )}
            {canDecide && ['PUBLIE', 'EN_EVALUATION', 'ATTRIBUE', 'EN_EXECUTION'].includes(marche.statut) && (
              <Button variant="secondary" onClick={() => setDecision('annulation')}><Ban className="h-4 w-4" /> Annuler</Button>
            )}
            {canDecide && marche.statut === 'EN_EXECUTION' && (
              <Button onClick={() => simpleAction('cloturer', 'Marché clôturé')} loading={busy === 'cloturer'}><CheckCircle2 className="h-4 w-4" /> Clôturer</Button>
            )}
          </>
        }
      >
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge value={marche.statut} />
          <span className="badge bg-slate-100 text-slate-600 ring-slate-200">{fcfa(marche.budgetPrevisionnel)}</span>
          {marche.fournisseurAttribue && <span className="badge bg-primary-50 text-primary-700 ring-primary-200"><Handshake className="h-3 w-3" /> {marche.fournisseurAttribue}</span>}
        </div>
      </PageHeader>

      <div className="grid gap-5 xl:grid-cols-[1.55fr_.85fr]">
        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="font-display text-base font-bold text-slate-900">Informations générales</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Info label="Référence" value={marche.reference} mono />
              <Info label="Mode de passation" value={humanize(marche.modePassation)} />
              <Info label="Budget prévisionnel" value={fcfa(marche.budgetPrevisionnel)} />
              <Info label="Date de création" value={dateLong(marche.dateCreation)} />
              <Info label="Date de validation" value={dateLong(marche.dateValidation)} />
              <Info label="Date de publication" value={dateLong(marche.datePublication)} />
              <Info label="Début d’exécution" value={dateLong(marche.dateDebutExecution)} />
              <Info label="Fin d’exécution" value={dateLong(marche.dateFinExecution)} />
              <Info label="Nombre d’offres" value={marche.nombreOffres} />
            </div>
            {marche.description && (
              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Description</p>
                <p className="mt-1.5 whitespace-pre-line text-sm leading-6 text-slate-600">{marche.description}</p>
              </div>
            )}
            {marche.observations && (
              <div className="mt-4 rounded-xl bg-sand-50 px-4 py-3 text-sm text-slate-600"><span className="font-semibold">Observations : </span>{marche.observations}</div>
            )}
            {marche.motifAnnulation && (
              <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700"><span className="font-semibold">Motif d’annulation : </span>{marche.motifAnnulation}</div>
            )}
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="flex items-center gap-2 font-display text-base font-bold text-slate-900"><Package className="h-4 w-4 text-primary-600" /> Matériels du marché</h2>
              <span className="text-xs text-slate-500">{marche.lignes?.length || 0} ligne{(marche.lignes?.length || 0) > 1 ? 's' : ''}</span>
            </div>
            <div className="table-wrap border-0">
              <table className="table-base">
                <thead><tr><th>Désignation</th><th>Quantité</th><th>Caractéristiques</th><th>PU estimé</th></tr></thead>
                <tbody>
                  {marche.lignes?.map((l) => (
                    <tr key={l.id}>
                      <td className="font-medium text-slate-800">{l.designation}</td>
                      <td>{l.quantite}</td>
                      <td className="text-slate-500">{l.caracteristiques || '—'}</td>
                      <td>{l.prixUnitaireEstime ? fcfa(l.prixUnitaireEstime) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-base font-bold text-slate-900"><ListChecks className="h-4 w-4 text-primary-600" /> Critères d’évaluation</h2>
              <span className={`text-xs font-semibold ${totalPonderation === 100 ? 'text-primary-700' : 'text-amber-600'}`}>Total : {totalPonderation} %</span>
            </div>
            <div className="mt-4 space-y-3">
              {marche.criteres?.length ? marche.criteres.map((c) => (
                <div key={c.id} className="rounded-xl border border-slate-200 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800">{c.libelle}</p>
                    <span className="badge bg-slate-100 text-slate-600 ring-slate-200">{humanize(c.type)} · {c.ponderation} %</span>
                  </div>
                  {c.description && <p className="mt-1 text-xs text-slate-500">{c.description}</p>}
                  <ProgressBar value={c.ponderation} className="mt-2 h-1.5" />
                </div>
              )) : <p className="text-sm text-slate-500">Aucun critère défini.</p>}
            </div>
          </Card>
        </div>

        <aside className="space-y-5">
          <Card className="p-5">
            <h2 className="font-display text-base font-bold text-slate-900">Progression</h2>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Exécution</span>
                <span className="font-semibold text-slate-800">{executionProgress.toFixed(0)} %</span>
              </div>
              <ProgressBar value={executionProgress} className="mt-1.5" />
            </div>
            <div className="mt-5 space-y-3 border-t border-slate-100 pt-4 text-sm">
              <LinkRow to={marche.expressionBesoinId ? '/besoins' : null} icon={ClipboardList} label="Besoin d’origine" value={marche.expressionBesoinReference || 'Non rattaché'} />
              <LinkRow to={marche.appelOffreId ? `/appels-offres/${marche.appelOffreId}` : null} icon={ShoppingBag} label="Appel d’offres" value={marche.appelOffreReference || 'Non publié'} />
              <LinkRow to={marche.attributionId ? '/attributions' : null} icon={Handshake} label="Attribution" value={marche.fournisseurAttribue || 'En attente'} />
              <LinkRow to="/livraisons" icon={Truck} label="Livraisons" value="Suivre les livraisons" />
            </div>
            {marche.montantAttribue && (
              <div className="mt-4 rounded-xl bg-primary-50 px-4 py-3">
                <p className="text-xs text-primary-700">Montant attribué</p>
                <p className="font-display text-lg font-bold text-primary-900">{fcfa(marche.montantAttribue)}</p>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="font-display text-base font-bold text-slate-900">Chronologie</h2>
            <ol className="mt-4 space-y-4">
              {[
                ['Création', marche.dateCreation, true],
                ['Soumission', marche.statut !== 'EN_PREPARATION' ? marche.dateCreation : null, marche.statut !== 'EN_PREPARATION'],
                ['Validation', marche.dateValidation, Boolean(marche.dateValidation)],
                ['Publication', marche.datePublication, Boolean(marche.datePublication)],
                ['Clôture', marche.dateCloture, Boolean(marche.dateCloture)],
              ].map(([label, date, done], i) => (
                <li key={label} className="relative flex gap-3 pb-1">
                  {i < 4 && <span className="absolute left-[9px] top-5 h-full w-px bg-slate-200" />}
                  <span className={`relative z-10 mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full ${done ? 'bg-primary-600 text-white' : 'border-2 border-slate-200 bg-white'}`}>
                    {done && <Check className="h-3 w-3" />}
                  </span>
                  <div>
                    <p className={`text-sm font-medium ${done ? 'text-slate-800' : 'text-slate-400'}`}>{label}</p>
                    <p className="text-xs text-slate-400">{date ? dateShort(date) : 'En attente'}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-display text-sm font-bold text-slate-900"><CalendarDays className="h-4 w-4 text-primary-600" /> Actions disponibles</h2>
            <div className="mt-3 space-y-2">
              <Link to={`/appels-offres?marcheId=${marche.id}`} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:border-primary-300 hover:bg-primary-50/50"><ShoppingBag className="h-4 w-4 text-slate-400" /> Appels d’offres</Link>
              <Link to="/evaluations" className="flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:border-primary-300 hover:bg-primary-50/50"><Gavel className="h-4 w-4 text-slate-400" /> Évaluations</Link>
              <Link to="/livraisons" className="flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:border-primary-300 hover:bg-primary-50/50"><Truck className="h-4 w-4 text-slate-400" /> Livraisons</Link>
            </div>
          </Card>
        </aside>
      </div>

      <DecisionModal mode={decision} onClose={() => setDecision(null)} onDone={(msg) => { toast.success(msg); setDecision(null); load() }} marche={marche} />
    </div>
  )
}

function Info({ label, value, mono }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-0.5 text-sm font-medium text-slate-800 ${mono ? 'font-mono text-xs' : ''}`}>{value || '—'}</p>
    </div>
  )
}

function LinkRow({ to, icon: Icon, label, value }) {
  const content = (
    <div className="flex items-center gap-2.5">
      <Icon className="h-4 w-4 shrink-0 text-slate-400" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="truncate text-sm font-medium text-slate-700">{value}</p>
      </div>
    </div>
  )
  return to ? <Link to={to} className="block rounded-lg py-1 hover:bg-slate-50">{content}</Link> : <div className="py-1">{content}</div>
}

function DecisionModal({ mode, onClose, onDone, marche }) {
  const [motif, setMotif] = useState('')
  const [loading, setLoading] = useState('')

  const run = async (action) => {
    setLoading(action)
    try {
      await unwrap(api.post(`/marches/${marche.id}/${action}`, { motif: motif || null }))
      const labels = { valider: 'Marché validé', rejeter: 'Marché rejeté', annuler: 'Marché annulé' }
      setMotif('')
      onDone(labels[action])
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setLoading('')
    }
  }

  if (mode === 'annulation') {
    return (
      <Modal open onClose={onClose} title="Annuler le marché" description={marche?.objet} footer={<><Button variant="secondary" onClick={onClose}>Fermer</Button><Button variant="danger" loading={loading === 'annuler'} onClick={() => run('annuler')}><Ban className="h-4 w-4" /> Confirmer l’annulation</Button></>}>
        <Field label="Motif d’annulation" required>
          <Textarea value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Indiquez la raison de l’annulation…" />
        </Field>
      </Modal>
    )
  }

  return (
    <Modal
      open={Boolean(mode)}
      onClose={onClose}
      title="Validation du marché"
      description={marche?.objet}
      footer={<><Button variant="secondary" onClick={onClose}>Annuler</Button><Button variant="danger" loading={loading === 'rejeter'} onClick={() => run('rejeter')}><X className="h-4 w-4" /> Rejeter</Button><Button loading={loading === 'valider'} onClick={() => run('valider')}><Check className="h-4 w-4" /> Valider</Button></>}
    >
      <Field label="Motif / commentaire" hint="Obligatoire en cas de rejet.">
        <Textarea value={motif} onChange={(e) => setMotif(e.target.value)} />
      </Field>
    </Modal>
  )
}
