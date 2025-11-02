// grade ← messages[1]

// liked_classes_clubs ← messages[2]

// strengths ← messages[3]

// post_hs_preference ← messages[4]

// priority ← messages[5]

// wildcard ← messages[6]

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const openaiApiKey = process.env.OPENAI_API_KEY
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null
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

function normalizePlan(plan: any) {
  if (!plan || !Array.isArray(plan.careers)) return plan

  return {
    careers: plan.careers.map((c: any) => ({
      title: c.title ?? "",
      // model name → old name
      why: c.why_matched ?? c.why ?? "",
      path: c.path ?? "",
      example_programs: c.alt_programs ?? c.example_programs ?? [],
      difficulty: c.difficulty ?? "medium",
      category: c.category ?? undefined,
    })),
  }
}


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
    const msgs = Array.isArray(session.messages) ? session.messages : []

    const studentProfile = {
      grade: msgs[1]?.content || "",
      liked_classes_clubs: msgs[2]?.content || "",
      strengths: msgs[3]?.content || "",
      post_hs_preference: msgs[4]?.content || "",
      priority: msgs[5]?.content || "",
      wildcard: msgs[6]?.content || "",
    }

    // old hardcoded plan as fallback
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

    let finalPlan = fallbackPlan

    if (!openai) {
      // no API key in env → just return fallback
      await supabase.from('career_plans').insert({
        user_id: user.id,
        plan_json: finalPlan,
        student_profile: studentProfile,
      })

      return NextResponse.json({
        reply: "ok based on what u said, here’s 3 paths you could actually do 👇",
        plan: finalPlan,
        next_state: 7,
        session_id: session.id,
      })
    }

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are Kai, a casual, friendly high school career guide. You ALWAYS return valid JSON. You ALWAYS return exactly 3 options in a `careers` array. You prioritize realistic, low-cost, local, or trade options when the student is unsure.",
          },
          {
            role: "system",
            content:
              "Output schema:\n{\n  \"careers\": [\n    {\n      \"title\": \"string\",\n      \"why_matched\": \"string\",\n      \"path\": \"string\",\n      \"alt_programs\": [\"string\"],\n      \"difficulty\": \"easy\" | \"medium\" | \"stretch\"\n    }\n  ]\n}",
          },
          {
            role: "user",
            content: "Student profile:\n" + JSON.stringify(studentProfile, null, 2),
          },
          {
            role: "user",
            content:
              "Generate 3 options. Make each one traceable to what the student said. If the student said 'music' or 'DJ', include one creative path. If the student said 'money' or 'trade', include at least one trade/licensed path. Return JSON only.",
          },
        ],
      })

      const raw = completion.choices[0]?.message?.content
      console.log("[kai][openai][raw]", raw)
      console.log("[kai][openai][studentProfile]", studentProfile)

      if (raw) {
        const parsed = JSON.parse(raw)
        // normalize a bit in case model used our new keys
        finalPlan = normalizePlan(parsed)
        console.log("[kai][openai][normalized]", finalPlan)
      }
    } catch (err) {
      console.error("openai error:", err)
      // keep fallbackPlan
    }

    // save to career_plans (same as before)
    await supabase.from('career_plans').insert({
      user_id: user.id,
      plan_json: finalPlan,
      student_profile: studentProfile,
    })

    return NextResponse.json({
      reply: "ok based on what u said, here’s 3 paths you could actually do 👇",
      plan: finalPlan,
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
