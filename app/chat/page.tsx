'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function ChatPage() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function sendMessage() {
    if (!input.trim()) return
    setLoading(true)

    const { data: { session } } = await supabase.auth.getSession()
    const access_token = session?.access_token

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: input,
        session_id: sessionId,
        access_token,
      }),
    })

    const json = await res.json()
    if (json.error) {
      alert(json.error)
      setLoading(false)
      return
    }

    setMessages((prev) => [...prev, { role: 'user', content: input }, { role: 'kai', content: json.reply }])
    setSessionId(json.session_id)
    setInput('')
    setLoading(false)

    if (json.plan) {
      setMessages((prev) => [...prev, { role: 'kai', content: JSON.stringify(json.plan, null, 2) }])
    }
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md border rounded p-4 space-y-2 overflow-y-auto h-[60vh] bg-white">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'kai' ? 'text-blue-600' : 'text-gray-800'}>
            <b>{m.role === 'kai' ? 'Kai:' : 'You:'}</b> {m.content}
          </div>
        ))}
      </div>
      <div className="flex mt-4 w-full max-w-md">
        <input
          className="flex-1 border p-2 rounded-l"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="type your message..."
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading} className="bg-blue-500 text-white px-4 rounded-r">
          Send
        </button>
      </div>
    </div>
  )
}
