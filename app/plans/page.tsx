"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function PlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  // later: const [isPro, setIsPro] = useState(false)

  useEffect(() => {
    async function loadPlans() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("career_plans")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) console.error(error);
      setPlans(data || []);
      setLoading(false);

      // later we can also fetch user profile here to see if is_pro
    }
    loadPlans();
  }, []);

  function handleDetailedPlan(planId: string) {
    // if (!isPro) ...
    setSelectedPlanId(planId);
    setShowUpgrade(true);
  }

  if (loading)
    return (
      <div className="flex h-[calc(100vh-6rem)] items-center justify-center text-slate-400">
        Loading plans…
      </div>
    );

  if (plans.length === 0)
    return (
      <div className="flex h-[calc(100vh-6rem)] items-center justify-center flex-col gap-2">
        <p className="text-slate-100 text-lg">No saved career plans yet.</p>
        <p className="text-slate-500 text-sm">
          Chat with Kai first to generate your first plan.
        </p>
      </div>
    );

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">Your career plans</h1>
          <p className="text-sm text-slate-400">
            every time you finish Kai’s questions, we save the plan here.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {plans.map((p) => {
            const plan = p.plan_json;
            const profile = p.student_profile;
            return (
              <div
                key={p.id}
                className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      {new Date(p.created_at).toLocaleString()}
                    </p>
                    {profile?.grade ? (
                      <span className="text-[10px] uppercase tracking-wide bg-slate-800 px-2 py-0.5 rounded-full text-slate-200">
                        {profile.grade}
                      </span>
                    ) : null}
                  </div>

                  {profile ? (
                    <div className="text-xs text-slate-400 space-y-1">
                      <p>
                        <span className="text-slate-500">Interests:</span>{" "}
                        {profile.liked_classes_clubs || "—"}
                      </p>
                      <p>
                        <span className="text-slate-500">Goal:</span>{" "}
                        {profile.post_hs_preference || "—"} /{" "}
                        {profile.priority || "—"}
                      </p>
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    {plan?.careers?.map((c: any, idx: number) => (
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
                            <span className="text-slate-500">Next:</span> {c.path}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleDetailedPlan(p.id)}
                  className="mt-3 text-xs bg-indigo-500/80 hover:bg-indigo-500 transition text-white px-3 py-2 rounded-md w-fit"
                >
                  ✨ Generate detailed plan
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* placeholder upgrade modal */}
      {showUpgrade ? (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-semibold text-slate-50">
              Kai Pro coming soon 🚀
            </h2>
            <p className="text-sm text-slate-300">
              Detailed, year-by-year roadmaps are part of the paid tier.
              You’ll get: high school course plan, clubs to join/start, college targets,
              and internship sequence for the career you pick.
            </p>
            <p className="text-xs text-slate-500">
              (you clicked plan #{selectedPlanId})
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowUpgrade(false)}
                className="px-3 py-1.5 text-sm rounded-md border border-slate-600 text-slate-200"
              >
                Close
              </button>
              <button
                onClick={() => setShowUpgrade(false)}
                className="px-3 py-1.5 text-sm rounded-md bg-indigo-500 text-white"
              >
                Notify me
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
