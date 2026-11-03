import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Award, CheckCircle2, ChevronLeft, ChevronRight, ClipboardCheck, Download, Eye, FileImage, FileText, Gavel, Medal, Scale, Search, Star, Users, X } from 'lucide-react'
import { api, errorMessage, unwrap } from '../../lib/api'
import { dateShort, fcfa, humanize } from '../../lib/format'
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
  ProgressBar,
  Select,
  Textarea,
} from '../../components/ui'

export default function EvaluationsPage() {
  const { user, hasRole } = useAuth()
  const [params, setParams] = useSearchParams()
  const [appels, setAppels] = useState([])
  const [loading, setLoading] = useState(true)
  const [ao, setAo] = useState(null)
  const [marche, setMarche] = useState(null)
  const [offres, setOffres] = useState([])
  const [consolidation, setConsolidation] = useState(null)
  const [evaluating, setEvaluating] = useState(null)
  const [proposing, setProposing] = useState(null)
  const [dossier, setDossier] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  const selectedId = params.get('ao')
  const isCommission = hasRole('MEMBRE_COMMISSION')
  const canPropose = hasRole('MEMBRE_COMMISSION', 'ADMINISTRATEUR')

  useEffect(() => {
    unwrap(api.get('/evaluations/a-evaluer'))
      .then(setAppels)
      .catch(() => setAppels([]))
      .finally(() => setLoading(false))
  }, [])

  const loadSelected = useCallback(async () => {
    if (!selectedId) {
      setAo(null)
      setMarche(null)
      setOffres([])
      setConsolidation(null)
      return
    }
    setLoading(true)
    try {
      const selected = appels.find((a) => String(a.id) === String(selectedId))
      const aoData = selected || (await unwrap(api.get(`/appels-offres/${selectedId}`)))
      setAo(aoData)
      const [o, c] = await Promise.all([
        unwrap(api.get(`/evaluations/appel-offre/${selectedId}/offres`)),
        unwrap(api.get(`/evaluations/appel-offre/${selectedId}/consolidation`)).catch(() => null),
      ])
      setOffres(o || [])
      setConsolidation(c)
      if (aoData.marcheId) {
        unwrap(api.get(`/marches/${aoData.marcheId}`)).then(setMarche).catch(() => setMarche(null))
      }
    } catch {
      setAo(null)
    } finally {
      setLoading(false)
    }
  }, [selectedId, appels])

  useEffect(() => {
    loadSelected()
  }, [loadSelected, reloadKey])

  const select = (id) => {
    const next = new URLSearchParams(params)
    if (id) next.set('ao', id)
    else next.delete('ao')
    next.delete('offre')
    setParams(next)
  }

  const criteres = marche?.criteres || []

  const stats = useMemo(() => {
    const ranked = consolidation?.classement || []
    return {
      offres: offres.length,
      evaluees: ranked.filter((r) => r.nombreEvaluations > 0).length,
      retenue: ranked.find((r) => r.retenue),
    }
  }, [offres, consolidation])

  if (loading && !appels.length) return <LoadingScreen label="Chargement des évaluations…" />

  return (
    <div>
      <PageHeader
        eyebrow="Commission"
        title="Évaluations & classement"
        subtitle="Évaluez les offres selon les critères pondérés du marché et consultez le classement consolidé."
        actions={
          <div className="flex items-center gap-2">
            <Select value={selectedId || ''} onChange={(e) => select(e.target.value)} className="min-w-[240px]">
              <option value="">Sélectionner un appel d’offres</option>
              {appels.map((a) => <option key={a.id} value={a.id}>{a.reference} — {a.objet}</option>)}
            </Select>
          </div>
        }
      />

      {!selectedId ? (
        loading ? <LoadingScreen /> : appels.length ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {appels.map((a) => (
              <Card key={a.id} className="card-hover p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-[11px] font-semibold text-slate-600">{a.reference}</span>
                  <Badge value={a.statut} />
                </div>
                <h2 className="mt-3 line-clamp-2 font-display text-base font-bold text-slate-900">{a.objet}</h2>
                <p className="mt-1 text-xs text-slate-500">{a.marcheReference || 'Sans marché'} · {a.nombreOffres} offre{a.nombreOffres > 1 ? 's' : ''}</p>
                <Button onClick={() => select(a.id)} className="mt-4 w-full"><Gavel className="h-4 w-4" /> Ouvrir l’évaluation</Button>
              </Card>
            ))}
          </div>
        ) : (
          <Card><EmptyState icon={ClipboardCheck} title="Aucun appel d’offres à évaluer" description="Les consultations publiées avec des offres soumises apparaîtront ici." /></Card>
        )
      ) : loading ? (
        <LoadingScreen />
      ) : !ao ? (
        <Card><EmptyState title="Appel d’offres introuvable" action={<Button variant="secondary" onClick={() => select('')}>Retour</Button>} /></Card>
      ) : (
        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-mono text-xs font-semibold text-slate-500">{ao.reference}</p>
                <h2 className="mt-1 font-display text-xl font-bold text-slate-900">{ao.objet}</h2>
                <p className="mt-1 text-sm text-slate-500">{ao.organisme || 'Administration'} · date limite {dateShort(ao.dateLimite)}</p>
              </div>
              <div className="flex gap-2">
                {ao.marcheId && <Link to={`/marches/${ao.marcheId}`} className="btn-secondary btn-sm">Voir le marché</Link>}
                <Button variant="secondary" size="sm" onClick={() => select('')}>Changer</Button>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Metric icon={Users} label="Offres reçues" value={stats.offres} />
              <Metric icon={CheckCircle2} label="Offres évaluées" value={`${stats.evaluees} / ${stats.offres}`} />
              <Metric icon={Award} label="Offre retenue" value={stats.retenue?.fournisseur || '—'} />
            </div>
          </Card>

          <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <h2 className="font-display text-base font-bold text-slate-900">Offres à évaluer</h2>
                <span className="text-xs text-slate-500">{offres.length} offre{offres.length > 1 ? 's' : ''}</span>
              </div>
              {offres.length ? (
                <div className="table-wrap border-0">
                  <table className="table-base">
                    <thead><tr><th>Fournisseur</th><th>Montant</th><th>Délai</th><th>Statut</th><th>Notes</th><th></th></tr></thead>
                    <tbody>
                      {offres.map((o) => {
                        const rank = consolidation?.classement?.find((c) => c.offreId === o.id)
                        return (
                          <tr key={o.id}>
                            <td><p className="font-medium text-slate-800">{o.raisonSociale}</p><p className="text-xs text-slate-500">{o.reference || 'Brouillon'}</p></td>
                            <td className="whitespace-nowrap font-medium">{fcfa(o.montant)}</td>
                            <td className="text-slate-600">{o.delaiLivraisonJours ? `${o.delaiLivraisonJours} j` : '—'}</td>
                            <td><Badge value={o.statut} /></td>
                            <td>
                              {rank ? (
                                <div>
                                  <p className="text-xs font-semibold text-slate-800">{rank.noteGlobale != null ? `${Number(rank.noteGlobale).toFixed(2)}/20` : '—'}</p>
                                  <p className="text-[11px] text-slate-400">{rank.nombreEvaluations} évaluation{rank.nombreEvaluations > 1 ? 's' : ''}</p>
                                </div>
                              ) : '—'}
                            </td>
                            <td className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button size="sm" variant="secondary" onClick={() => setDossier(o)}><Eye className="h-3.5 w-3.5" /> Dossier</Button>
                                {isCommission ? (
                                  <Button size="sm" onClick={() => setEvaluating(o)}><Star className="h-3.5 w-3.5" /> Évaluer</Button>
                                ) : (
                                  <span className="text-xs text-slate-400">Lecture seule</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : <EmptyState icon={ClipboardCheck} title="Aucune offre soumise" description="Les fournisseurs n’ont pas encore déposé d’offre pour cette consultation." />}
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2">
                <Medal className="h-4 w-4 text-amber-500" />
                <h2 className="font-display text-base font-bold text-slate-900">Classement consolidé</h2>
              </div>
              <div className="mt-4 space-y-3">
                {consolidation?.classement?.length ? consolidation.classement.map((c) => (
                  <div key={c.offreId} className={`rounded-xl border p-3.5 ${c.retenue ? 'border-primary-300 bg-primary-50/60' : 'border-slate-200'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${c.rang === 1 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{c.rang}</span>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{c.fournisseur}</p>
                          <p className="text-[11px] text-slate-500">{c.offreReference} · {fcfa(c.montant)}</p>
                        </div>
                      </div>
                      {c.retenue && <Badge value="RETENUE" />}
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <Score label="Technique" value={c.noteTechnique} />
                      <Score label="Financier" value={c.noteFinanciere} />
                      <Score label="Global" value={c.noteGlobale} highlight />
                    </div>
                    {canPropose && !c.retenue && (
                      <Button variant="secondary" size="sm" className="mt-2.5 w-full" onClick={() => setProposing(c)}><Award className="h-3.5 w-3.5" /> Proposer l’attribution</Button>
                    )}
                  </div>
                )) : (
                  <p className="text-sm text-slate-500">Aucune évaluation enregistrée pour le moment.</p>
                )}
              </div>
            </Card>
          </div>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-display text-base font-bold text-slate-900"><Scale className="h-4 w-4 text-primary-600" /> Critères d’évaluation</h2>
            {criteres.length ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {criteres.map((c) => (
                  <div key={c.id} className="rounded-xl border border-slate-200 p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-800">{c.libelle}</p>
                      <span className="badge bg-slate-100 text-slate-600 ring-slate-200">{humanize(c.type)}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{c.description || '—'}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <ProgressBar value={c.ponderation} className="h-1.5" />
                      <span className="shrink-0 text-xs font-semibold text-slate-700">{c.ponderation}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="mt-2 text-sm text-slate-500">Les critères du marché ne sont pas disponibles.</p>}
          </Card>
        </div>
      )}

      <EvaluationModal
        offer={evaluating}
        criteres={criteres}
        user={user}
        onClose={() => setEvaluating(null)}
        onDone={() => { setEvaluating(null); setReloadKey((k) => k + 1); toast.success('Évaluation enregistrée') }}
      />
      <ProposalModal
        offer={proposing}
        ao={ao}
        onClose={() => setProposing(null)}
        onDone={() => { setProposing(null); setReloadKey((k) => k + 1); toast.success('Proposition d’attribution enregistrée') }}
      />
      <OfferDossierModal offer={dossier} onClose={() => setDossier(null)} />
    </div>
  )
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl bg-sand-50 px-4 py-3">
      <Icon className="h-4 w-4 text-primary-600" />
      <p className="mt-1.5 truncate font-display text-lg font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}

function Score({ label, value, highlight }) {
  return (
    <div className={`rounded-lg px-2 py-1.5 ${highlight ? 'bg-primary-100/70' : 'bg-slate-50'}`}>
      <p className={`font-display text-sm font-bold ${highlight ? 'text-primary-800' : 'text-slate-800'}`}>{value != null ? Number(value).toFixed(2) : '—'}</p>
      <p className="text-[10px] text-slate-500">{label}</p>
    </div>
  )
}

function EvaluationModal({ offer, criteres, user, onClose, onDone }) {
  const [notes, setNotes] = useState({})
  const [comments, setComments] = useState({})
  const [observations, setObservations] = useState('')
  const [loading, setLoading] = useState(false)
  const [existing, setExisting] = useState([])

  useEffect(() => {
    if (!offer) return
    setObservations('')
    setNotes({})
    setComments({})
    unwrap(api.get(`/evaluations/offre/${offer.id}`))
      .then((evals) => {
        setExisting(evals || [])
        const mine = (evals || []).find((e) => e.membreId === user?.id)
        if (mine) {
          setObservations(mine.observations || '')
          const n = {}
          const c = {}
          mine.notes?.forEach((note) => {
            n[note.critereId] = note.note
            c[note.critereId] = note.commentaire || ''
          })
          setNotes(n)
          setComments(c)
        }
      })
      .catch(() => setExisting([]))
  }, [offer, user])

  const total = criteres.reduce((s, c) => s + (Number(notes[c.id]) || 0) * (Number(c.ponderation) || 0) / 20, 0)
  const allFilled = criteres.length > 0 && criteres.every((c) => notes[c.id] !== undefined && notes[c.id] !== '')

  const submit = async () => {
    if (!allFilled) {
      toast.error('Renseignez une note pour chaque critère.')
      return
    }
    setLoading(true)
    try {
      await unwrap(api.post('/evaluations', {
        offreId: offer.id,
        observations: observations || null,
        notes: criteres.map((c) => ({
          critereId: c.id,
          note: Number(notes[c.id]),
          commentaire: comments[c.id] || null,
        })),
      }))
      onDone()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={Boolean(offer)}
      onClose={onClose}
      title="Évaluer l’offre"
      description={offer ? `${offer.raisonSociale} · ${fcfa(offer.montant)}` : ''}
      size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Annuler</Button><Button onClick={submit} loading={loading}><CheckCircle2 className="h-4 w-4" /> Enregistrer l’évaluation</Button></>}
    >
      <div className="space-y-4">
        {existing.length > 0 && (
          <div className="rounded-xl bg-sand-50 px-4 py-3 text-xs text-slate-600">
            {existing.length} évaluation{existing.length > 1 ? 's' : ''} déjà enregistrée{existing.length > 1 ? 's' : ''} par la commission.
            {existing.some((e) => e.membreId === user?.id) && ' Vous pouvez mettre à jour la vôtre.'}
          </div>
        )}
        {offer && (
          <details className="rounded-xl border border-slate-200">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-800">
              Pièces et images fournies par le fournisseur
            </summary>
            <div className="border-t border-slate-100 px-4 py-4">
              <OfferDossier offer={offer} />
            </div>
          </details>
        )}
        {criteres.map((c) => (
          <div key={c.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-800">{c.libelle}</p>
                <p className="text-xs text-slate-500">{humanize(c.type)} · pondération {c.ponderation} %</p>
              </div>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  min="0"
                  max="20"
                  step="0.25"
                  value={notes[c.id] ?? ''}
                  onChange={(e) => setNotes({ ...notes, [c.id]: e.target.value })}
                  className="w-24 text-center font-semibold"
                  placeholder="0-20"
                />
                <span className="text-sm text-slate-400">/20</span>
              </div>
            </div>
            <Input value={comments[c.id] || ''} onChange={(e) => setComments({ ...comments, [c.id]: e.target.value })} placeholder="Commentaire (optionnel)" className="mt-2.5" />
          </div>
        ))}
        <Field label="Observations générales">
          <Textarea value={observations} onChange={(e) => setObservations(e.target.value)} />
        </Field>
        <div className="rounded-xl bg-primary-50 px-4 py-3">
          <p className="text-xs text-primary-700">Note pondérée calculée</p>
          <p className="font-display text-xl font-bold text-primary-900">{total.toFixed(2)} / 20</p>
        </div>
      </div>
    </Modal>
  )
}

function ProposalModal({ offer, ao, onClose, onDone }) {
  const [motif, setMotif] = useState('')
  const [observations, setObservations] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (offer) {
      setMotif('Meilleure offre selon le classement consolidé de la commission.')
      setObservations('')
    }
  }, [offer])

  const submit = async () => {
    setLoading(true)
    try {
      await unwrap(api.post('/attributions', { offreId: offer.offreId, motif, observations }))
      onDone()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={Boolean(offer)} onClose={onClose} title="Proposer l’attribution" description={offer ? `${offer.fournisseur} · ${fcfa(offer.montant)}` : ''} footer={<><Button variant="secondary" onClick={onClose}>Annuler</Button><Button onClick={submit} loading={loading}><Award className="h-4 w-4" /> Proposer</Button></>}>
      <div className="space-y-4">
        <div className="rounded-xl bg-sand-50 px-4 py-3 text-sm text-slate-600">
          <p className="font-semibold text-slate-800">{ao?.reference} — {ao?.objet}</p>
          <p className="mt-1 text-xs">Note globale : {offer?.noteGlobale != null ? Number(offer.noteGlobale).toFixed(2) : '—'} / 20 · rang {offer?.rang}</p>
        </div>
        <Field label="Motif de la proposition">
          <Textarea value={motif} onChange={(e) => setMotif(e.target.value)} />
        </Field>
        <Field label="Observations">
          <Textarea value={observations} onChange={(e) => setObservations(e.target.value)} />
        </Field>
      </div>
    </Modal>
  )
}

function OfferDossierModal({ offer, onClose }) {
  return (
    <Modal
      open={Boolean(offer)}
      onClose={onClose}
      title="Dossier du fournisseur"
      description={offer ? `${offer.raisonSociale} · ${offer.reference || 'Référence non attribuée'}` : ''}
      size="lg"
      footer={<Button variant="secondary" onClick={onClose}>Fermer</Button>}
    >
      {offer && <OfferDossier offer={offer} />}
    </Modal>
  )
}

function OfferDossier({ offer }) {
  const imageUrls = useOfferImages(offer)
  const [lightbox, setLightbox] = useState(null)
  const documents = offer.documents || []
  const lignes = offer.lignes || []
  const withImages = lignes.filter((l) => l.imageId)
  const images = lignes
    .filter((l) => l.imageId && imageUrls[l.id])
    .map((l) => ({ ...l, url: imageUrls[l.id] }))

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Info label="Montant" value={fcfa(offer.montant)} />
        <Info label="Délai" value={offer.delaiLivraisonJours ? `${offer.delaiLivraisonJours} jours` : '—'} />
        <Info label="Statut" value={<Badge value={offer.statut} />} />
      </div>

      {(offer.informationsTechniques || offer.observationsFournisseur) && (
        <div className="space-y-3">
          {offer.informationsTechniques && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Informations techniques</p>
              <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{offer.informationsTechniques}</p>
            </div>
          )}
          {offer.observationsFournisseur && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Observations du fournisseur</p>
              <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{offer.observationsFournisseur}</p>
            </div>
          )}
        </div>
      )}

      <div>
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary-600" />
          <h3 className="font-display text-sm font-bold text-slate-900">Documents fournis</h3>
          <span className="text-xs text-slate-400">{documents.length}</span>
        </div>
        {documents.length ? (
          <div className="mt-2 space-y-2">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{doc.nom}</p>
                  <p className="text-[11px] text-slate-500">{humanize(doc.type)} · {formatTaille(doc.taille)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {doc.apercuPossible && (
                    <Button size="sm" variant="secondary" onClick={() => previewDocument(doc)}>
                      <Eye className="h-3.5 w-3.5" /> Visualiser
                    </Button>
                  )}
                  <Button size="sm" variant="secondary" onClick={() => downloadDocument(doc)}>
                    <Download className="h-3.5 w-3.5" /> Télécharger
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">Aucun document joint à cette offre.</p>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2">
          <FileImage className="h-4 w-4 text-primary-600" />
          <h3 className="font-display text-sm font-bold text-slate-900">Images des matériels</h3>
          <span className="text-xs text-slate-400">{withImages.length} / {lignes.length}</span>
        </div>
        {lignes.length ? (
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {lignes.map((ligne) => {
              const imageIndex = images.findIndex((img) => img.id === ligne.id)
              return (
                <div key={ligne.id} className="flex gap-3 rounded-xl border border-slate-200 p-3">
                  {ligne.imageId && imageUrls[ligne.id] ? (
                    <button
                      type="button"
                      onClick={() => setLightbox(imageIndex)}
                      className="shrink-0 cursor-zoom-in"
                      title="Agrandir l’image"
                    >
                      <img src={imageUrls[ligne.id]} alt={ligne.designation} className="h-20 w-20 rounded-lg border border-slate-200 object-cover" />
                    </button>
                  ) : (
                    <span className="grid h-20 w-20 shrink-0 place-items-center rounded-lg border border-dashed border-slate-300 px-1 text-center text-[10px] text-slate-400">
                      {ligne.imageId ? 'Chargement…' : 'Sans image'}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">{ligne.designation}</p>
                    <p className="text-xs text-slate-500">Quantité : {ligne.quantite}</p>
                    {ligne.prixUnitaire != null && <p className="text-xs text-slate-500">PU : {fcfa(ligne.prixUnitaire)}</p>}
                    {ligne.imageId && (
                      <Button size="sm" variant="secondary" className="mt-2" onClick={() => setLightbox(imageIndex)} disabled={imageIndex < 0}>
                        <Eye className="h-3.5 w-3.5" /> Visualiser
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">Aucun matériel renseigné.</p>
        )}
      </div>

      {lightbox !== null && images[lightbox] && (
        <ImageLightbox
          images={images}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onChange={setLightbox}
        />
      )}
    </div>
  )
}

function ImageLightbox({ images, index, onClose, onChange }) {
  const image = images[index]

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      } else if (event.key === 'ArrowLeft') {
        onChange((index - 1 + images.length) % images.length)
      } else if (event.key === 'ArrowRight') {
        onChange((index + 1) % images.length)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [index, images.length, onClose, onChange])

  if (!image) return null

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-950/95 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="flex items-center justify-between gap-4 px-5 py-4 text-white">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{image.designation}</p>
          <p className="text-xs text-white/60">{index + 1} / {images.length}</p>
        </div>
        <button onClick={onClose} className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white" aria-label="Fermer">
          <X className="h-6 w-6" />
        </button>
      </div>
      <div className="relative flex flex-1 items-center justify-center px-4 pb-6">
        {images.length > 1 && (
          <button
            type="button"
            onClick={() => onChange((index - 1 + images.length) % images.length)}
            className="absolute left-3 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Image précédente"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        <img
          src={image.url}
          alt={image.designation}
          className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
        />
        {images.length > 1 && (
          <button
            type="button"
            onClick={() => onChange((index + 1) % images.length)}
            className="absolute right-3 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Image suivante"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl bg-sand-50 px-3 py-2">
      <p className="text-[11px] text-slate-500">{label}</p>
      <div className="mt-0.5 text-sm font-semibold text-slate-800">{value}</div>
    </div>
  )
}

function formatTaille(taille) {
  if (!taille) return '—'
  if (taille < 1024) return `${taille} o`
  if (taille < 1024 * 1024) return `${(taille / 1024).toFixed(0)} Ko`
  return `${(taille / (1024 * 1024)).toFixed(1)} Mo`
}

async function previewDocument(doc) {
  try {
    const response = await api.get(`/documents/${doc.id}/preview`, { responseType: 'blob' })
    const url = URL.createObjectURL(response.data)
    const win = window.open(url, '_blank', 'noopener,noreferrer')
    if (!win) {
      URL.revokeObjectURL(url)
      toast.error('Autorisez les fenêtres pop-up pour visualiser le document.')
      return
    }
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  } catch (err) {
    toast.error(errorMessage(err))
  }
}

async function downloadDocument(doc) {
  try {
    const response = await api.get(`/documents/${doc.id}/download`, { responseType: 'blob' })
    const url = URL.createObjectURL(response.data)
    const link = document.createElement('a')
    link.href = url
    link.download = doc.nom || 'document'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  } catch (err) {
    toast.error(errorMessage(err))
  }
}

function useOfferImages(offer) {
  const [imageUrls, setImageUrls] = useState({})
  useEffect(() => {
    const lignes = (offer?.lignes || []).filter((l) => l.imageId)
    if (!lignes.length) {
      setImageUrls({})
      return
    }
    let actif = true
    const urls = {}
    Promise.all(lignes.map(async (ligne) => {
      try {
        const response = await api.get(`/documents/${ligne.imageId}/preview`, { responseType: 'blob' })
        urls[ligne.id] = URL.createObjectURL(response.data)
      } catch {
        // L'aperçu n'est pas bloquant : l'image reste téléchargeable.
      }
    })).then(() => { if (actif) setImageUrls(urls) })
    return () => {
      actif = false
      Object.values(urls).forEach((url) => URL.revokeObjectURL(url))
    }
  }, [offer])
  return imageUrls
}
