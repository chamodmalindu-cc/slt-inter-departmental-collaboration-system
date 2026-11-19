import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  MessageSquare,
  Bell,
  BarChart3,
  Users,
  ShieldAlert,
  User,
  UserCheck,
  ClipboardCheck,
  LogOut,
  X
} from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface MenuItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles?: string[]
}

const MENU_ITEMS: MenuItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Proposals', href: '/proposals', icon: FileText },
  { label: 'Assignment Desk', href: '/assignments/manage', icon: UserCheck, roles: ['ADMIN', 'DGM'] },
  { label: 'My Assignments', href: '/assignments', icon: ClipboardCheck, roles: ['ADMIN', 'DIGITAL_LAB_USER'] },
  { label: 'Projects', href: '/projects', icon: FolderKanban },
  { label: 'Messages', href: '/messages', icon: MessageSquare },
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'Reports', href: '/reports', icon: BarChart3, roles: ['ADMIN', 'DGM', 'HIGHER_MANAGEMENT'] },
  { label: 'User Management', href: '/users', icon: Users, roles: ['ADMIN'] },
  { label: 'Audit Logs', href: '/audit-logs', icon: ShieldAlert, roles: ['ADMIN'] },
  { label: 'Profile', href: '/profile', icon: User },
]

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout, hasRole } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  if (!user) return null

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const visibleMenuItems = MENU_ITEMS.filter(item => {
    if (!item.roles || item.roles.length === 0) return true
    return hasRole(...item.roles)
  })

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-200 ease-in-out border-r border-slate-800 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80 bg-slate-950/40">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-sm tracking-wider shadow-md shadow-blue-900/40 border border-blue-400/30">
              SLT
            </div>
            <div>
              <p className="text-sm font-bold text-white tracking-tight leading-none">Collaboration</p>
              <p className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase mt-1">Inter-Dept Hub</p>
            </div>
          </Link>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card in Sidebar */}
        <div className="p-4 mx-3 my-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow">
              {user.fullName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{user.fullName}</p>
              <p className="text-[11px] text-blue-400 truncate font-mono">
                {user.roles[0]?.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
          {user.isDemoAccount && (
            <div className="mt-2.5 pt-2 border-t border-slate-700/50 flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Demo Test User
              </span>
              <span className="text-[10px] text-slate-400">{user.departmentCode}</span>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Navigation
          </p>
          {visibleMenuItems.map(item => {
            const Icon = item.icon
            const isActive = location.pathname === item.href

            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </div>

        {/* Footer Logout */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/20">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/50 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  )
}
