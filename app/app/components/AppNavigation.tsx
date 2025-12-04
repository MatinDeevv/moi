'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMode } from '../contexts/ModeContext';

export default function AppNavigation() {
  const pathname = usePathname();
  const { mode, setMode, isDevMode } = useMode();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊', alwaysShow: true },
    { href: '/', label: 'Tasks', icon: '📋', alwaysShow: true },
    { href: '/sandbox', label: 'Sandbox', icon: '📁', devOnly: false },
    { href: '/browse', label: 'Browse', icon: '🔍', devOnly: true },
    { href: '/shell', label: 'Shell', icon: '⚡', devOnly: true },
    { href: '/settings', label: 'Settings', icon: '⚙️', devOnly: false },
  ];

  const visibleItems = navItems.filter(item =>
    item.alwaysShow || !item.devOnly || isDevMode
  );

  return (
    <header className="bg-[#0b1120] border-b border-gray-800 sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">ME</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-100">Project ME</h1>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {visibleItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2
                  ${pathname === item.href
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  }
                `}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Mode Toggle */}
          <div className="flex items-center space-x-3">
            <div className="flex bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setMode('personal')}
                className={`
                  px-3 py-1.5 text-xs font-medium rounded-md transition-all
                  ${mode === 'personal'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                  }
                `}
              >
                Personal
              </button>
              <button
                onClick={() => setMode('dev')}
                className={`
                  px-3 py-1.5 text-xs font-medium rounded-md transition-all
                  ${mode === 'dev'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                  }
                `}
              >
                Dev
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

