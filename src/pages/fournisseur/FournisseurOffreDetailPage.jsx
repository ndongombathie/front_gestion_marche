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

function documentsRequis(offre) {
  if (offre?.documentsObligatoires?.length) {
    return offre.documentsObligatoires.map((doc) => ({
      key: doc.id ?? doc.type,
      id: doc.id,
      type: doc.type,
      label: doc.libelle,
      hint: doc.description,
      obligatoire: doc.obligatoire,
      present: doc.fourni,
      documents: doc.documents || [],
    }))
  }
  return DOC_TYPES.map((doc) => ({
    key: doc.value,
    id: null,
    type: doc.value,
    label: doc.label,
    hint: doc.hint,
    obligatoire: true,
    present: offre?.documents?.some((d) => d.type === doc.value),
    documents: offre?.documents?.filter((d) => d.type === doc.value) || [],
  }))
}

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
  const [imageUrls, setImageUrls] = useState({})
  const fileRefs = useRef({})
  const imageRefs = useRef({})

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
            id: l.id,
            designation: l.designation,
            quantite: l.quantite,
            prixUnitaire: l.prixUnitaire ?? '',
            caracteristiques: l.caracteristiques || '',
            imageId: l.imageId,
            imageNom: l.imageNom,
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

  useEffect(() => {
    const lignes = offre?.lignes || []
    const avecImage = lignes.filter((l) => l.imageId)
    if (!avecImage.length) {
      setImageUrls({})
      return
    }
    let actif = true
    const urls = {}
    Promise.all(avecImage.map(async (l) => {
      try {
        const response = await api.get(`/documents/${l.imageId}/download`, { responseType: 'blob' })
        urls[l.id] = URL.createObjectURL(response.data)
      } catch {
        // L'aperçu n'est pas bloquant : l'image reste téléchargeable.
      }
    })).then(() => { if (actif) setImageUrls(urls) })
    return () => {
      actif = false
      Object.values(urls).forEach((url) => URL.revokeObjectURL(url))
    }
  }, [offre])

  const setLine = (i, key, value) => setForm({ ...form, lignes: form.lignes.map((l, idx) => (idx === i ? { ...l, [key]: value } : l)) })

  const payload = () => ({
    appelOffreId: isNew ? Number(aoId) : offre.appelOffreId,
    montant: Number(form.montant),
    delaiLivraisonJours: Number(form.delaiLivraisonJours) || null,
    informationsTechniques: form.informationsTechniques || null,
    observationsFournisseur: form.observationsFournisseur || null,
    lignes: form.lignes.filter((l) => l.designation).map((l) => ({
      id: l.id || null,
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

  const upload = async (doc) => {
    const file = fileRefs.current[doc.key]?.files?.[0]
    if (!file) {
      toast.error('Sélectionnez un fichier.')
      return
    }
    if (!offre) {
      toast.error('Enregistrez d’abord le brouillon avant de joindre des documents.')
      return
    }
    setUploading(doc.key)
    try {
      const body = new FormData()
      body.append('fichier', file)
      if (doc.type) body.append('type', doc.type)
      if (doc.id) body.append('documentObligatoireId', doc.id)
      body.append('entiteType', 'OFFRE')
      body.append('entiteId', offre.id)
      await unwrap(api.post('/documents/upload', body, { headers: { 'Content-Type': 'multipart/form-data' } }))
      toast.success('Document téléversé')
      if (fileRefs.current[doc.key]) fileRefs.current[doc.key].value = ''
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setUploading('')
    }
  }

  const uploadImage = async (index) => {
    const ligne = form.lignes[index]
    const input = imageRefs.current[ligne.id]
    const file = input?.files?.[0]
    if (!file) {
      toast.error('Sélectionnez une image.')
      return
    }
    if (!offre || !ligne.id) {
      toast.error('Enregistrez d’abord le brouillon avant de joindre les images.')
      return
    }
    setUploading(`image-${ligne.id}`)
    try {
      const body = new FormData()
      body.append('fichier', file)
      await unwrap(api.post(`/offres/${offre.id}/lignes/${ligne.id}/image`, body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }))
      toast.success('Image du matériel téléversée')
      if (input) input.value = ''
      await load()
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

  const required = useMemo(() => documentsRequis(offre), [offre])
  const obligatoires = required.filter((r) => r.obligatoire)
  const fournis = obligatoires.filter((r) => r.present).length
  const imagesCompletes = form.lignes.length > 0 && form.lignes.every((l) => l.imageId)
  const canSubmit = obligatoires.every((r) => r.present) && imagesCompletes
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
                    <div key={i} className="rounded-xl border border-slate-200 p-3">
                      <div className="grid gap-2 sm:grid-cols-[1.4fr_80px_130px]">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{l.designation}</p>
                          <p className="text-xs text-slate-500">Quantité : {l.quantite}</p>
                        </div>
                        <div className="self-center text-xs text-slate-500">×</div>
                        <Input type="number" min="0" value={l.prixUnitaire} onChange={(e) => setLine(i, 'prixUnitaire', e.target.value)} placeholder="PU (FCFA)" disabled={!isDraft} />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
                        {l.imageId && imageUrls[l.id] ? (
                          <img src={imageUrls[l.id]} alt={l.designation} className="h-16 w-16 rounded-lg border border-slate-200 object-cover" />
                        ) : (
                          <span className="grid h-16 w-16 place-items-center rounded-lg border border-dashed border-slate-300 px-1 text-center text-[10px] leading-tight text-slate-400">
                            {l.imageId ? 'Image' : 'Sans image'}
                          </span>
                        )}
                        <div className="flex flex-1 flex-wrap items-center gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-700">Image du matériel <span className="text-rose-600">*</span></p>
                            <p className={`text-[11px] ${l.imageId ? 'text-primary-700' : 'text-amber-600'}`}>
                              {l.imageId ? (l.imageNom || 'Image jointe') : 'Obligatoire avant la soumission'}
                            </p>
                          </div>
                          {isDraft && l.id && (
                            <>
                              <input
                                ref={(el) => (imageRefs.current[l.id] = el)}
                                type="file"
                                accept="image/png,image/jpeg"
                                className="block max-w-[190px] text-xs text-slate-500 file:mr-2 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary-700 hover:file:bg-primary-100"
                              />
                              <Button size="sm" variant="secondary" loading={uploading === `image-${l.id}`} onClick={() => uploadImage(i)}>
                                <Upload className="h-3.5 w-3.5" /> Téléverser
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
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
                <span className={`text-xs font-semibold ${canSubmit ? 'text-primary-700' : 'text-amber-600'}`}>{fournis} / {obligatoires.length} obligatoires</span>
              </div>
              <ProgressBar value={obligatoires.length ? (fournis / obligatoires.length) * 100 : 100} className="mt-2" />
              <div className="mt-4 space-y-3">
                {required.map((doc) => (
                  <div key={doc.key} className="rounded-xl border border-slate-200 p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                          {doc.present ? <CheckCircle2 className="h-4 w-4 text-primary-600" /> : <FileText className="h-4 w-4 text-slate-400" />} {doc.label}
                          {!doc.obligatoire && <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Facultatif</span>}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">{doc.hint || 'Pièce à joindre au dossier.'}</p>
                      </div>
                      {doc.present && <span className="badge bg-primary-50 text-primary-700 ring-primary-200">Joint</span>}
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      {doc.documents.map((d) => (
                        <a key={d.id} href={`/api/documents/${d.id}/download`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200">
                          <Download className="h-3.5 w-3.5" /> {d.nom}
                        </a>
                      ))}
                      {isDraft && (
                        <>
                          <input ref={(el) => (fileRefs.current[doc.key] = el)} type="file" className="block max-w-[220px] text-xs text-slate-500 file:mr-2 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary-700 hover:file:bg-primary-100" />
                          <Button size="sm" variant="secondary" loading={uploading === doc.key} onClick={() => upload(doc)}><Upload className="h-3.5 w-3.5" /> Téléverser</Button>
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
                    <div className="mt-2 space-y-1.5">
                      {!imagesCompletes && (
                        <p className="flex items-start gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Une image est obligatoire pour chaque matériel.</p>
                      )}
                      {!obligatoires.every((r) => r.present) && (
                        <p className="flex items-start gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Toutes les pièces obligatoires doivent être jointes avant la soumission.</p>
                      )}
                    </div>
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
