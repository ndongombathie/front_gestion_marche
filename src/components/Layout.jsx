import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Gauge,
  Handshake,
  LayoutGrid,
  LogOut,
  Menu,
  Package,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Truck,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../contexts/AuthContext'
import { api, unwrap } from '../lib/api'
import { dateLong, initials } from '../lib/format'
import { Spinner } from './ui'
import ChatbotWidget from './ChatbotWidget'

export function Logo({ light = false, compact = false }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span
        className={clsx(
          'grid h-9 w-9 place-items-center rounded-xl shadow-sm',
          light ? 'bg-white/15 text-white ring-1 ring-white/20' : 'bg-primary-700 text-white',
        )}
      >
        <Handshake className="w-5 h-5" />
      </span>
      {!compact && (
        <span className={clsx('font-display text-lg font-extrabold tracking-tight', light ? 'text-white' : 'text-slate-900')}>
          Gestion des <span className="text-primary-400">Marchés</span>
        </span>
      )}
    </Link>
  )
}

const INTERNAL_NAV = [
  { to: '/dashboard', label: 'Tableau de bord', icon: Gauge },
  { to: '/besoins', label: 'Besoins', icon: ClipboardList },
  { to: '/marches', label: 'Marchés', icon: BriefcaseBusiness },
  { to: '/appels-offres', label: 'Appels d’offres', icon: ShoppingBag },
  { to: '/evaluations', label: 'Évaluations', icon: ClipboardCheck },
  { to: '/attributions', label: 'Attributions', icon: Handshake },
  { to: '/livraisons', label: 'Livraisons', icon: Truck },
  { to: '/fournisseurs', label: 'Fournisseurs', icon: Building2, roles: ['ADMINISTRATEUR', 'DIRECTEUR', 'MEMBRE_COMMISSION'] },
  { to: '/utilisateurs', label: 'Utilisateurs', icon: Users, roles: ['ADMINISTRATEUR'] },
  { to: '/materiels', label: 'Matériels', icon: Package, roles: ['ADMINISTRATEUR', 'RESPONSABLE_SERVICE'] },
  { to: '/rapports', label: 'Rapports', icon: ChartNoAxesCombined, roles: ['ADMINISTRATEUR', 'RESPONSABLE_SERVICE', 'DIRECTEUR'] },
]

const FOURNISSEUR_NAV = [
  { to: '/fournisseur', label: 'Tableau de bord', icon: Gauge, end: true },
  { to: '/fournisseur/opportunites', label: 'Opportunités', icon: ShoppingBag },
  { to: '/fournisseur/offres', label: 'Mes offres', icon: FileText },
  { to: '/fournisseur/marches', label: 'Mes marchés', icon: BriefcaseBusiness },
  { to: '/fournisseur/livraisons', label: 'Mes livraisons', icon: Truck },
]

export function ProtectedRoute({ roles }) {
  const { isAuthenticated, loading, user } = useAuth()
  const location = useLocation()
  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/connexion" state={{ from: location }} replace />
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={user.role === 'FOURNISSEUR' ? '/fournisseur' : '/dashboard'} replace />
  }
  return <Outlet />
}

