import { Link } from 'react-router-dom'
import {
  Users,
  FolderKanban,
  Building2,
  ShieldAlert,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react'
import type { AdminDashboardData } from '../../types/auth'

interface AdminViewProps {
  data: AdminDashboardData | null
  loading: boolean
}

export default function AdminDashboardView({ data, loading }: AdminViewProps) {
  if (loading && !data) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-500">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-semibold">Loading Admin Dashboard...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
              System Administration
            </span>
            <span className="text-xs text-slate-500">• Full Access</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">Admin Control Center</h1>
          <p className="text-xs text-slate-500">
            System overview, user governance, audit trail verification and system services.
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2">
          <Link
            to="/users"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Manage Users</span>
          </Link>
          <Link
            to="/audit-logs"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
            <span>Audit Logs</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Accounts</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
            {data?.totalUsers ?? 5}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-600 font-semibold">
            <CheckCircle2 className="w-3 h-3" />
            <span>5 System Roles Active</span>
          </div>
        </div>

        {/* Total Projects */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Projects</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
            {data?.totalProjects ?? 0}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-blue-600 font-semibold">
            <span>Database Records Active</span>
          </div>
        </div>

        {/* Departments */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Departments</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
            {data?.totalDepartments ?? 6}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500 font-medium">
            <span>SLT Cross-Departmental</span>
          </div>
        </div>

        {/* Audit Logs */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Audit Events</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
            {data?.totalAuditLogs ?? 0}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-amber-700 font-semibold">
            <ShieldCheck className="w-3 h-3" />
            <span>Immutable DB Logging</span>
          </div>
        </div>
      </div>

      {/* Middle Section: Recent Activity & Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Audit Activities (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent System Activity</h2>
              <p className="text-[11px] text-slate-500">Live operational & security audit logs</p>
            </div>
            <Link
              to="/audit-logs"
              className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {data?.recentActivities && data.recentActivities.length > 0 ? (
              data.recentActivities.map(act => (
                <div key={act.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg shrink-0 mt-0.5 flex items-center justify-center text-xs font-bold ${
                        act.type === 'warning'
                          ? 'bg-rose-100 text-rose-700'
                          : act.type === 'success'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {act.action.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{act.title}</p>
                      <p className="text-[11px] text-slate-500">
                        Initiated by <span className="font-semibold text-slate-700">{act.userFullName}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No system events logged yet.</p>
            )}
          </div>
        </div>

        {/* Administration Shortcuts & Platform Status */}
        <div className="space-y-4">
          {/* Quick Management Shortcuts */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Administrative Shortcuts</h2>
            <p className="text-[11px] text-slate-500 mb-3">Key system modules</p>

            <div className="space-y-2">
              <Link
                to="/users"
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition text-xs font-semibold text-slate-800"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-blue-700" />
                  <span>User Accounts & RBAC Roles</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <Link
                to="/projects"
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition text-xs font-semibold text-slate-800"
              >
                <div className="flex items-center gap-2.5">
                  <FolderKanban className="w-4 h-4 text-purple-700" />
                  <span>All Projects Directory</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <Link
                to="/audit-logs"
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition text-xs font-semibold text-slate-800"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-amber-700" />
                  <span>Security & Audit Trails</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <Link
                to="/health"
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition text-xs font-semibold text-slate-800"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-700" />
                  <span>System Diagnostics & DB</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          </div>

          {/* Operational Status */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Security Architecture</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <p className="text-sm font-bold text-white">JWT + PBKDF2 + PostgreSQL</p>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              SLT Active Directory integration interface is prepared under IAuthService for production rollout.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
