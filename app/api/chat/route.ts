import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

const KAI_STEPS = [
  "yo 👋 I’m Kai. what grade are you in?",
  "what classes/clubs u actually like?",
  "what are u good at — math, writing, people stuff, hands-on?",
  "u thinking college, trade, military, or idk?",
  "how important is $$ vs doing something fun?",
  "any random thing u wanna try? (dj, youtuber, tattoo, music)"
]

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { message, session_id, access_token } = body

  // 1) get user from token
  const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${access_token}` } }
  })
  const {
    data: { user },
  } = await authSupabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'not authenticated' }, { status: 401 })
  }

  // 2) load or create session
  let session = null
  if (session_id) {
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .maybeSingle()
    session = data
  }

  if (!session) {
    // create new session at state 0 with empty messages
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        messages: [{ role: 'user', content: message }],
        current_state: 1,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      reply: KAI_STEPS[0],
      next_state: 1,
      session_id: data.id,
    })
  }

  // 3) we have a session, advance state
  const currentState = session.current_state ?? 0
  const messages = Array.isArray(session.messages) ? session.messages : []

  const updatedMessages = [...messages, { role: 'user', content: message }]

  // if we reached step 6 → return fake 3-career plan for now
  if (currentState >= 6) {
    const fallbackPlan = {
      careers: [
        {
          title: 'Software Developer',
          category: 'academic',
          why: 'you said you like tech / problem-solving',
          path: 'BS in CS or IT, build projects, apply to internships',
          example_programs: ['Virginia Tech CS', 'GMU CS'],
        },
        {
          title: 'Electrician',
          category: 'trade',
          why: 'hands-on, solid pay, shorter school',
          path: 'apprenticeship + cert at local CC',
          example_programs: ['local community college'],
        },
        {
          title: 'DJ / Music Tech',
          category: 'creative',
          why: 'you said you like music / events',
          path: 'learn mixes, post on TikTok, do school events',
          example_programs: [],
        },
      ],
    }

    // save to career_plans
    await supabase.from('career_plans').insert({
      user_id: user.id,
      plan_json: fallbackPlan,
    })

    return NextResponse.json({
      reply: "ok based on what u said, here’s 3 paths you could actually do 👇",
      plan: fallbackPlan,
      next_state: 7,
      session_id: session.id,
    })
  }

  // otherwise, advance to next Kai question
  const nextState = currentState + 1
  const kaiReply = KAI_STEPS[currentState] // current state says which question to ask now

  // update session
  await supabase
    .from('sessions')
    .update({
      messages: updatedMessages,
      current_state: nextState,
    })
    .eq('id', session.id)
    .eq('user_id', user.id)

  return NextResponse.json({
    reply: kaiReply,
    next_state: nextState,
    session_id: session.id,
  })
}
