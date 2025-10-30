'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('signup')
  const [message, setMessage] = useState('')

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMessage('Check your email for confirmation link!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        setMessage('Logged in successfully!')
      }
    } catch (err: any) {
      setMessage(err.message)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl mb-4">{mode === 'signup' ? 'Sign Up' : 'Log In'}</h1>
      <form onSubmit={handleAuth} className="flex flex-col gap-2 w-64">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <button type="submit" className="bg-blue-500 text-white rounded p-2">
          {mode === 'signup' ? 'Sign Up' : 'Log In'}
        </button>
      </form>
      <p className="mt-2 text-sm">
        {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
          className="underline"
        >
          {mode === 'signup' ? 'Log in' : 'Sign up'}
        </button>
      </p>
      {message && <p className="mt-4 text-red-500">{message}</p>}
    </div>
  )
}
