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
  ListChecks,
  Megaphone,
  Package,
  Pencil,
  Plus,
  Save,
  Send,
  ShoppingBag,
  Timer,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { api, errorMessage, unwrap } from '../../lib/api'
import { dateShort, dateTime, daysLeft, fcfa, humanize } from '../../lib/format'
import { useAuth } from '../../contexts/AuthContext'
import { Badge, Button, Card, EmptyState, Field, Input, LoadingScreen, Modal, PageHeader, Select, Textarea } from '../../components/ui'

export default function AppelOffreDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasRole } = useAuth()
  const [ao, setAo] = useState(null)
  const [offres, setOffres] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancel, setCancel] = useState(false)
  const [prolong, setProlong] = useState(false)
  const [documentModal, setDocumentModal] = useState(null)

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
      <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primary-700"><ArrowLeft className="w-4 h-4" /> Retour</button>
      <PageHeader
        eyebrow={ao.reference}
        title={ao.objet}
        subtitle={`${ao.organisme || 'Administration'} · ${ao.marcheReference || 'Sans marché rattaché'}`}
        actions={
          <>
            {canManage && ao.statut === 'BROUILLON' && <Button onClick={publish}><Megaphone className="w-4 h-4" /> Publier</Button>}
            {canManage && ao.statut === 'PUBLIE' && <Button variant="secondary" onClick={() => setProlong(true)}><Timer className="w-4 h-4" /> Prolonger</Button>}
            {canManage && ao.statut === 'PUBLIE' && <Button variant="danger" onClick={() => setCancel(true)}><X className="w-4 h-4" /> Annuler</Button>}
            {canEvaluate && ao.statut === 'PUBLIE' && <Button onClick={() => navigate(`/evaluations?ao=${ao.id}`)}><Gavel className="w-4 h-4" /> Évaluer</Button>}
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <Badge value={ao.statut} />
          {ao.categorie && <span className="badge bg-slate-100 text-slate-600 ring-slate-200">{ao.categorie}</span>}
          <span className="badge bg-slate-100 text-slate-600 ring-slate-200">{ao.nombreOffres} offre{ao.nombreOffres > 1 ? 's' : ''}</span>
          {ao.budgetEstimatif && <span className="badge bg-primary-50 text-primary-700 ring-primary-200">{fcfa(ao.budgetEstimatif)}</span>}
        </div>
      </PageHeader>

      <div className="grid gap-5 xl:grid-cols-[1.55fr_.85fr]">
        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="text-base font-bold font-display text-slate-900">Présentation</h2>
            <p className="mt-2 text-sm leading-6 whitespace-pre-line text-slate-600">{ao.description || 'Aucune description.'}</p>
            <div className="grid gap-4 mt-5 sm:grid-cols-2 lg:grid-cols-3">
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
              <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
                <Package className="w-4 h-4 text-primary-600" /><h2 className="text-base font-bold font-display text-slate-900">Matériels concernés</h2>
              </div>
              <div className="border-0 table-wrap">
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
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="flex items-center gap-2 text-base font-bold font-display text-slate-900"><Users className="w-4 h-4 text-primary-600" /> Offres reçues</h2>
              <span className="text-xs text-slate-500">{offres.length} offre{offres.length > 1 ? 's' : ''}</span>
            </div>
            {offres.length ? (
              <div className="border-0 table-wrap">
                <table className="table-base">
                  <thead><tr><th>Référence</th><th>Fournisseur</th><th>Montant</th><th>Délai</th><th>Statut</th><th></th></tr></thead>
                  <tbody>
                    {offres.map((o) => (
                      <tr key={o.id}>
                        <td className="font-mono text-xs font-semibold text-slate-600">{o.reference || 'Brouillon'}</td>
                        <td><p className="font-medium text-slate-800">{o.raisonSociale}</p><p className="text-xs text-slate-500">{o.ninea}</p></td>
                        <td className="font-medium whitespace-nowrap">{fcfa(o.montant)}</td>
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
            <DocumentsObligatoiresCard
              ao={ao}
              canManage={canManage}
              onAdd={() => setDocumentModal({ document: null })}
              onEdit={(document) => setDocumentModal({ document })}
              onChanged={load}
            />
            <TextBlock title="Modalités de soumission" value={ao.modalitesSoumission} />
            <Card className="p-5">
              <h3 className="text-sm font-bold font-display text-slate-900">Documents joints</h3>
              {ao.documents?.length ? (
                <div className="mt-3 space-y-2">
                  {ao.documents.map((d) => (
                    <a key={d.id} href={`/api/documents/${d.id}/download`} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-sm hover:border-primary-300 hover:bg-primary-50/50">
                      <span className="flex items-center min-w-0 gap-2"><FileText className="w-4 h-4 shrink-0 text-primary-600" /><span className="truncate">{d.nom}</span></span>
                      <Download className="w-4 h-4 shrink-0 text-slate-400" />
                    </a>
                  ))}
                </div>
              ) : <p className="mt-2 text-sm text-slate-500">Aucun document joint.</p>}
            </Card>
          </div>
        </div>

        <aside className="space-y-5">
          <Card className="p-5">
            <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">Date limite</p>
            <p className="mt-1 text-lg font-bold font-display text-slate-900">{dateTime(ao.dateLimite)}</p>
            {left != null && (
              <div className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${left < 0 ? 'bg-slate-100 text-slate-500' : left <= 3 ? 'bg-rose-50 text-rose-700' : 'bg-primary-50 text-primary-700'}`}>
                <CalendarClock className="w-4 h-4" /> {left < 0 ? 'Date dépassée' : left === 0 ? 'Dernier jour' : `J-${left}`}
              </div>
            )}
            {ao.marcheId && <Link to={`/marches/${ao.marcheId}`} className="w-full mt-4 btn-secondary"><Building2 className="w-4 h-4" /> Voir le marché</Link>}
            <Link to={`/evaluations?ao=${ao.id}`} className="w-full mt-2 btn-primary"><Gavel className="w-4 h-4" /> Ouvrir l’évaluation</Link>
          </Card>
          <Card className="p-5">
            <h3 className="text-sm font-bold font-display text-slate-900">Suivi</h3>
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
      <DocumentObligatoireModal
        open={Boolean(documentModal)}
        document={documentModal?.document}
        documents={documentsAffiches(ao).documents}
        configuree={documentsAffiches(ao).configuree}
        ao={ao}
        onClose={() => setDocumentModal(null)}
        onDone={() => { setDocumentModal(null); load() }}
      />
    </div>
  )
}


const DOCUMENT_TYPES = [
  { value: '', label: 'Sans type particulier' },
  { value: 'OFFRE_TECHNIQUE', label: 'Offre technique' },
  { value: 'OFFRE_FINANCIERE', label: 'Offre financière' },
  { value: 'DOCUMENT_ADMINISTRATIF', label: 'Document administratif' },
  { value: 'AUTRE', label: 'Autre' },
]

function documentsAffiches(ao) {
  const details = ao?.documentsObligatoiresDetails || []
  if (details.length) return { documents: details, configuree: true }
  const libelles = (ao?.documentsObligatoires || '')
    .split(/[,;\n]/)
    .map((libelle) => libelle.trim().replace(/\.$/, ''))
    .filter(Boolean)
  const valeurs = libelles.length ? libelles : ['Offre technique', 'Offre financière', 'Documents administratifs']
  return {
    configuree: false,
    documents: valeurs.map((libelle, index) => ({
      id: null,
      libelle,
      description: null,
      type: null,
      obligatoire: true,
      ordre: index + 1,
    })),
  }
}

function DocumentsObligatoiresCard({ ao, canManage, onAdd, onEdit, onChanged }) {
  const { documents, configuree } = documentsAffiches(ao)
  const modifiable = canManage && ao.statut === 'BROUILLON'
  const [saving, setSaving] = useState(false)

  const enregistrerDefauts = async () => {
    setSaving(true)
    try {
      await unwrap(api.put(`/appels-offres/${ao.id}/documents-obligatoires`, documents.map((document) => ({
        libelle: document.libelle,
        description: document.description,
        type: document.type,
        obligatoire: document.obligatoire,
        ordre: document.ordre,
      }))))
      toast.success('Documents obligatoires configurés')
      onChanged()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const supprimer = async (document) => {
    if (!window.confirm(`Supprimer « ${document.libelle} » des documents obligatoires ?`)) return
    try {
      if (configuree) {
        await unwrap(api.delete(`/appels-offres/${ao.id}/documents-obligatoires/${document.id}`))
      } else {
        await unwrap(api.put(`/appels-offres/${ao.id}/documents-obligatoires`, documents
          .filter((item) => item !== document)
          .map((item) => ({
            libelle: item.libelle,
            description: item.description,
            type: item.type,
            obligatoire: item.obligatoire,
            ordre: item.ordre,
          }))))
      }
      toast.success('Document obligatoire supprimé')
      onChanged()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold font-display text-slate-900">
            <ListChecks className="w-4 h-4 text-primary-600" /> Documents obligatoires
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {configuree
              ? `${documents.filter((d) => d.obligatoire).length} pièce(s) obligatoire(s) sur ${documents.length}`
              : 'Liste par défaut — à enregistrer pour la personnaliser.'}
          </p>
        </div>
        {modifiable && (
          <div className="flex items-center gap-2 shrink-0">
            {!configuree && (
              <Button size="sm" variant="secondary" onClick={enregistrerDefauts} loading={saving}>
                <Save className="h-3.5 w-3.5" /> Enregistrer
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={onAdd}>
              <Plus className="h-3.5 w-3.5" /> Ajouter
            </Button>
          </div>
        )}
      </div>

      {ao.documentsObligatoires && (
        <p className="px-3 py-2 mt-3 text-xs leading-5 whitespace-pre-line rounded-xl bg-slate-50 text-slate-600">{ao.documentsObligatoires}</p>
      )}

      {documents.length ? (
        <ul className="mt-4 space-y-2">
          {documents.map((document) => (
            <li key={document.id ?? document.libelle} className="rounded-xl border border-slate-200 px-3 py-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-slate-800">
                    {document.libelle}
                    {!document.obligatoire && <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Facultatif</span>}
                    {!configuree && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-700">Par défaut</span>}
                  </p>
                  {document.description && <p className="mt-0.5 text-xs text-slate-500">{document.description}</p>}
                  {document.type && <p className="mt-1 text-[11px] font-medium text-primary-700">{humanize(document.type)}</p>}
                </div>
                {modifiable && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => onEdit(document)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-700" title="Modifier">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => supprimer(document)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Supprimer">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-slate-500">Aucun document obligatoire défini.</p>
      )}
    </Card>
  )
}

function DocumentObligatoireModal({ open, document, documents, configuree, ao, onClose, onDone }) {
  const [form, setForm] = useState({ libelle: '', description: '', type: '', obligatoire: true, ordre: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm({
      libelle: document?.libelle || '',
      description: document?.description || '',
      type: document?.type || '',
      obligatoire: document?.obligatoire ?? true,
      ordre: document?.ordre ?? '',
    })
  }, [open, document])

  const submit = async () => {
    if (!form.libelle.trim()) {
      toast.error('Renseignez le libellé du document.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        libelle: form.libelle.trim(),
        description: form.description || null,
        type: form.type || null,
        obligatoire: form.obligatoire,
        ordre: form.ordre ? Number(form.ordre) : null,
      }
      if (document?.id) {
        await unwrap(api.put(`/appels-offres/${ao.id}/documents-obligatoires/${document.id}`, payload))
      } else if (configuree) {
        await unwrap(api.post(`/appels-offres/${ao.id}/documents-obligatoires`, payload))
      } else {
        const existants = documents.map((item) => ({
          libelle: item.libelle,
          description: item.description,
          type: item.type,
          obligatoire: item.obligatoire,
          ordre: item.ordre,
        }))
        const index = document ? existants.findIndex((item) => item.libelle === document.libelle) : -1
        const liste = index >= 0
          ? existants.map((item, i) => (i === index ? payload : item))
          : [...existants, { ...payload, ordre: payload.ordre ?? existants.length + 1 }]
        await unwrap(api.put(`/appels-offres/${ao.id}/documents-obligatoires`, liste))
      }
      toast.success(document ? 'Document obligatoire mis à jour' : 'Document obligatoire ajouté')
      onDone()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={document ? 'Modifier le document obligatoire' : 'Ajouter un document obligatoire'}
      description={ao?.reference}
      footer={<><Button variant="secondary" onClick={onClose}>Annuler</Button><Button onClick={submit} loading={saving}>{document ? 'Enregistrer' : 'Ajouter'}</Button></>}
    >
      <div className="space-y-4">
        <Field label="Libellé" required hint="Ex. Attestation de régularité fiscale">
          <Input value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} maxLength={160} />
        </Field>
        <Field label="Description">
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={500} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type de document">
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {DOCUMENT_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
            </Select>
          </Field>
          <Field label="Ordre d’affichage">
            <Input type="number" min="1" value={form.ordre} onChange={(e) => setForm({ ...form, ordre: e.target.value })} />
          </Field>
        </div>
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700">
          <input type="checkbox" checked={form.obligatoire} onChange={(e) => setForm({ ...form, obligatoire: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
          Pièce obligatoire pour soumettre une offre
        </label>
      </div>
    </Modal>
  )
}

function Info({ label, value }) {
  return <div><p className="text-xs font-medium tracking-wide uppercase text-slate-400">{label}</p><p className="mt-0.5 text-sm font-medium text-slate-800">{value || '—'}</p></div>
}

function Row({ label, value }) {
  return <div className="flex items-center justify-between gap-3"><span className="text-slate-500">{label}</span><span className="font-medium text-slate-800">{value}</span></div>
}

function TextBlock({ title, value }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-bold font-display text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 whitespace-pre-line text-slate-600">{value || 'Non précisé.'}</p>
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
