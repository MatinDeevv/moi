import type { Metadata } from 'next'
import './globals.css'
import { ModeProvider } from './contexts/ModeContext'
import AppNavigation from './components/AppNavigation'

export const metadata: Metadata = {
  title: 'Project ME',
  description: 'Personal AI workstation - run tasks, manage files, execute commands',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-[#020617] text-gray-200 antialiased">
        <ModeProvider>
          <div className="min-h-screen flex flex-col">
            {/* Top Navigation */}
            <AppNavigation />

            {/* Main Content */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
              {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-800 bg-[#0b1120] py-4 mt-12">
              <div className="max-w-7xl mx-auto px-6 text-center text-gray-500 text-sm">
                Project ME • Personal AI Workstation
              </div>
            </footer>
          </div>
        </ModeProvider>
      </body>
    </html>
  )
}


