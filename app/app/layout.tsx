import type { Metadata } from 'next'
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
      <body className="bg-gray-50 text-gray-900">
        <div className="min-h-screen">
          <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
            <div className="container mx-auto px-6 py-4">
              <h1 className="text-3xl font-bold">Project ME v0.2</h1>
              <p className="text-blue-100 text-sm mt-1">
                Local Automation & Orchestration Dashboard
              </p>
            </div>
          </header>
          <main className="container mx-auto px-6 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}

