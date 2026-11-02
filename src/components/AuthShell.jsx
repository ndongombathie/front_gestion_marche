import { Link } from 'react-router-dom'
import { ArrowLeft, BadgeCheck, CheckCircle2, ShieldCheck } from 'lucide-react'
import { Logo } from './Layout'

export default function AuthShell({ title, subtitle, children, footer, wide = false }) {
  return (
    <div className="grid min-h-screen bg-sand-50 lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden overflow-hidden bg-primary-950 p-10 text-white lg:flex lg:flex-col">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(34,197,94,0.25),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(184,154,99,0.18),transparent_50%)]" />
        <div className="relative">
          <Logo light />
        </div>
        <div className="relative my-auto max-w-md">
          <h2 className="font-display text-3xl font-extrabold leading-tight tracking-tight">
            La commande publique, <span className="text-primary-300">en toute confiance.</span>
          </h2>
          <p className="mt-4 text-sm leading-7 text-primary-100/75">
            Un espace unique pour gérer vos marchés, suivre vos offres et sécuriser chaque livraison.
          </p>
          <ul className="mt-8 space-y-4">
            {[
              'Dossiers dématérialisés et horodatés',
              'Circuits de validation transparents',
              'Tableaux de bord et exports instantanés',
              'Notifications à chaque étape clé',
            ].map((t) => (
              <li key={t} className="flex items-start gap-3 text-sm text-primary-100/85">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary-300" /> {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative flex items-center gap-4 text-xs text-primary-200/70">
          <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary-300" /> Connexion sécurisée</span>
          <span className="flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-primary-300" /> Données confidentielles</span>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center justify-between px-5 py-5 sm:px-8">
          <div className="lg:hidden"><Logo /></div>
          <Link to="/" className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primary-700">
            <ArrowLeft className="h-4 w-4" /> Retour au site
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 pb-10 sm:px-8">
          <div className={wide ? 'w-full max-w-xl' : 'w-full max-w-md'}>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
            {subtitle && <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>}
            <div className="mt-7">{children}</div>
            {footer && <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
