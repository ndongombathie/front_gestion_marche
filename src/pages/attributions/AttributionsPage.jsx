import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Award, Check, Download, Eye, FileText, Handshake, Search, X } from 'lucide-react'
import { api, errorMessage, unwrap } from '../../lib/api'
import { dateShort, fcfa } from '../../lib/format'
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
  Tabs,
  Textarea,
} from '../../components/ui'

const TABS = [
  { value: '', label: 'Toutes' },
  { value: 'PROPOSEE', label: 'Proposées' },
  { value: 'VALIDEE', label: 'Validées' },
  { value: 'REJETEE', label: 'Rejetées' },
]

export default function AttributionsPage() {
  const { hasRole } = useAuth()
  const [statut, setStatut] = useState('')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)
  const [decision, setDecision] = useState(null)

  const isDirecteur = hasRole('DIRECTEUR')

  const load = useCallback(() => {
    setLoading(true)
    unwrap(api.get('/attributions', { params: { statut: statut || undefined } }))
      .then((d) => setData(d || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [statut])

  useEffect(load, [load])

  return (
    <div>
      <PageHeader
        eyebrow="Attributions"
        title="Attributions de marchés"
        subtitle="Consultez les propositions de la commission et les décisions de la direction."
        actions={<Link to="/evaluations" className="btn-secondary"><Award className="h-4 w-4" /> Proposer depuis les évaluations</Link>}
      />

      <Card className="mb-4 p-3.5">
        <Tabs tabs={TABS} active={statut} onChange={setStatut} />
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <LoadingScreen />
        ) : data.length ? (
          <div className="table-wrap border-0">
            <table className="table-base">
              <thead>
                <tr><th>Marché</th><th>Fournisseur</th><th>Montant</th><th>Statut</th><th>Proposition</th><th>Décision</th><th className="text-right">Actions</th></tr>
              </thead>
              <tbody>
                {data.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <p className="max-w-[260px] truncate font-medium text-slate-800">{a.marcheObjet}</p>
                      <p className="font-mono text-xs text-slate-500">{a.marcheReference} · {a.offreReference}</p>
                    </td>
                    <td>
                      <p className="font-medium text-slate-800">{a.raisonSociale}</p>
                      <p className="text-xs text-slate-500">{a.proposePar || '—'}</p>
                    </td>
                    <td className="whitespace-nowrap font-semibold">{fcfa(a.montant)}</td>
                    <td><Badge value={a.statut} /></td>
                    <td className="whitespace-nowrap text-slate-500">{dateShort(a.dateProposition)}</td>
                    <td className="whitespace-nowrap text-slate-500">{dateShort(a.dateDecision)}</td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setDetail(a)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-700" title="Détail"><Eye className="h-4 w-4" /></button>
                        <a href={`/api/attributions/${a.id}/pv`} target="_blank" rel="noreferrer" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-700" title="Télécharger le PV"><Download className="h-4 w-4" /></a>
                        {isDirecteur && a.statut === 'PROPOSEE' && (
                          <button onClick={() => setDecision(a)} className="rounded-lg p-1.5 text-slate-400 hover:bg-primary-50 hover:text-primary-700" title="Décider"><Check className="h-4 w-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={Handshake} title="Aucune attribution" description="Les propositions d’attribution issues des évaluations apparaîtront ici." action={<Link to="/evaluations" className="btn-secondary">Aller aux évaluations</Link>} />
        )}
      </Card>

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title="Détail de l’attribution" description={detail?.marcheReference} size="md">
        {detail && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Info label="Marché" value={detail.marcheObjet} />
              <Info label="Référence" value={detail.marcheReference} />
              <Info label="Fournisseur" value={detail.raisonSociale} />
              <Info label="Offre" value={detail.offreReference} />
              <Info label="Montant" value={fcfa(detail.montant)} />
              <Info label="Statut" value={<Badge value={detail.statut} />} />
              <Info label="Proposé par" value={detail.proposePar} />
              <Info label="Validé par" value={detail.validePar} />
              <Info label="Date proposition" value={dateShort(detail.dateProposition)} />
              <Info label="Date décision" value={dateShort(detail.dateDecision)} />
            </div>
            {detail.motif && <Info label="Motif"><p className="text-sm leading-6 text-slate-600">{detail.motif}</p></Info>}
            {detail.observations && <Info label="Observations"><p className="text-sm leading-6 text-slate-600">{detail.observations}</p></Info>}
            <div className="flex gap-2 border-t border-slate-100 pt-4">
              <Link to={detail.marcheId ? `/marches/${detail.marcheId}` : '/marches'} className="btn-secondary flex-1"><FileText className="h-4 w-4" /> Voir le marché</Link>
              <a href={`/api/attributions/${detail.id}/pv`} target="_blank" rel="noreferrer" className="btn-primary flex-1"><Download className="h-4 w-4" /> Télécharger le PV</a>
            </div>
          </div>
        )}
      </Modal>

      <DecisionModal attribution={decision} onClose={() => setDecision(null)} onDone={(msg) => { setDecision(null); toast.success(msg); load() }} />
    </div>
  )
}

function Info({ label, children, value }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <div className="mt-0.5 text-sm font-medium text-slate-800">{children || value || '—'}</div>
    </div>
  )
}

function DecisionModal({ attribution, onClose, onDone }) {
  const [motif, setMotif] = useState('')
  const [loading, setLoading] = useState('')

  useEffect(() => setMotif(''), [attribution])

  const decide = async (action) => {
    setLoading(action)
    try {
      await unwrap(api.post(`/attributions/${attribution.id}/${action}`, { motif: motif || null }))
      onDone(action === 'valider' ? 'Attribution validée' : 'Attribution rejetée')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setLoading('')
    }
  }

  return (
    <Modal
      open={Boolean(attribution)}
      onClose={onClose}
      title="Décision d’attribution"
      description={attribution ? `${attribution.raisonSociale} · ${fcfa(attribution.montant)}` : ''}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button variant="danger" loading={loading === 'rejeter'} onClick={() => decide('rejeter')}><X className="h-4 w-4" /> Rejeter</Button>
          <Button loading={loading === 'valider'} onClick={() => decide('valider')}><Check className="h-4 w-4" /> Valider</Button>
        </>
      }
    >
      <Field label="Motif / commentaire" hint="Obligatoire en cas de rejet.">
        <Textarea value={motif} onChange={(e) => setMotif(e.target.value)} />
      </Field>
    </Modal>
  )
}
