import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bot, Send, Sparkles, X } from 'lucide-react'
import clsx from 'clsx'
import { api, unwrap } from '../lib/api'
import { Spinner } from './ui'

const SUGGESTIONS = [
  'Quels sont les appels d’offres ouverts ?',
  'Où en est mon marché ?',
  'Quelles livraisons sont en retard ?',
  'Montre-moi les statistiques',
]

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: 'Bonjour ! Je suis l’assistant MarchéPro. Posez-moi une question sur les appels d’offres, vos marchés, livraisons ou statistiques.',
      results: [],
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open, loading])

  const send = async (text) => {
    const question = (text || input).trim()
    if (!question || loading) return
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text: question }])
    setLoading(true)
    try {
      const data = await unwrap(api.post('/chatbot', { question }))
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: data.reponse || 'Je n’ai pas trouvé de réponse.', results: data.resultats || [] },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: 'Désolé, une erreur est survenue. Réessayez dans un instant.', results: [] },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-primary-800 px-4 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-primary-900"
        >
          <Sparkles className="h-4 w-4 text-amber-300" /> Assistant
        </button>
      )}

      {open && (
        <div className="fixed bottom-4 right-4 z-40 flex h-[min(620px,calc(100vh-2rem))] w-[min(390px,calc(100vw-2rem))] animate-fade-up flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center gap-3 bg-gradient-to-r from-primary-900 to-primary-700 px-4 py-3.5 text-white">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white/15 ring-1 ring-white/25">
              <Bot className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold">Assistant MarchéPro</p>
              <p className="flex items-center gap-1.5 text-[11px] text-primary-100/80">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> En ligne
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-white/80 hover:bg-white/10">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-sand-50 px-4 py-4">
            {messages.map((m, i) => (
              <div key={i} className={clsx('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div
                  className={clsx(
                    'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-6',
                    m.role === 'user'
                      ? 'rounded-br-md bg-primary-700 text-white'
                      : 'rounded-bl-md border border-slate-200 bg-white text-slate-700',
                  )}
                >
                  <p className="whitespace-pre-line">{m.text}</p>
                  {m.results?.length > 0 && (
                    <div className="mt-2.5 space-y-1.5 border-t border-slate-100 pt-2.5">
                      {m.results.slice(0, 5).map((r, idx) => (
                        <Link
                          key={idx}
                          to={r.lien || '#'}
                          onClick={() => setOpen(false)}
                          className="block rounded-lg bg-slate-50 px-2.5 py-2 text-xs transition hover:bg-primary-50"
                        >
                          <span className="font-semibold text-slate-800">{r.titre}</span>
                          {r.detail && <span className="mt-0.5 block text-slate-500">{r.detail}</span>}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-3.5 py-3">
                  <Spinner className="h-4 w-4" />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-slate-100 bg-white px-3 pb-2 pt-2.5">
            <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="shrink-0 rounded-full border border-slate-200 px-2.5 py-1 text-[11px] text-slate-600 hover:border-primary-200 hover:bg-primary-50"
                >
                  {s}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                send()
              }}
              className="flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question…"
                className="input py-2 text-sm"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-700 text-white transition hover:bg-primary-800 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
