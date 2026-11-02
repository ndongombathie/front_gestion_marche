import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Archive, Package, Pencil, Plus, Search, Trash2 } from 'lucide-react'
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
  Textarea,
} from '../../components/ui'

export default function MaterielsPage() {
  const { isAdmin } = useAuth()
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [categorie, setCategorie] = useState('')
  const [categories, setCategories] = useState([])
  const [page, setPage] = useState(0)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    unwrap(api.get('/materiels', { params: { q: q || undefined, categorie: categorie || undefined, page, size: 12, sort: 'designation' } }))
      .then(setData)
      .catch(() => setData({ contenu: [], totalElements: 0, totalPages: 1, page: 0 }))
      .finally(() => setLoading(false))
  }, [q, categorie, page])

  useEffect(load, [load])
  useEffect(() => {
    unwrap(api.get('/materiels/categories')).then((d) => setCategories(d || [])).catch(() => {})
  }, [])

  const submitSearch = (e) => {
    e.preventDefault()
    setPage(0)
    setQ(search.trim())
  }

  const deactivate = async (m) => {
    if (!window.confirm(`Désactiver « ${m.designation} » du catalogue ?`)) return
    try {
      await unwrap(api.delete(`/materiels/${m.id}`))
      toast.success('Matériel désactivé')
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Catalogue"
        title="Matériels & équipements"
        subtitle="Le référentiel des matériels utilisés dans les besoins, marchés et appels d’offres."
        actions={isAdmin && <Button onClick={() => { setEditing(null); setOpen(true) }}><Plus className="h-4 w-4" /> Ajouter un matériel</Button>}
      />

      <Card className="mb-4 p-3.5">
        <form onSubmit={submitSearch} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Désignation, description…" className="pl-10" />
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.contenu.map((m) => (
              <Card key={m.id} className="flex flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-50 text-primary-700"><Package className="h-5 w-5" /></span>
                  <Badge value={m.actif ? 'ACTIF' : 'INACTIF'} />
                </div>
                <h2 className="mt-3 font-display text-base font-bold text-slate-900">{m.designation}</h2>
                <p className="mt-0.5 text-xs font-medium text-primary-700">{m.categorie}</p>
                <p className="mt-2 line-clamp-2 text-sm text-slate-500">{m.description || m.caracteristiques || 'Aucune description.'}</p>
                <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-[11px] text-slate-400">Ajouté le {dateShort(m.dateCreation)}</span>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <button onClick={() => { setEditing(m); setOpen(true) }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-700"><Pencil className="h-4 w-4" /></button>
                      {m.actif && <button onClick={() => deactivate(m)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Archive className="h-4 w-4" /></button>}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
          <Card className="mt-4"><Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onChange={setPage} /></Card>
        </>
      ) : (
        <Card><EmptyState icon={Package} title="Aucun matériel" description="Ajoutez des matériels au catalogue pour les utiliser dans les besoins." action={isAdmin ? <Button onClick={() => { setEditing(null); setOpen(true) }}><Plus className="h-4 w-4" /> Ajouter</Button> : null} /></Card>
      )}

      <MaterielModal open={open} onClose={() => setOpen(false)} materiel={editing} onDone={() => { setOpen(false); toast.success(editing ? 'Matériel mis à jour' : 'Matériel ajouté'); load() }} />
    </div>
  )
}

function MaterielModal({ open, onClose, materiel, onDone }) {
  const [form, setForm] = useState({ designation: '', categorie: '', description: '', caracteristiques: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    setForm(materiel ? {
      designation: materiel.designation || '',
      categorie: materiel.categorie || '',
      description: materiel.description || '',
      caracteristiques: materiel.caracteristiques || '',
    } : { designation: '', categorie: '', description: '', caracteristiques: '' })
  }, [open, materiel])

  const submit = async () => {
    setError('')
    setLoading(true)
    try {
      if (materiel) await unwrap(api.put(`/materiels/${materiel.id}`, form))
      else await unwrap(api.post('/materiels', form))
      onDone()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={materiel ? 'Modifier le matériel' : 'Nouveau matériel'} footer={<><Button variant="secondary" onClick={onClose}>Annuler</Button><Button onClick={submit} loading={loading}>{materiel ? 'Enregistrer' : 'Ajouter'}</Button></>}>
      <div className="space-y-4">
        <Field label="Désignation" required><Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} required maxLength={160} /></Field>
        <Field label="Catégorie" required><Input value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })} placeholder="Informatique, mobilier…" required maxLength={80} /></Field>
        <Field label="Description"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        <Field label="Caractéristiques"><Textarea value={form.caracteristiques} onChange={(e) => setForm({ ...form, caracteristiques: e.target.value })} /></Field>
        {error && <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700">{error}</p>}
      </div>
    </Modal>
  )
}
