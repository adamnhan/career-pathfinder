import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import Link from "next/link"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Kai Career Planner",
  description: "Personalized career paths for students",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-slate-50`}
      >
        <div className="min-h-screen flex flex-col">
          {/* top nav */}
          <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
            <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
              <Link href="/" className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-md bg-indigo-500 flex items-center justify-center text-sm font-bold">
                  K
                </span>
                <span className="font-semibold tracking-tight">Kai</span>
                <span className="text-xs text-slate-400 hidden sm:inline">
                  career planner
                </span>
              </Link>

              <nav className="flex gap-1">
                <NavLink href="/">Dashboard</NavLink>
                <NavLink href="/chat">Chat</NavLink>
                <NavLink href="/plans">Plans</NavLink>
              </nav>
            </div>
          </header>

          {/* page content */}
          <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6">
            {children}
          </main>

          <footer className="py-4 text-center text-xs text-slate-500">
            Kai · built for students
          </footer>
        </div>
      </body>
    </html>
  )
}

// tiny helper so we can style active links later if we want
function NavLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-md text-sm text-slate-200 hover:bg-slate-800 transition"
    >
      {children}
    </Link>
  )
}
