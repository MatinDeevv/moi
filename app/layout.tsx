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
      <body className="bg-white text-gray-900 antialiased">
        <div className="min-h-screen">
          <header className="bg-gradient-to-r from-blue-600 to-indigo-600 border-b border-blue-700 shadow-lg">
            <div className="container mx-auto px-6 py-5">
              <h1 className="text-3xl font-bold text-white">
                Project ME v0.2
              </h1>
              <p className="text-blue-100 text-sm mt-1">
                Local Automation & Orchestration Dashboard
              </p>
            </div>
          </header>
          <main className="container mx-auto px-6 py-8">
            {children}
          </main>
          <footer className="border-t border-gray-200 bg-gray-50 mt-12">
            <div className="container mx-auto px-6 py-4 text-center text-gray-600 text-sm">
              MartinDB-powered • Next.js API Routes • {new Date().getFullYear()}
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}

