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

Make a YEAR-BY-YEAR roadmap for this student.

Student profile:
- grade: ${studentProfile.grade || "unknown"}
- liked classes/clubs: ${studentProfile.liked_classes_clubs || "unknown"}
- strengths: ${studentProfile.strengths || "unknown"}
- post-HS preference: ${studentProfile.post_hs_preference || "unknown"}
- priority: ${studentProfile.priority || "unknown"}
- wildcard: ${studentProfile.wildcard || "unknown"}

Target career: ${career.title || career}

Rules:
- Start from the student's current level (use the grade string as-is).
- Go forward chronologically until they reach their first full-time role in this career.
- Include concrete actions (courses, clubs, projects, applications).
- If they are already in college, skip high school years.
- RETURN ONLY JSON. NO markdown. NO backticks.
- Use this exact shape:

{
  "career_title": "string",
  "start_from": "string",
  "years": [
    {
      "label": "string",
      "courses": ["string"],
      "extracurriculars": ["string"],
      "projects": ["string"],
      "applications": ["string"],
      "notes": "string"
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

