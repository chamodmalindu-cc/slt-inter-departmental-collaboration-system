import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, LogOut, User, ChevronDown, Shield,
  Activity, Settings
} from 'lucide-react'
import { useState } from 'react'

function getRoleLabel(roles: string[]): string {
  if (roles.includes('ADMIN')) return 'Administrator'
  if (roles.includes('DGM')) return 'Deputy General Manager'
  if (roles.includes('HIGHER_MANAGEMENT')) return 'Higher Management'
  if (roles.includes('DIGITAL_LAB_USER')) return 'Digital Lab User'
  if (roles.includes('NON_DIGITAL_LAB_USER')) return 'Non-Digital Lab User'
  return roles[0] ?? 'User'
}

function getRoleBadgeStyle(roles: string[]): string {
  if (roles.includes('ADMIN')) return 'bg-red-100 text-red-700 border-red-200'
  if (roles.includes('DGM')) return 'bg-purple-100 text-purple-700 border-purple-200'
  if (roles.includes('HIGHER_MANAGEMENT')) return 'bg-indigo-100 text-indigo-700 border-indigo-200'
  if (roles.includes('DIGITAL_LAB_USER')) return 'bg-blue-100 text-blue-700 border-blue-200'
  return 'bg-teal-100 text-teal-700 border-teal-200'
}

export default function Navbar() {
  const { user, logout, hasRole } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  if (!user) return null

  const navLinks = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, show: true },
    { label: 'System Health', href: '/health', icon: Activity, show: true },
    { label: 'Admin Panel', href: '/admin', icon: Settings, show: hasRole('ADMIN') },
  ]

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            SLT
          </div>
          <span className="text-sm font-bold text-slate-900 hidden sm:block">
            Project Collaboration
          </span>
        </div>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.filter(l => l.show).map(link => {
            const Icon = link.icon
            const active = location.pathname === link.href
            return (
              <Link
                key={link.href}
                to={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition
                  ${active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* User menu */}
        <div className="relative flex items-center gap-2">
          {user.isDemoAccount && (
            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold
                             bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
              <Shield className="w-3 h-3" /> Demo
            </span>
          )}

          <button
            onClick={() => setUserMenuOpen(v => !v)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-100 transition"
          >
            <div className="w-7 h-7 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs font-bold">
              {user.fullName.charAt(0)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-900 leading-none">{user.fullName.split(' ')[0]}</p>
              <span className={`text-[10px] font-semibold px-1.5 py-0 rounded-full border ${getRoleBadgeStyle(user.roles)}`}>
                {getRoleLabel(user.roles)}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 py-1 overflow-hidden">
                {/* Profile header */}
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-bold text-slate-900">{user.fullName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{user.departmentName}</p>
                  <span className={`mt-1.5 inline-block text-xs font-semibold px-2 py-0.5 rounded-full border ${getRoleBadgeStyle(user.roles)}`}>
                    {getRoleLabel(user.roles)}
                  </span>
                </div>

                <Link
                  to="/profile"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  My Profile
                </Link>

                <div className="border-t border-slate-100 mt-1" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
