import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, Building2, CalendarClock, Filter, Search, ShoppingBag, X } from 'lucide-react'
import { api, unwrap } from '../../lib/api'
import { dateShort, daysLeft, fcfa } from '../../lib/format'
import { Badge, Card, EmptyState, Input, Pagination, Select, Skeleton } from '../../components/ui'

export default function OpportunitiesPage() {
  const [params, setParams] = useSearchParams()
  const [data, setData] = useState(null)
  const [categories, setCategories] = useState([])
  const [organismes, setOrganismes] = useState([])
  const [loading, setLoading] = useState(true)

  const q = params.get('q') || ''
  const categorie = params.get('categorie') || ''
  const organisme = params.get('organisme') || ''
  const page = Number(params.get('page') || 0)
  const [search, setSearch] = useState(q)

  const update = (patch) => {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([k, v]) => {
      if (v === '' || v == null) next.delete(k)
      else next.set(k, v)
    })
    if (!('page' in patch)) next.delete('page')
    setParams(next)
  }

  useEffect(() => {
    api.get('/appels-offres/public/categories').then((r) => setCategories(r.data?.data || [])).catch(() => {})
    api.get('/appels-offres/public/organismes').then((r) => setOrganismes(r.data?.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    unwrap(api.get('/appels-offres/public', { params: { q: q || undefined, categorie: categorie || undefined, organisme: organisme || undefined, page, size: 9, sort: 'datePublication,desc' } }))
      .then((d) => active && setData(d))
      .catch(() => active && setData({ contenu: [], totalElements: 0, totalPages: 1, page: 0 }))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [q, categorie, organisme, page])

  useEffect(() => setSearch(q), [q])

  const submitSearch = (e) => {
    e.preventDefault()
    update({ q: search.trim() })
  }

  const reset = () => setParams(new URLSearchParams())

  const activeFilters = [q, categorie, organisme].filter(Boolean).length

  return (
    <div>
      <section className="border-b border-slate-200 bg-white">
        <div className="container-page py-10 sm:py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">Catalogue public</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Appels d’offres</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Toutes les consultations publiées par l’administration. Filtrez, consultez le détail et préparez votre offre.
          </p>
          <form onSubmit={submitSearch} className="mt-6 flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par objet, référence, matériel…"
                className="pl-10"
              />
            </div>
            <Select value={categorie} onChange={(e) => update({ categorie: e.target.value })} className="lg:w-52">
              <option value="">Toutes les catégories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Select value={organisme} onChange={(e) => update({ organisme: e.target.value })} className="lg:w-56">
              <option value="">Tous les organismes</option>
              {organismes.map((o) => <option key={o} value={o}>{o}</option>)}
            </Select>
            <button className="btn-primary shrink-0"><Filter className="h-4 w-4" /> Filtrer</button>
          </form>
          {activeFilters > 0 && (
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <span>{activeFilters} filtre{activeFilters > 1 ? 's' : ''} actif{activeFilters > 1 ? 's' : ''}</span>
              <button onClick={reset} className="inline-flex items-center gap-1 font-semibold text-primary-700 hover:underline">
                <X className="h-3.5 w-3.5" /> Réinitialiser
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="container-page py-8">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {data ? <><span className="font-semibold text-slate-800">{data.totalElements}</span> consultation{data.totalElements > 1 ? 's' : ''} trouvée{data.totalElements > 1 ? 's' : ''}</> : 'Chargement…'}
          </p>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-3 h-5 w-full" />
                <Skeleton className="mt-2 h-5 w-2/3" />
                <Skeleton className="mt-6 h-10 w-full" />
              </Card>
            ))}
          </div>
        ) : data?.contenu?.length ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.contenu.map((ao) => <AoCard key={ao.id} ao={ao} />)}
            </div>
            <div className="mt-6">
              <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onChange={(p) => update({ page: p })} />
            </div>
          </>
        ) : (
          <Card>
            <EmptyState
              icon={ShoppingBag}
              title="Aucun appel d’offres trouvé"
              description="Essayez d’élargir votre recherche ou de réinitialiser les filtres."
              action={<button onClick={reset} className="btn-secondary">Réinitialiser les filtres</button>}
            />
          </Card>
        )}
      </section>
    </div>
  )
}

function AoCard({ ao }) {
  const left = daysLeft(ao.dateLimite)
  return (
    <Card className="card-hover flex h-full flex-col p-5">
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
        <Link to={`/opportunites/${ao.id}`} className="btn-primary btn-sm">
          Détails <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      {left != null && left >= 0 && left <= 7 && (
        <p className="mt-2 text-[11px] font-semibold text-rose-600">{left === 0 ? 'Clôture aujourd’hui' : `Plus que ${left} jour${left > 1 ? 's' : ''}`}</p>
      )}
    </Card>
  )
}
