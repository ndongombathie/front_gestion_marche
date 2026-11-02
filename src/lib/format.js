import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

const money = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0,
})

export function fcfa(value) {
  if (value === null || value === undefined || value === '') return '—'
  const n = Number(value)
  if (Number.isNaN(n)) return '—'
  return `${money.format(n)} FCFA`
}

export function compact(value) {
  if (value === null || value === undefined) return '—'
  const n = Number(value)
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace('.0', '')} Md`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')} M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} K`
  return String(n)
}

export function dateLong(value) {
  if (!value) return '—'
  const d = toDate(value)
  return isValid(d) ? format(d, 'dd MMMM yyyy', { locale: fr }) : '—'
}

export function dateShort(value) {
  if (!value) return '—'
  const d = toDate(value)
  return isValid(d) ? format(d, 'dd/MM/yyyy', { locale: fr }) : '—'
}

export function dateTime(value) {
  if (!value) return '—'
  const d = toDate(value)
  return isValid(d) ? format(d, 'dd/MM/yyyy à HH:mm', { locale: fr }) : '—'
}

export function relative(value) {
  if (!value) return '—'
  const d = toDate(value)
  return isValid(d) ? formatDistanceToNow(d, { addSuffix: true, locale: fr }) : '—'
}

export function toDate(value) {
  if (!value) return new Date(NaN)
  return typeof value === 'string' ? parseISO(value) : new Date(value)
}

export function daysLeft(value) {
  if (!value) return null
  const diff = toDate(value).getTime() - Date.now()
  return Math.ceil(diff / 86400000)
}

export function humanize(value) {
  if (!value) return '—'
  return String(value)
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

export const STATUT_TONES = {
  BROUILLON: 'slate',
  SOUMISE: 'blue',
  EN_VALIDATION: 'amber',
  VALIDEE: 'emerald',
  REJETEE: 'rose',
  EN_PREPARATION: 'slate',
  PUBLIE: 'blue',
  EN_EVALUATION: 'violet',
  ATTRIBUE: 'emerald',
  EN_EXECUTION: 'cyan',
  CLOTURE: 'slate',
  ANNULE: 'rose',
  CLOTUREE: 'slate',
  EN_ATTENTE: 'amber',
  VALIDE: 'emerald',
  REFUSE: 'rose',
  PLANIFIEE: 'blue',
  EN_COURS: 'amber',
  LIVREE: 'emerald',
  EN_RETARD: 'rose',
  RECEPTIONNEE: 'emerald',
  ACCEPTEE: 'emerald',
  ACCEPTEE_AVEC_RESERVES: 'amber',
  PROPOSEE: 'amber',
  RETENUE: 'emerald',
  NON_RETENUE: 'rose',
  DISQUALIFIEE: 'rose',
  EVALUEE: 'violet',
  ACTIF: 'emerald',
  INACTIF: 'slate',
  SUSPENDU: 'rose',
}
