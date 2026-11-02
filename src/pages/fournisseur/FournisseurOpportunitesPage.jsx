import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Building2, CalendarClock, Search, ShoppingBag, Timer } from 'lucide-react'
import { api, unwrap } from '../../lib/api'
import { dateShort, daysLeft, fcfa } from '../../lib/format'
import { Badge, Button, Card, EmptyState, Input, LoadingScreen, PageHeader, Pagination, Select } from '../../components/ui'

export default function FournisseurOpportunitesPage() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [categorie, setCategorie] = useState('')
  const [categories, setCategories] = useState([])
  const [page, setPage] = useState(0)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/appels-offres/public/categories').then((r) => setCategories(r.data?.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    unwrap(api.get('/appels-offres/public', { params: { q: q || undefined, categorie: categorie || undefined, page, size: 9, sort: 'datePublication,desc' } }))
      .then((d) => active && setData(d))
      .catch(() => active && setData({ contenu: [], totalElements: 0, totalPages: 1, page: 0 }))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [q, categorie, page])

  const submit = (e) => {
    e.preventDefault()
    setPage(0)
    setQ(search.trim())
  }

  return (
    <div>
      <PageHeader
        eyebrow="Catalogue"
        title="Opportunités"
        subtitle="Toutes les consultations ouvertes auxquelles vous pouvez candidater."
        actions={<span className="badge bg-primary-50 text-primary-700 ring-primary-200">{data?.totalElements ?? 0} consultation{(data?.totalElements ?? 0) > 1 ? 's' : ''}</span>}
      />

      <Card className="mb-4 p-3.5">
        <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une consultation…" className="pl-10" />
          </div>
          <Select value={categorie} onChange={(e) => { setCategorie(e.target.value); setPage(0) }} className="sm:w-56">
            <option value="">Toutes les catégories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Button type="submit" variant="secondary">Rechercher</Button>
        </form>
      </Card>

      {loading ? (
        <LoadingScreen />
      ) : data?.contenu?.length ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.contenu.map((ao) => {
              const left = daysLeft(ao.dateLimite)
              return (
                <Card key={ao.id} className="card-hover flex h-full flex-col p-5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-[11px] font-semibold text-slate-600">{ao.reference}</span>
                    <Badge value={ao.ouvert ? 'PUBLIE' : 'CLOTURE'} label={ao.ouvert ? 'Ouvert' : 'Clôturé'} />
                  </div>
                  <h2 className="mt-3 line-clamp-2 font-display text-base font-bold leading-snug text-slate-900">{ao.objet}</h2>
                  <p className="mt-1.5 line-clamp-2 text-sm text-slate-500">{ao.description || 'Consultez le détail de la consultation.'}</p>
                  <div className="mt-4 space-y-2 text-xs text-slate-500">
                    <p className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5 text-slate-400" /> {ao.organisme || 'Administration'}</p>
                    <p className="flex items-center gap-2"><CalendarClock className="h-3.5 w-3.5 text-slate-400" /> Limite : {dateShort(ao.dateLimite)}</p>
                  </div>
                  <div className="mt-auto flex items-end justify-between gap-2 border-t border-slate-100 pt-3.5">
                    <div>
                      <p className="text-[11px] text-slate-400">Budget</p>
                      <p className="text-sm font-semibold text-slate-800">{ao.budgetEstimatif ? fcfa(ao.budgetEstimatif) : 'Non communiqué'}</p>
                    </div>
                    {left != null && left >= 0 && <span className={`flex items-center gap-1 text-xs font-semibold ${left <= 3 ? 'text-rose-600' : 'text-primary-700'}`}><Timer className="h-3.5 w-3.5" /> {left === 0 ? 'Dernier jour' : `J-${left}`}</span>}
                  </div>
                  <Button onClick={() => navigate(`/fournisseur/offres/nouveau?ao=${ao.id}`)} disabled={!ao.ouvert} className="mt-3 w-full">
                    Candidater <ArrowRight className="h-4 w-4" />
                  </Button>
                </Card>
              )
            })}
          </div>
          <Card className="mt-4"><Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onChange={setPage} /></Card>
        </>
      ) : (
        <Card><EmptyState icon={ShoppingBag} title="Aucune opportunité" description="Aucune consultation ne correspond à votre recherche pour le moment." /></Card>
      )}
    </div>
  )
}
