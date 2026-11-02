import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Bell, BellOff, CheckCheck, CheckCircle2, Info, MailOpen } from 'lucide-react'
import { api, errorMessage, unwrap } from '../../lib/api'
import { relative } from '../../lib/format'
import { Button, Card, EmptyState, LoadingScreen, PageHeader, Pagination, Tabs } from '../../components/ui'

const TABS = [
  { value: 'all', label: 'Toutes' },
  { value: 'unread', label: 'Non lues' },
]

export default function NotificationsPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('all')
  const [page, setPage] = useState(0)
  const [data, setData] = useState(null)
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      unwrap(api.get('/notifications', { params: { page, size: 12, sort: 'dateCreation,desc' } })),
      unwrap(api.get('/notifications/non-lues/count')).catch(() => 0),
    ])
      .then(([d, c]) => { setData(d); setUnread(Number(c) || 0) })
      .catch(() => setData({ contenu: [], totalElements: 0, totalPages: 1, page: 0 }))
      .finally(() => setLoading(false))
  }, [page])

  useEffect(load, [load])

  const markRead = async (n) => {
    try {
      if (!n.lue) await unwrap(api.put(`/notifications/${n.id}/lire`))
      if (n.lien) navigate(n.lien)
      else load()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const markAll = async () => {
    try {
      await unwrap(api.put('/notifications/lire-tout'))
      toast.success('Toutes les notifications sont lues')
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const items = (data?.contenu || []).filter((n) => tab === 'all' || !n.lue)

  return (
    <div>
      <PageHeader
        eyebrow="Messagerie"
        title="Notifications"
        subtitle="Suivez les décisions, échéances et événements de vos marchés."
        actions={<Button variant="secondary" onClick={markAll} disabled={!unread}><CheckCheck className="h-4 w-4" /> Tout marquer comme lu</Button>}
      />

      <Card className="mb-4 flex flex-wrap items-center justify-between gap-3 p-3.5">
        <Tabs tabs={TABS.map((t) => ({ ...t, count: t.value === 'unread' ? unread : data?.totalElements }))} active={tab} onChange={(v) => { setTab(v); setPage(0) }} />
        <span className="text-xs text-slate-500">{unread} non lue{unread > 1 ? 's' : ''}</span>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <LoadingScreen />
        ) : items.length ? (
          <>
            <div className="divide-y divide-slate-100">
              {items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead(n)}
                  className={`flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-sand-50 ${!n.lue ? 'bg-primary-50/40' : ''}`}
                >
                  <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${!n.lue ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-500'}`}>
                    {n.lue ? <MailOpen className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`truncate text-sm ${!n.lue ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>{n.titre}</p>
                      {!n.lue && <span className="h-2 w-2 shrink-0 rounded-full bg-primary-600" />}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">{n.message}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{relative(n.dateCreation)}{n.type ? ` · ${n.type}` : ''}</p>
                  </div>
                  {n.lien && <span className="shrink-0 self-center text-xs font-semibold text-primary-700">Ouvrir</span>}
                </button>
              ))}
            </div>
            <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onChange={setPage} />
          </>
        ) : (
          <EmptyState icon={BellOff} title="Aucune notification" description={tab === 'unread' ? 'Vous avez lu toutes vos notifications.' : 'Les événements liés à vos marchés apparaîtront ici.'} />
        )}
      </Card>
    </div>
  )
}
