'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function PlansPage() {
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPlans() {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('career_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) console.error(error)
      setPlans(data || [])
      setLoading(false)
    }
    loadPlans()
  }, [])

  if (loading) return <p className="text-center mt-10">Loading...</p>

  if (plans.length === 0)
    return <p className="text-center mt-10">No saved career plans yet.</p>

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl mb-4 font-semibold">Your Career Plans</h1>
      {plans.map((p) => (
        <div key={p.id} className="border rounded p-4 mb-4 bg-white">
          <div className="space-y-2">
            {p.plan_json?.careers?.map((c: any, idx: number) => (
                <div key={idx} className="border rounded p-2">
                <p className="font-semibold">{c.title} <span className="text-xs text-gray-500">({c.category})</span></p>
                <p className="text-sm text-gray-700">{c.why}</p>
                <p className="text-xs text-gray-500">Path: {c.path}</p>
                </div>
            ))}
            </div>

          <p className="text-gray-500 text-xs mt-2">
            Saved on {new Date(p.created_at).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  )
}
