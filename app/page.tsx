import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-6rem)] flex-col items-center justify-center text-center">
      <h1 className="text-4xl sm:text-5xl font-semibold mb-4">
        Welcome to <span className="text-indigo-400">Kai</span>
      </h1>

      <p className="max-w-lg text-slate-400 mb-10">
        Your personal AI career mentor.  
        Chat with Kai to explore paths that match your strengths, interests, and goals.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/chat"
          className="rounded-md bg-indigo-500 px-6 py-3 font-medium text-white hover:bg-indigo-600 transition"
        >
          Chat with Kai
        </Link>

        <Link
          href="/plans"
          className="rounded-md border border-slate-700 px-6 py-3 font-medium text-slate-200 hover:bg-slate-800 transition"
        >
          View My Plans
        </Link>
      </div>

      <div className="mt-12 text-sm text-slate-500">
        Built to help students discover their next step 🚀
      </div>
    </div>
  )
}
