import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-sand-50 px-4">
      <div className="text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary-50 text-primary-700">
          <Compass className="h-8 w-8" />
        </span>
        <p className="mt-6 font-display text-6xl font-extrabold text-primary-900">404</p>
        <h1 className="mt-2 font-display text-2xl font-bold text-slate-900">Page introuvable</h1>
        <p className="mt-2 text-sm text-slate-500">La page que vous recherchez n’existe pas ou a été déplacée.</p>
        <Link to="/" className="btn-primary mt-6">Retour à l’accueil</Link>
      </div>
    </div>
  )
}
