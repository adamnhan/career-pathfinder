"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function PlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailedPlans, setDetailedPlans] = useState<Record<string, any>>({});
  const [loadingPlans, setLoadingPlans] = useState<Record<string, boolean>>({});

  
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


  type StudentProfile = {
    grade: string;
    liked_classes_clubs: string;
    strengths: string;
    post_hs_preference: string;
    priority: string;
    wildcard: string;
  };

  type Career = {
    title: string;
  };


  const handleGenerateDetailedPlan = async (career: any, studentProfile: any, planId: string) => {
    const key = `${planId}::${career.title}`;

    // set loading for this one card
    setLoadingPlans((prev) => ({ ...prev, [key]: true }));

    try {
      const res = await fetch("/api/detailed_plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ career, studentProfile }),
      });
      const data = await res.json();

      setDetailedPlans((prev) => ({
        ...prev,
        [key]: data.plan,
      }));
    } finally {
      // stop loading for this card
      setLoadingPlans((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleSendPlanToCalendar = (plan: any) => {
    console.log("🗓️ Sending this plan to calendar:", plan);

    // later: save this plan in state or Supabase so it can be viewed in /calendar
    // e.g. setSelectedCalendarPlan(plan)
  };


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
                        {profile.post_hs_preference || "—"} / {profile.priority || "—"}
                      </p>
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    {plan?.careers?.map((c: any, idx: number) => {
                      // ✅ now we can define helpers
                      const key = `${p.id}::${c.title}`;
                      const detailed = detailedPlans[key];
                      const isLoading = loadingPlans[key] === true;

                      return (
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

                          {/* button */}
                          {profile ? (
                            <button
                              onClick={() => handleGenerateDetailedPlan(c, profile, p.id)}
                              disabled={isLoading}
                              className="mt-3 text-xs bg-indigo-500/80 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-500 transition text-white px-3 py-2 rounded-md w-fit"
                            >
                              {isLoading ? "Generating..." : "✨ Generate detailed plan"}
                            </button>
                          ) : null}


                          {/* detailed plan renders UNDER the button */}
                          {detailed ? (
                            <div className="mt-3 space-y-2 text-xs bg-slate-950/40 border border-slate-800 rounded-md p-3">
                              {/* colleges */}
                              {Array.isArray(detailed.college_targets) && detailed.college_targets.length > 0 ? (
                                <div className="space-y-1">
                                  <p className="text-slate-200 font-medium">College targets</p>
                                  {detailed.college_targets.map((col: any) => (
                                    <div key={col.name || col.label} className="flex items-center gap-2 flex-wrap">
                                      <span className="text-slate-100">{col.name || "Unnamed program"}</span>
                                      {col.type ? (
                                        <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-200">
                                          {col.type}
                                        </span>
                                      ) : null}
                                      {col.why ? <span className="text-slate-400">— {col.why}</span> : null}
                                    </div>
                                  ))}
                                </div>
                              ) : null}

                              {/* years */}
                              {Array.isArray(detailed.years) && detailed.years.length > 0 ? (
                                detailed.years.map((y: any) => (
                                  <div key={y.label} className="space-y-1">
                                    <p className="text-slate-100">{y.label}</p>
                                    {y.milestones?.length ? (
                                      <ul className="list-disc list-inside text-slate-300 text-[11px]">
                                        {y.milestones.map((m: string) => (
                                          <li key={m}>{m}</li>
                                        ))}
                                      </ul>
                                    ) : null}
                                  </div>
                                ))
                              ) : (
                                <p className="text-slate-500">No timeline returned.</p>
                              )}

                              <button
                                onClick={() => handleSendPlanToCalendar(detailed)}
                                className="text-[10px] mt-2 px-2 py-1 rounded bg-indigo-500/70 text-white"
                              >
                                Add this plan to calendar
                              </button>
                              <p className="text-[10px] text-slate-400 mt-1 italic">
                                Happy with this overview? Add it to your calendar to see a more detailed version.
                              </p>
                            </div>
                          ) : null}

                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
  }