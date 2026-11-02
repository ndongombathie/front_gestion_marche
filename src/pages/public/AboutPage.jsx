import { Link } from 'react-router-dom'
import { ArrowRight, BadgeCheck, Building2, Eye, FileCheck2, Handshake, Scale, ShieldCheck, Target, Users } from 'lucide-react'
import { Card } from '../../components/ui'

const VALUES = [
  { icon: Scale, title: 'Équité', text: 'Les mêmes règles et les mêmes informations pour tous les candidats, à chaque étape.' },
  { icon: Eye, title: 'Transparence', text: 'Chaque décision est motivée, horodatée et consultable par les parties concernées.' },
  { icon: ShieldCheck, title: 'Traçabilité', text: 'Un journal d’audit conserve l’ensemble des actions réalisées sur la plateforme.' },
  { icon: BadgeCheck, title: 'Efficacité', text: 'Des circuits de validation courts et des tableaux de bord pour piloter les délais.' },
]

export default function AboutPage() {
  return (
    <div>
      <section className="bg-primary-950 py-16 text-white sm:py-20">
        <div className="container-page">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-primary-100">
            <Building2 className="h-3.5 w-3.5 text-amber-300" /> À propos de MarchéPro
          </span>
          <h1 className="mt-5 max-w-3xl font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Une commande publique plus simple, plus juste, plus rapide.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-primary-100/80">
            MarchéPro est la plateforme de gestion des marchés publics de matériels et d’équipements. Elle relie les
            services demandeurs, les commissions d’évaluation, la direction et les fournisseurs autour d’un processus unique
            et dématérialisé.
          </p>
        </div>
      </section>

      <section className="container-page py-14 sm:py-16">
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-6 lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">Notre mission</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-slate-900">Sécuriser chaque étape du cycle de vie du marché</h2>
            <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
              <p>
                De l’expression du besoin à la réception des livraisons, la plateforme structure le travail des équipes et
                garantit que chaque marché respecte les règles de publicité, de mise en concurrence et de contrôle.
              </p>
              <p>
                Les fournisseurs disposent d’un espace unique pour consulter les opportunités, déposer leurs offres, suivre
                leurs marchés et planifier leurs livraisons. L’administration pilote l’ensemble depuis des tableaux de bord
                consolidés.
              </p>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ['5 rôles', 'Séparation claire des responsabilités'],
                ['100 % en ligne', 'Zéro dossier papier'],
                ['FCFA', 'Montants et budgets centralisés'],
              ].map(([t, d]) => (
                <div key={t} className="rounded-xl bg-sand-50 p-3.5">
                  <p className="font-display text-lg font-bold text-slate-900">{t}</p>
                  <p className="text-xs text-slate-500">{d}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-primary-800 to-primary-950 p-6 text-white">
            <Target className="h-7 w-7 text-amber-300" />
            <h3 className="mt-4 font-display text-xl font-bold">Notre ambition</h3>
            <p className="mt-2 text-sm leading-6 text-primary-100/80">
              Faire de la passation des marchés un levier de confiance entre l’administration et le secteur privé, en
              réduisant les délais et les risques de contestation.
            </p>
            <Link to="/opportunites" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-primary-900 transition hover:bg-primary-50">
              Explorer les opportunités <ArrowRight className="h-4 w-4" />
            </Link>
          </Card>
        </div>
      </section>

      <section className="bg-white py-14 sm:py-16">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">Nos valeurs</p>
            <h2 className="section-title mt-1">Les principes qui guident la plateforme</h2>
          </div>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <Card key={v.title} className="p-5">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-50 text-primary-700"><v.icon className="h-5 w-5" /></span>
                <h3 className="mt-4 font-display text-base font-bold text-slate-900">{v.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-500">{v.text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-14 sm:py-16">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h3 className="flex items-center gap-2 font-display text-xl font-bold text-slate-900"><Handshake className="h-5 w-5 text-primary-600" /> Pour l’administration</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              {['Centraliser les besoins et les marchés', 'Automatiser les circuits de validation', 'Piloter les délais et les livraisons', 'Produire des rapports et exports en un clic'].map((t) => (
                <li key={t} className="flex items-start gap-2"><FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" /> {t}</li>
              ))}
            </ul>
          </Card>
          <Card className="p-6">
            <h3 className="flex items-center gap-2 font-display text-xl font-bold text-slate-900"><Users className="h-5 w-5 text-primary-600" /> Pour les fournisseurs</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              {['Accéder à toutes les consultations publiées', 'Déposer et suivre ses offres en ligne', 'Suivre ses marchés et livraisons', 'Recevoir des notifications à chaque étape'].map((t) => (
                <li key={t} className="flex items-start gap-2"><FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" /> {t}</li>
              ))}
            </ul>
          </Card>
        </div>
      </section>
    </div>
  )
}
