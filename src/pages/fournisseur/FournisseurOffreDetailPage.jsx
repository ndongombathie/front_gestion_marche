import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarClock,
  CheckCircle2,
  Download,
  FileText,
  Save,
  Send,
  ShieldCheck,
  Upload,
} from 'lucide-react'
import { api, errorMessage, unwrap } from '../../lib/api'
import { dateShort, dateTime, fcfa, humanize } from '../../lib/format'
import { Badge, Button, Card, EmptyState, Field, Input, LoadingScreen, PageHeader, ProgressBar, Textarea } from '../../components/ui'

const DOC_TYPES = [
  { value: 'OFFRE_TECHNIQUE', label: 'Offre technique', hint: 'Mémoire technique, descriptifs, fiches produits…' },
  { value: 'OFFRE_FINANCIERE', label: 'Offre financière', hint: 'Bordereau des prix, devis détaillé…' },
  { value: 'DOCUMENT_ADMINISTRATIF', label: 'Documents administratifs', hint: 'NINEA, RCCM, attestations…' },
]

export default function FournisseurOffreDetailPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const isNew = id === 'nouveau'
  const aoId = params.get('ao')
  const [ao, setAo] = useState(null)
  const [offre, setOffre] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ montant: '', delaiLivraisonJours: 30, informationsTechniques: '', observationsFournisseur: '', lignes: [] })
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState('')
  const fileRefs = useRef({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (isNew) {
        if (!aoId) {
          setAo(null)
          return
        }
        const data = await unwrap(api.get(`/appels-offres/public/${aoId}`))
        setAo(data)
        setForm({
          montant: '',
          delaiLivraisonJours: 30,
          informationsTechniques: '',
          observationsFournisseur: '',
          lignes: (data.materiels || []).map((m) => ({
            designation: m.designation,
            quantite: m.quantite,
            prixUnitaire: '',
            caracteristiques: m.caracteristiques || '',
          })),
        })
      } else {
        const data = await unwrap(api.get(`/offres/${id}`))
        setOffre(data)
        setForm({
          montant: data.montant ?? '',
          delaiLivraisonJours: data.delaiLivraisonJours || 30,
          informationsTechniques: data.informationsTechniques || '',
          observationsFournisseur: data.observationsFournisseur || '',
          lignes: (data.lignes || []).map((l) => ({
            designation: l.designation,
            quantite: l.quantite,
            prixUnitaire: l.prixUnitaire ?? '',
            caracteristiques: l.caracteristiques || '',
          })),
        })
        if (data.appelOffreId) {
          unwrap(api.get(`/appels-offres/public/${data.appelOffreId}`)).then(setAo).catch(() => setAo(null))
        }
      }
    } catch {
      setAo(null)
      setOffre(null)
    } finally {
      setLoading(false)
    }
  }, [id, isNew, aoId])

  useEffect(() => { load() }, [load])

  const setLine = (i, key, value) => setForm({ ...form, lignes: form.lignes.map((l, idx) => (idx === i ? { ...l, [key]: value } : l)) })

  const payload = () => ({
    appelOffreId: isNew ? Number(aoId) : offre.appelOffreId,
    montant: Number(form.montant),
    delaiLivraisonJours: Number(form.delaiLivraisonJours) || null,
    informationsTechniques: form.informationsTechniques || null,
    observationsFournisseur: form.observationsFournisseur || null,
    lignes: form.lignes.filter((l) => l.designation).map((l) => ({
      designation: l.designation,
      quantite: Number(l.quantite),
      prixUnitaire: l.prixUnitaire ? Number(l.prixUnitaire) : null,
      caracteristiques: l.caracteristiques || null,
    })),
  })

  const save = async () => {
    if (!form.montant || Number(form.montant) <= 0) {
      toast.error('Renseignez un montant valide.')
      return
    }
    setSaving(true)
    try {
      if (isNew) {
        const created = await unwrap(api.post('/offres', payload()))
        toast.success('Brouillon créé. Complétez les documents puis soumettez.')
        navigate(`/fournisseur/offres/${created.id}`, { replace: true })
      } else {
        const updated = await unwrap(api.put(`/offres/${offre.id}`, payload()))
        setOffre(updated)
        toast.success('Brouillon mis à jour')
      }
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const upload = async (type) => {
    const file = fileRefs.current[type]?.files?.[0]
    if (!file) {
      toast.error('Sélectionnez un fichier.')
      return
    }
    if (!offre) {
      toast.error('Enregistrez d’abord le brouillon avant de joindre des documents.')
      return
    }
    setUploading(type)
    try {
      const body = new FormData()
      body.append('fichier', file)
      body.append('type', type)
      body.append('entiteType', 'OFFRE')
      body.append('entiteId', offre.id)
      await unwrap(api.post('/documents/upload', body, { headers: { 'Content-Type': 'multipart/form-data' } }))
      toast.success('Document téléversé')
      if (fileRefs.current[type]) fileRefs.current[type].value = ''
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setUploading('')
    }
  }

  const soumettre = async () => {
    if (!window.confirm('Soumettre définitivement votre offre ? Elle ne pourra plus être modifiée.')) return
    setSubmitting(true)
    try {
      await unwrap(api.post(`/offres/${offre.id}/soumettre`))
      toast.success('Offre soumise avec succès')
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const required = useMemo(() => DOC_TYPES.map((t) => ({ ...t, present: offre?.documents?.some((d) => d.type === t.value) })), [offre])
  const canSubmit = required.every((r) => r.present)
  const isDraft = isNew || offre?.statut === 'BROUILLON'

  if (loading) return <LoadingScreen />
  if (!ao && isNew) return <Card><EmptyState title="Consultation introuvable" description="Sélectionnez un appel d’offres depuis le catalogue." action={<Link to="/fournisseur/opportunites" className="btn-primary">Voir les opportunités</Link>} /></Card>
  if (!isNew && !offre) return <Card><EmptyState title="Offre introuvable" action={<Link to="/fournisseur/offres" className="btn-primary">Retour</Link>} /></Card>

  return (
    <div>
      <Link to="/fournisseur/offres" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primary-700"><ArrowLeft className="h-4 w-4" /> Retour à mes offres</Link>
      <PageHeader
        eyebrow={isNew ? 'Nouvelle offre' : offre.reference || 'Brouillon'}
        title={isNew ? 'Préparer mon offre' : (ao?.objet || offre.appelOffreObjet)}
        subtitle={isNew ? 'Renseignez votre proposition, joignez les pièces puis soumettez.' : `Créée le ${dateShort(offre.dateCreation)} · ${ao?.reference || offre.appelOffreReference}`}
        actions={!isNew && offre.statut !== 'BROUILLON' && <Badge value={offre.statut} />}
      >
        {!isNew && offre.referenceAccuse && <p className="mt-2 text-xs text-slate-500">Accusé de réception : <span className="font-mono font-semibold text-primary-700">{offre.referenceAccuse}</span></p>}
      </PageHeader>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_.85fr]">
        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="font-display text-base font-bold text-slate-900">Ma proposition</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Montant de l’offre (FCFA)" required>
                <Input type="number" min="1" value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} disabled={!isDraft} required />
              </Field>
              <Field label="Délai de livraison (jours)" required>
                <Input type="number" min="1" value={form.delaiLivraisonJours} onChange={(e) => setForm({ ...form, delaiLivraisonJours: e.target.value })} disabled={!isDraft} required />
              </Field>
            </div>
            <Field label="Informations techniques" className="mt-4">
              <Textarea rows={4} value={form.informationsTechniques} onChange={(e) => setForm({ ...form, informationsTechniques: e.target.value })} disabled={!isDraft} placeholder="Décrivez votre solution, les références, la conformité aux spécifications…" />
            </Field>
            <Field label="Observations" className="mt-4">
              <Textarea value={form.observationsFournisseur} onChange={(e) => setForm({ ...form, observationsFournisseur: e.target.value })} disabled={!isDraft} />
            </Field>

            {form.lignes.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 text-sm font-semibold text-slate-800">Détail des prix</p>
                <div className="space-y-2">
                  {form.lignes.map((l, i) => (
                    <div key={i} className="grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1.4fr_80px_130px]">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{l.designation}</p>
                        <p className="text-xs text-slate-500">Quantité : {l.quantite}</p>
                      </div>
                      <div className="self-center text-xs text-slate-500">×</div>
                      <Input type="number" min="0" value={l.prixUnitaire} onChange={(e) => setLine(i, 'prixUnitaire', e.target.value)} placeholder="PU (FCFA)" disabled={!isDraft} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isDraft && (
              <div className="mt-5 flex justify-end">
                <Button onClick={save} loading={saving}><Save className="h-4 w-4" /> {isNew ? 'Enregistrer le brouillon' : 'Mettre à jour'}</Button>
              </div>
            )}
          </Card>

          {!isNew && (
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-bold text-slate-900">Pièces du dossier</h2>
                <span className={`text-xs font-semibold ${canSubmit ? 'text-primary-700' : 'text-amber-600'}`}>{required.filter((r) => r.present).length} / 3 obligatoires</span>
              </div>
              <ProgressBar value={(required.filter((r) => r.present).length / 3) * 100} className="mt-2" />
              <div className="mt-4 space-y-3">
                {required.map((doc) => (
                  <div key={doc.value} className="rounded-xl border border-slate-200 p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                          {doc.present ? <CheckCircle2 className="h-4 w-4 text-primary-600" /> : <FileText className="h-4 w-4 text-slate-400" />} {doc.label}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">{doc.hint}</p>
                      </div>
                      {doc.present && <span className="badge bg-primary-50 text-primary-700 ring-primary-200">Joint</span>}
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      {offre.documents?.filter((d) => d.type === doc.value).map((d) => (
                        <a key={d.id} href={`/api/documents/${d.id}/download`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200">
                          <Download className="h-3.5 w-3.5" /> {d.nom}
                        </a>
                      ))}
                      {isDraft && (
                        <>
                          <input ref={(el) => (fileRefs.current[doc.value] = el)} type="file" className="block max-w-[220px] text-xs text-slate-500 file:mr-2 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary-700 hover:file:bg-primary-100" />
                          <Button size="sm" variant="secondary" loading={uploading === doc.value} onClick={() => upload(doc.value)}><Upload className="h-3.5 w-3.5" /> Téléverser</Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <aside className="space-y-5">
          <Card className="p-5">
            <h2 className="font-display text-sm font-bold text-slate-900">Consultation</h2>
            <p className="mt-2 text-sm font-semibold text-slate-800">{ao?.objet}</p>
            <div className="mt-3 space-y-2 text-xs text-slate-500">
              <p className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> {ao?.organisme || 'Administration'}</p>
              <p className="flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5" /> Limite : {dateTime(ao?.dateLimite)}</p>
              {ao?.budgetEstimatif && <p className="font-semibold text-slate-700">Budget : {fcfa(ao.budgetEstimatif)}</p>}
            </div>
            {ao && <Link to={`/opportunites/${ao.id}`} className="btn-secondary mt-4 w-full">Voir la consultation</Link>}
          </Card>

          {!isNew && (
            <Card className="p-5">
              <h2 className="font-display text-sm font-bold text-slate-900">Soumission</h2>
              {offre.statut === 'BROUILLON' ? (
                <>
                  {!canSubmit && (
                    <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Les trois pièces obligatoires doivent être jointes avant la soumission.</p>
                  )}
                  <Button onClick={soumettre} loading={submitting} disabled={!canSubmit} className="mt-3 w-full"><Send className="h-4 w-4" /> Soumettre l’offre</Button>
                  <p className="mt-2 flex items-center justify-center gap-1 text-[11px] text-slate-400"><ShieldCheck className="h-3 w-3" /> Soumission définitive et horodatée</p>
                </>
              ) : (
                <div className="mt-2 space-y-2 text-sm">
                  <div className="flex items-center justify-between"><span className="text-slate-500">Statut</span><Badge value={offre.statut} /></div>
                  <div className="flex items-center justify-between"><span className="text-slate-500">Soumise le</span><span className="font-medium text-slate-700">{dateShort(offre.dateSoumission)}</span></div>
                  <div className="flex items-center justify-between"><span className="text-slate-500">Évaluations</span><span className="font-medium text-slate-700">{offre.nombreEvaluations}</span></div>
                  {offre.motifRejet && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{offre.motifRejet}</p>}
                </div>
              )}
            </Card>
          )}

          <Card className="p-5">
            <h2 className="font-display text-sm font-bold text-slate-900">Documents</h2>
            <div className="mt-2 space-y-2">
              {offre?.documents?.length ? offre.documents.map((d) => (
                <a key={d.id} href={`/api/documents/${d.id}/download`} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-xs hover:bg-slate-50">
                  <span className="truncate">{d.nom}</span><Download className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                </a>
              )) : <p className="text-xs text-slate-500">Aucun document.</p>}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}
