"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Message = {
  role: "user" | "kai";
  content: string;
};

type CareerPlan = {
  careers: {
    title: string;
    why?: string;
    path?: string;
    example_programs?: string[];
    difficulty?: string;
  }[];
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "kai", content: "yo 👋 I’m Kai. let’s figure out what you wanna do." },
  ]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<CareerPlan | null>(null);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    setLoading(true);

    // optimistic add user message
    setMessages((prev) => [...prev, { role: "user", content: input }]);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const access_token = session?.access_token;

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: input,
        session_id: sessionId,
        access_token,
      }),
    });

    const json = await res.json();

    if (json.error) {
      setMessages((prev) => [
        ...prev,
        { role: "kai", content: "hmm that didn’t work — try again in a sec 🫠" },
      ]);
      setLoading(false);
      setInput("");
      return;
    }

    // add Kai reply
    setMessages((prev) => [...prev, { role: "kai", content: json.reply }]);
    setSessionId(json.session_id);
    setInput("");
    setLoading(false);

    // if we got a plan, show it
    if (json.plan) {
      setPlan(json.plan);
    }
  }

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-6rem)]">
      <h1 className="text-2xl font-semibold text-slate-50">Chat with Kai</h1>
      <p className="text-sm text-slate-400">
        answer the 6 questions → get 3 tailored paths
      </p>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* chat box */}
        <div className="flex flex-col flex-1 border border-slate-800 rounded-xl bg-slate-950/40 backdrop-blur">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "kai"
                    ? "flex items-start gap-2"
                    : "flex items-start gap-2 justify-end"
                }
              >
                {m.role === "kai" ? (
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-500 text-xs font-bold">
                    K
                  </div>
                ) : null}
                <div
                    className={
                      m.role === "kai"
                        ? "bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 max-w-[75%]"
                        : "bg-indigo-500 rounded-xl px-3 py-2 text-sm text-white max-w-[75%]"
                    }
                  >
                    {m.content}
                  </div>
              </div>
            ))}

            {loading ? (
              <div className="flex items-center gap-2 text-xs text-slate-400 pt-2">
                <div className="h-2 w-2 rounded-full bg-slate-400 animate-pulse"></div>
                Kai is thinking…
              </div>
            ) : null}
          </div>

          {/* input */}
          <div className="border-t border-slate-800 p-3 flex gap-2">
            <input
              className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="type your answer..."
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/40 text-white text-sm px-4 rounded-lg"
            >
              Send
            </button>
          </div>
        </div>

        {/* plan panel */}
        <div className="w-80 border border-slate-800 rounded-xl bg-slate-950/40 p-4 space-y-3 overflow-y-auto">
          <h2 className="text-sm font-semibold text-slate-100 flex items-center justify-between">
            Your plan
            {plan ? (
              <span className="text-[10px] text-slate-500 uppercase tracking-wide">
                generated
              </span>
            ) : null}
          </h2>
          {!plan ? (
            <p className="text-xs text-slate-500">
              finish Kai’s questions to see your 3 paths.
            </p>
          ) : (
            <div className="space-y-3">
              {plan.careers?.map((c: any, idx: number) => (
                <div
                  key={idx}
                  className="rounded-lg bg-slate-900/40 border border-slate-800 p-3"
                >
                  <p className="text-sm font-medium text-slate-50 flex justify-between gap-2">
                    {c.title}
                    {c.difficulty ? (
                      <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full uppercase tracking-wide text-slate-300">
                        {c.difficulty}
                      </span>
                    ) : null}
                  </p>
                  {c.why ? (
                    <p className="text-xs text-slate-400 mt-1">{c.why}</p>
                  ) : null}
                  {c.path ? (
                    <p className="text-xs text-slate-300 mt-2">
                      <span className="text-slate-400">Next:</span> {c.path}
                    </p>
                  ) : null}
                  {Array.isArray(c.example_programs) &&
                  c.example_programs.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {c.example_programs.map((p: string) => (
                        <span
                          key={p}
                          className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-200"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
