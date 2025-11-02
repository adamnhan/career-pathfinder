// app/api/detailed_plan/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const { studentProfile, career } = await req.json();

  if (!studentProfile || !career) {
    return NextResponse.json(
      { error: "studentProfile and career are required" },
      { status: 400 }
    );
  }

  const prompt = `
You are Kai, an AI career planner.

Create a realistic, step-by-step roadmap for this student.

Student profile:
- grade: ${studentProfile.grade || "unknown"}
- liked classes/clubs: ${studentProfile.liked_classes_clubs || "unknown"}
- strengths: ${studentProfile.strengths || "unknown"}
- post-HS preference: ${studentProfile.post_hs_preference || "unknown"}
- priority: ${studentProfile.priority || "unknown"}
- wildcard: ${studentProfile.wildcard || "unknown"}
- location (if known): ${studentProfile.location || "unknown"}

Target career: ${career.title || career}

Requirements:
1. Start from the student's current level (use the grade string exactly).
2. First give YEAR-level structure (zoomed out).
3. Inside each year, give MONTH-level actions (zoomed in) for at least the next 6–12 months.
4. For each action, say how hard it is so the user can adjust it later.
5. Suggest 3–5 colleges/programs that match the career and the student's preferences. Label each as reach / target / safety and say why.
6. Mark which actions are good to "add to calendar" (deadlines, apps, tests).
7. If the student is already in college, skip high school years.

Return ONLY JSON in this exact shape:

{
  "career_title": "string",
  "start_from": "string",
  "college_targets": [
    {
      "name": "string",
      "type": "reach | target | safety",
      "why": "string"
    }
  ],
  "years": [
    {
      "label": "string",
      "milestones": ["string"],
      "months": [
        {
          "label": "string",
          "actions": [
            {
              "title": "string",
              "reason": "string",
              "difficulty": "low | medium | high",
              "calendar_suggested": true
            }
          ]
        }
      ]
    }
  ]
}
  `.trim();

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are Kai, an AI career planner." },
      { role: "user", content: prompt },
    ],
    temperature: 0.6,
  });

  const content = completion.choices[0]?.message?.content || "{}";
  const plan = JSON.parse(content);

  return NextResponse.json({ plan });
}
