import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Building2, Check, Eye, Mail, MapPin, Phone, Search, ShieldCheck, X } from 'lucide-react'
import { api, errorMessage, unwrap } from '../../lib/api'
import { dateShort } from '../../lib/format'
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
  Pagination,
  Select,
  Tabs,
  Textarea,
} from '../../components/ui'

const TABS = [
  { value: '', label: 'Tous' },
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'VALIDE', label: 'Validés' },
  { value: 'REJETE', label: 'Rejetés' },
]

export default function FournisseursPage() {
  const { isAdmin } = useAuth()
  const [statut, setStatut] = useState('')
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)
  const [decision, setDecision] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    unwrap(api.get('/fournisseurs', { params: { statut: statut || undefined, q: q || undefined, page, size: 10, sort: 'raisonSociale' } }))
      .then(setData)
      .catch(() => setData({ contenu: [], totalElements: 0, totalPages: 1, page: 0 }))
      .finally(() => setLoading(false))
  }, [statut, q, page])

  useEffect(load, [load])

  const submitSearch = (e) => {
    e.preventDefault()
    setPage(0)
    setQ(search.trim())
  }

  return (
    <div>
      <PageHeader
        eyebrow="Annuaire"
        title="Fournisseurs"
        subtitle="Gérez les dossiers fournisseurs, validez les inscriptions et suivez les partenaires."
      />

      <Card className="mb-4 p-3.5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Tabs tabs={TABS} active={statut} onChange={(v) => { setStatut(v); setPage(0) }} />
          <form onSubmit={submitSearch} className="flex flex-1 gap-2 lg:justify-end">
            <div className="relative flex-1 lg:max-w-xs">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Raison sociale, NINEA…" className="pl-10" />
            </div>
            <Button type="submit" variant="secondary">Rechercher</Button>
          </form>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <LoadingScreen />
        ) : data?.contenu?.length ? (
          <>
            <div className="table-wrap border-0">
              <table className="table-base">
                <thead><tr><th>Entreprise</th><th>NINEA</th><th>Contact</th><th>Représentant</th><th>Statut</th><th>Inscription</th><th className="text-right">Actions</th></tr></thead>
                <tbody>
                  {data.contenu.map((f) => (
                    <tr key={f.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-700"><Building2 className="h-4 w-4" /></span>
                          <div className="min-w-0">
                            <p className="max-w-[220px] truncate font-medium text-slate-800">{f.raisonSociale}</p>
                            <p className="text-xs text-slate-500">{f.emailUtilisateur || f.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="font-mono text-xs text-slate-600">{f.ninea || '—'}</td>
                      <td className="text-xs text-slate-600">{f.telephone || '—'}</td>
                      <td className="text-slate-600">{f.representant || '—'}</td>
                      <td><Badge value={f.statutValidation} /></td>
                      <td className="whitespace-nowrap text-slate-500">{dateShort(f.dateCreation)}</td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setDetail(f)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-700" title="Détail"><Eye className="h-4 w-4" /></button>
                          {isAdmin && f.statutValidation !== 'VALIDE' && (
                            <button onClick={() => setDecision({ fournisseur: f, action: 'valider' })} className="rounded-lg p-1.5 text-slate-400 hover:bg-primary-50 hover:text-primary-700" title="Valider"><Check className="h-4 w-4" /></button>
                          )}
                          {isAdmin && f.statutValidation !== 'REJETE' && (
                            <button onClick={() => setDecision({ fournisseur: f, action: 'rejeter' })} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Rejeter"><X className="h-4 w-4" /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onChange={setPage} />
          </>
        ) : (
          <EmptyState icon={Building2} title="Aucun fournisseur" description="Aucun dossier ne correspond à votre recherche." />
        )}
      </Card>

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={detail?.raisonSociale || 'Fournisseur'} description={detail?.ninea ? `NINEA ${detail.ninea}` : ''}>
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge value={detail.statutValidation} />
              <span className="text-xs text-slate-500">Inscrit le {dateShort(detail.dateCreation)}</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Info label="Raison sociale" value={detail.raisonSociale} />
              <Info label="NINEA" value={detail.ninea} />
              <Info label="RCCM" value={detail.rccm} />
              <Info label="Représentant" value={detail.representant} />
              <Info label="Téléphone" value={detail.telephone} icon={Phone} />
              <Info label="Email" value={detail.email || detail.emailUtilisateur} icon={Mail} />
              <Info label="Adresse" value={detail.adresse} icon={MapPin} />
              <Info label="Compte utilisateur" value={detail.nomRepresentant || detail.emailUtilisateur} />
            </div>
            {detail.motifRejet && <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700"><span className="font-semibold">Motif de rejet : </span>{detail.motifRejet}</div>}
            <div className="flex gap-2 border-t border-slate-100 pt-4">
              {isAdmin && detail.statutValidation !== 'VALIDE' && <Button className="flex-1" onClick={() => { setDetail(null); setDecision({ fournisseur: detail, action: 'valider' }) }}><Check className="h-4 w-4" /> Valider le dossier</Button>}
              {isAdmin && detail.statutValidation !== 'REJETE' && <Button variant="danger" className="flex-1" onClick={() => { setDetail(null); setDecision({ fournisseur: detail, action: 'rejeter' }) }}><X className="h-4 w-4" /> Rejeter</Button>}
            </div>
          </div>
        )}
      </Modal>

      <ValidationModal decision={decision} onClose={() => setDecision(null)} onDone={(msg) => { setDecision(null); toast.success(msg); load() }} />
    </div>
  )
}

function Info({ label, value, icon: Icon }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-slate-800">{Icon && <Icon className="h-3.5 w-3.5 text-slate-400" />}{value || '—'}</p>
    </div>
  )
}

function ValidationModal({ decision, onClose, onDone }) {
  const [motif, setMotif] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => setMotif(''), [decision])

  const submit = async () => {
    setLoading(true)
    try {
      await unwrap(api.put(`/fournisseurs/${decision.fournisseur.id}/validation`, {
        statut: decision.action === 'valider' ? 'VALIDE' : 'REJETE',
        motif: motif || null,
      }))
      onDone(decision.action === 'valider' ? 'Fournisseur validé' : 'Fournisseur rejeté')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={Boolean(decision)}
      onClose={onClose}
      title={decision?.action === 'valider' ? 'Valider le fournisseur' : 'Rejeter le fournisseur'}
      description={decision?.fournisseur?.raisonSociale}
      footer={<><Button variant="secondary" onClick={onClose}>Annuler</Button><Button variant={decision?.action === 'valider' ? 'primary' : 'danger'} onClick={submit} loading={loading}><ShieldCheck className="h-4 w-4" /> Confirmer</Button></>}
    >
      <Field label="Motif" hint={decision?.action === 'rejeter' ? 'Précisez la raison du rejet.' : 'Commentaire optionnel.'}>
        <Textarea value={motif} onChange={(e) => setMotif(e.target.value)} />
      </Field>
    </Modal>
  )
}
