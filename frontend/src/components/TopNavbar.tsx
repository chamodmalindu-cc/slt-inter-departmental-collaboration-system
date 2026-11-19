import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Menu,
  Bell,
  ChevronDown,
  User,
  LogOut,
  Shield,
  Activity,
  Layers
} from 'lucide-react'

interface TopNavbarProps {
  onToggleSidebar: () => void
}

function getRoleBadge(roles: string[]): { text: string; className: string } {
  if (roles.includes('ADMIN')) {
    return { text: 'Admin', className: 'bg-red-50 text-red-700 border-red-200' }
  }
  if (roles.includes('DGM')) {
    return { text: 'DGM', className: 'bg-purple-50 text-purple-700 border-purple-200' }
  }
  if (roles.includes('HIGHER_MANAGEMENT')) {
    return { text: 'Higher Mgmt', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
  }
  if (roles.includes('DIGITAL_LAB_USER')) {
    return { text: 'Digital Lab', className: 'bg-blue-50 text-blue-700 border-blue-200' }
  }
  return { text: 'Non-Digital Lab', className: 'bg-teal-50 text-teal-700 border-teal-200' }
}

export default function TopNavbar({ onToggleSidebar }: TopNavbarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  if (!user) return null

  const roleBadge = getRoleBadge(user.roles)

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 shadow-xs">
      {/* Left: Mobile Sidebar Toggle & Page Title Indicator */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden transition"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-900">Sri Lanka Telecom PLC</span>
          <span>•</span>
          <span className="flex items-center gap-1 text-blue-700 font-medium">
            <Layers className="w-3.5 h-3.5" /> Inter-Department Collaboration Hub
          </span>
        </div>
      </div>

      {/* Right: Quick actions, notifications, user dropdown */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* System Health Quick Link */}
        <Link
          to="/health"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition border border-slate-200/80"
          title="System Health & Connectivity"
        >
          <Activity className="w-3.5 h-3.5 text-emerald-600" />
          <span>Health</span>
        </Link>

        {/* Notifications Icon (Phase 04 Link) */}
        <Link
          to="/notifications"
          className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white"></span>
        </Link>

        {/* User Profile Dropdown Button */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(prev => !prev)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {user.fullName.charAt(0)}
            </div>
            <div className="hidden sm:block text-left">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-slate-900 leading-none">{user.fullName.split(' ')[0]}</p>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm border ${roleBadge.className}`}>
                  {roleBadge.text}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[130px]">{user.departmentName}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 z-40 py-2 divide-y divide-slate-100 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-3">
                  <p className="text-xs font-bold text-slate-900">{user.fullName}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm border ${roleBadge.className}`}>
                      {user.roles.join(', ')}
                    </span>
                    {user.isDemoAccount && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                        <Shield className="w-2.5 h-2.5" /> Demo
                      </span>
                    )}
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>My Profile</span>
                  </Link>
                  <Link
                    to="/health"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <Activity className="w-3.5 h-3.5 text-slate-400" />
                    <span>System Health</span>
                  </Link>
                </div>

                <div className="pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition text-left cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
