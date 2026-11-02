import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, FileText, Plus, Search } from 'lucide-react'
import { api, unwrap } from '../../lib/api'
import { dateShort, fcfa } from '../../lib/format'
import { Badge, Button, Card, EmptyState, Input, LoadingScreen, PageHeader, Tabs } from '../../components/ui'

const TABS = [
  { value: '', label: 'Toutes' },
  { value: 'BROUILLON', label: 'Brouillons' },
  { value: 'SOUMISE', label: 'Soumises' },
  { value: 'EN_EVALUATION', label: 'En évaluation' },
  { value: 'RETENUE', label: 'Retenues' },
  { value: 'NON_RETENUE', label: 'Non retenues' },
]

export default function FournisseurOffresPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('')
  const [q, setQ] = useState('')

  useEffect(() => {
    unwrap(api.get('/offres/mes-offres'))
      .then((d) => setData(d || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return data.filter((o) => {
      if (tab && o.statut !== tab) return false
      if (!term) return true
      return [o.appelOffreObjet, o.appelOffreReference, o.reference].some((v) => String(v || '').toLowerCase().includes(term))
    })
  }, [data, tab, q])

  const counts = useMemo(() => Object.fromEntries(TABS.map((t) => [t.value, t.value ? data.filter((o) => o.statut === t.value).length : data.length])), [data])

  return (
    <div>
      <PageHeader
        eyebrow="Candidatures"
        title="Mes offres"
        subtitle="Créez, complétez et suivez vos offres pour les consultations publiées."
        actions={<Link to="/fournisseur/opportunites" className="btn-primary"><Plus className="h-4 w-4" /> Nouvelle offre</Link>}
      />

      <Card className="mb-4 p-3.5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <Tabs tabs={TABS.map((t) => ({ ...t, count: counts[t.value] }))} active={tab} onChange={setTab} />
          <div className="relative flex-1 xl:max-w-xs xl:self-end">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" className="pl-10" />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <LoadingScreen />
        ) : filtered.length ? (
          <div className="table-wrap border-0">
            <table className="table-base">
              <thead><tr><th>Référence</th><th>Appel d’offres</th><th>Montant</th><th>Délai</th><th>Statut</th><th>Créée le</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id}>
                    <td className="font-mono text-xs font-semibold text-slate-600">{o.reference || 'Brouillon'}</td>
                    <td>
                      <Link to={`/fournisseur/offres/${o.id}`} className="block max-w-[300px] truncate font-medium text-slate-800 hover:text-primary-700">{o.appelOffreObjet}</Link>
                      <p className="text-xs text-slate-500">{o.appelOffreReference} · limite {dateShort(o.dateLimite)}</p>
                    </td>
                    <td className="whitespace-nowrap font-semibold">{fcfa(o.montant)}</td>
                    <td className="text-slate-600">{o.delaiLivraisonJours ? `${o.delaiLivraisonJours} j` : '—'}</td>
                    <td><Badge value={o.statut} /></td>
                    <td className="whitespace-nowrap text-slate-500">{dateShort(o.dateCreation)}</td>
                    <td className="text-right"><Link to={`/fournisseur/offres/${o.id}`} className="btn-secondary btn-sm"><Eye className="h-3.5 w-3.5" /> Détail</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="Aucune offre"
            description="Parcourez les opportunités et soumettez votre première offre."
            action={<Link to="/fournisseur/opportunites" className="btn-primary"><Plus className="h-4 w-4" /> Voir les opportunités</Link>}
          />
        )}
      </Card>
    </div>
  )
}
