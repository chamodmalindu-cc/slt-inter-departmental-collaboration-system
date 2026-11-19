import { useState } from 'react'
import Sidebar from './Sidebar'
import TopNavbar from './TopNavbar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area (shifted on desktop for fixed sidebar) */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0 transition-all">
        {/* Top Header Navbar */}
        <TopNavbar onToggleSidebar={() => setSidebarOpen(prev => !prev)} />

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200/80 bg-white py-4 px-6 mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <p>
              © {new Date().getFullYear()} Sri Lanka Telecom (SLT) PLC. All rights reserved.
            </p>
            <p className="text-[11px] text-slate-400">
              Inter-Departmental Project Communication & Collaboration System
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
