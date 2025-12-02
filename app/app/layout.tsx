import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'Project ME v0.2',
  description: 'Local automation & orchestration dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased">
        <div className="min-h-screen flex flex-col">
          {/* Top Navigation */}
          <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
            <div className="max-w-7xl mx-auto px-6">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center space-x-8">
                  <Link href="/" className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">ME</span>
                    </div>
                    <div>
                      <h1 className="text-lg font-bold text-slate-100">
                        Project ME
                      </h1>
                      <p className="text-xs text-slate-400">v0.2</p>
                    </div>
                  </Link>

                  <nav className="hidden md:flex space-x-1">
                    <NavLink href="/" label="Tasks" icon="📋" />
                    <NavLink href="/sandbox" label="Sandbox" icon="📁" />
                  </nav>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-slate-800 bg-slate-900 mt-12">
            <div className="max-w-7xl mx-auto px-6 py-4 text-center text-slate-500 text-sm">
              Powered by Project ME • {new Date().getFullYear()}
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}

function NavLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link
      href={href}
      className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition-colors flex items-center space-x-2"
    >
      <span>{icon}</span>
      <span>{label}</span>
    </Link>
  )
}