export function AppLayout() {
  const { user, logout, isFournisseur, hasRole } = useAuth()
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState(false)
  const [notifications, setNotifications] = useState(0)
  const location = useLocation()
  const navigate = useNavigate()

  const nav = useMemo(() => {
    const base = isFournisseur ? FOURNISSEUR_NAV : INTERNAL_NAV
    return base.filter((item) => !item.roles || hasRole(item.roles))
  }, [isFournisseur, hasRole])

  useEffect(() => {
    setOpen(false)
    setMenu(false)
  }, [location.pathname])

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const count = await unwrap(api.get('/notifications/non-lues/count'))
        if (active) setNotifications(Number(count) || 0)
      } catch {
        /* ignore */
      }
    }
    load()
    const timer = setInterval(load, 45000)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [location.pathname])

  const onLogout = async () => {
    await logout()
    toast.success('Vous êtes déconnecté')
    navigate('/')
  }

  const roleLabel = {
    ADMINISTRATEUR: 'Administrateur',
    RESPONSABLE_SERVICE: 'Responsable de service',
    MEMBRE_COMMISSION: 'Membre de commission',
    DIRECTEUR: 'Directeur',
    FOURNISSEUR: 'Fournisseur',
  }[user?.role]

  return (
    <div className="min-h-screen bg-sand-50">
      {open && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex w-[272px] flex-col bg-gradient-to-b from-primary-950 via-primary-900 to-primary-950 text-white transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between h-16 px-5 border-b border-white/10">
          <Logo light />
          <button className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 lg:hidden" onClick={() => setOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-300/70">
            {isFournisseur ? 'Espace fournisseur' : 'Pilotage'}
          </p>
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => clsx('nav-link', isActive && 'nav-link-active')}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
          <p className="px-3 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-300/70">
            Compte
          </p>
          <NavLink to="/notifications" className={({ isActive }) => clsx('nav-link', isActive && 'nav-link-active')}>
            <Bell className="h-[18px] w-[18px]" />
            <span className="flex-1">Notifications</span>
            {notifications > 0 && (
              <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-primary-950">{notifications}</span>
            )}
          </NavLink>
          <NavLink to="/profil" className={({ isActive }) => clsx('nav-link', isActive && 'nav-link-active')}>
            <UserRound className="h-[18px] w-[18px]" />
            <span>Mon profil</span>
          </NavLink>
        </nav>

        <div className="p-3 border-t border-white/10">
          <div className="p-3 rounded-2xl bg-white/5 ring-1 ring-white/10">
            <div className="flex items-center gap-2.5">
              <span className="grid text-xs font-bold rounded-full h-9 w-9 shrink-0 place-items-center bg-primary-400/20 text-primary-100 ring-1 ring-primary-300/30">
                {initials(user?.nomComplet || user?.email)}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.nomComplet}</p>
                <p className="truncate text-[11px] text-primary-200/80">{roleLabel}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center justify-center w-full gap-2 px-3 py-2 mt-3 text-xs font-semibold transition rounded-lg bg-white/10 text-white/90 hover:bg-white/15"
            >
              <LogOut className="h-3.5 w-3.5" /> Se déconnecter
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[272px]">
        <header className="sticky top-0 z-20 flex items-center h-16 gap-3 px-4 border-b border-slate-200/80 bg-white/85 backdrop-blur sm:px-6">
          <button className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="items-center hidden gap-2 text-sm text-slate-500 md:flex">
            <CalendarDays className="w-4 h-4 text-primary-600" />
            <span>{dateLong(new Date())}</span>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <Link
              to={isFournisseur ? '/fournisseur/opportunites' : '/appels-offres'}
              className="hidden rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 sm:block"
              title="Rechercher"
            >
              <Search className="w-5 h-5" />
            </Link>
            <Link to="/notifications" className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100">
              <Bell className="w-5 h-5" />
              {notifications > 0 && (
                <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {notifications > 9 ? '9+' : notifications}
                </span>
              )}
            </Link>
            <div className="relative">
              <button
                onClick={() => setMenu((v) => !v)}
                className="flex items-center gap-2 rounded-xl py-1.5 pl-1.5 pr-2.5 hover:bg-slate-100"
              >
                <span className="grid w-8 h-8 text-xs font-bold rounded-full place-items-center bg-primary-100 text-primary-800">
                  {initials(user?.nomComplet || user?.email)}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block text-sm font-semibold leading-tight text-slate-800">{user?.prenom}</span>
                  <span className="block text-[11px] text-slate-500">{roleLabel}</span>
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
              {menu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-52 animate-fade-in overflow-hidden rounded-2xl border border-slate-200 bg-white py-1.5 shadow-xl">
                    <div className="border-b border-slate-100 px-4 py-2.5">
                      <p className="text-sm font-semibold truncate text-slate-800">{user?.nomComplet}</p>
                      <p className="text-xs truncate text-slate-500">{user?.email}</p>
                    </div>
                    <Link to="/profil" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50">
                      <Settings className="w-4 h-4" /> Mon profil
                    </Link>
                    <Link to="/notifications" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50">
                      <Bell className="w-4 h-4" /> Notifications
                    </Link>
                    <button onClick={onLogout} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50">
                      <LogOut className="w-4 h-4" /> Se déconnecter
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
      <ChatbotWidget />
    </div>
  )
}

export function PublicLayout() {
  const { isAuthenticated, isFournisseur } = useAuth()
  const [open, setOpen] = useState(false)
  const links = [
    { to: '/', label: 'Accueil' },
    { to: '/opportunites', label: 'Appels d’offres' },
    { to: '/a-propos', label: 'À propos' },
  ]
  return (
    <div className="flex flex-col min-h-screen bg-sand-50">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-sand-50/85 backdrop-blur">
        <div className="flex items-center justify-between h-16 gap-4 container-page">
          <Logo />
          <nav className="items-center hidden gap-1 md:flex">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  clsx(
                    'rounded-xl px-3.5 py-2 text-sm font-medium transition',
                    isActive ? 'bg-primary-50 text-primary-800' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="items-center hidden gap-2 md:flex">
            {isAuthenticated ? (
              <Link to={isFournisseur ? '/fournisseur' : '/dashboard'} className="btn-primary">
                <LayoutGrid className="w-4 h-4" /> Mon espace
              </Link>
            ) : (
              <>
                <Link to="/connexion" className="btn-ghost">Connexion</Link>
                <Link to="/inscription" className="btn-primary">Devenir fournisseur</Link>
              </>
            )}
          </div>
          <button className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 md:hidden" onClick={() => setOpen((v) => !v)}>
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {open && (
          <div className="px-4 py-3 bg-white border-t border-slate-200 md:hidden">
            <div className="flex flex-col gap-1">
              {links.map((l) => (
                <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  {l.label}
                </Link>
              ))}
              <div className="flex gap-2 pt-3 mt-2 border-t border-slate-100">
                {isAuthenticated ? (
                  <Link to={isFournisseur ? '/fournisseur' : '/dashboard'} className="flex-1 btn-primary">Mon espace</Link>
                ) : (
                  <>
                    <Link to="/connexion" onClick={() => setOpen(false)} className="flex-1 btn-secondary">Connexion</Link>
                    <Link to="/inscription" onClick={() => setOpen(false)} className="flex-1 btn-primary">S’inscrire</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-white border-t border-slate-200">
        <div className="grid gap-8 py-10 container-page sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo />
            <p className="max-w-xs mt-3 text-sm leading-6 text-slate-500">
              La plateforme de référence pour gérer les marchés publics de matériels et d’équipements en toute transparence.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold font-display text-slate-900">Plateforme</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li><Link to="/opportunites" className="hover:text-primary-700">Appels d’offres</Link></li>
              <li><Link to="/inscription" className="hover:text-primary-700">Inscription fournisseur</Link></li>
              <li><Link to="/connexion" className="hover:text-primary-700">Espace privé</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold font-display text-slate-900">Institution</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li><Link to="/a-propos" className="hover:text-primary-700">À propos</Link></li>
              <li><span>Cadre réglementaire</span></li>
              <li><span>Transparence</span></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold font-display text-slate-900">Contact</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li>Dakar, Sénégal</li>
              <li>contact@marchepro.sn</li>
              <li>+221 33 800 00 00</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-100">
          <div className="flex flex-col items-center justify-between gap-2 py-4 text-xs container-page text-slate-400 sm:flex-row">
            <p>© {new Date().getFullYear()} MarchéPro. Tous droits réservés.</p>
            <p className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Plateforme sécurisée · FCFA</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
