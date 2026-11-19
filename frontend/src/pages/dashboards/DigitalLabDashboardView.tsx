import { Link } from 'react-router-dom'
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  ClipboardCheck,
  ArrowRight,
  TrendingUp,
  Cpu
} from 'lucide-react'
import type { DigitalLabDashboardData } from '../../types/auth'

interface DigitalLabProps {
  data: DigitalLabDashboardData | null
  loading: boolean
}

export default function DigitalLabDashboardView({ data, loading }: DigitalLabProps) {
  if (loading && !data) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-500">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-semibold">Loading Digital Lab Workspace...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
              Digital Lab Team
            </span>
            <span className="text-xs text-slate-500">• Engineering & Solutions R&D</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">Digital Lab Workspace</h1>
          <p className="text-xs text-slate-500">
            Accept incoming assignments, update project progress, and collaborate via project communication channels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/assignments"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>My Assignments</span>
          </Link>
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition"
          >
            <FolderKanban className="w-3.5 h-3.5 text-blue-700" />
            <span>Active Tasks</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Assigned Projects */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Projects</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
            {data?.assignedProjectsCount ?? 3}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-blue-600 font-semibold">
            <span>Allocated to Digital Lab</span>
          </div>
        </div>

        {/* Pending Acceptance */}
        <Link
          to="/assignments"
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-amber-300 transition group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-amber-700 transition">Pending Acceptance</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
            {data?.pendingAcceptanceCount ?? 1}
          </p>
          <div className="flex items-center justify-between mt-2 text-[11px] text-amber-700 font-semibold">
            <span>New assignment awaiting signoff</span>
            <ArrowRight className="w-3.5 h-3.5 transition group-hover:translate-x-1" />
          </div>
        </Link>

        {/* Ongoing Work */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Development</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
            {data?.ongoingWorkCount ?? 2}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-indigo-600 font-semibold">
            <span>In-progress builds</span>
          </div>
        </div>

        {/* Completed Handed Over */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
            {data?.completedProjectsCount ?? 7}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-600 font-semibold">
            <span>Delivered across SLT</span>
          </div>
        </div>
      </div>

      {/* Main Split: Assigned Project Worklist & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Worklist */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Assigned Development Tasks</h2>
              <p className="text-[11px] text-slate-500">Live projects assigned to you</p>
            </div>
            <Link to="/projects" className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3 flex-1">
            {data?.assignedProjects && data.assignedProjects.length > 0 ? (
              data.assignedProjects.map(prj => (
                <div
                  key={prj.id}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {prj.projectCode}
                      </span>
                      <h3 className="text-xs font-bold text-slate-900 mt-1">{prj.title}</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">Target Dept: {prj.departmentName}</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        prj.status === 'PendingAcceptance'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {prj.status}
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1">
                      <span>Sprint Progress</span>
                      <span>{prj.progressPercentage}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${prj.progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No assigned projects yet.</p>
            )}
          </div>
        </div>

        {/* Recent Activities & Quick Lab Feed */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Lab Activity Feed</h2>
              <p className="text-[11px] text-slate-500">Notifications, assignments & discussions</p>
            </div>
            <Link to="/messages" className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1">
              <span>Chat Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {data?.recentActivities && data.recentActivities.length > 0 ? (
              data.recentActivities.map(act => (
                <div key={act.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg shrink-0 mt-0.5 flex items-center justify-center text-xs font-bold ${
                        act.type === 'success'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{act.title}</p>
                      <p className="text-[11px] text-slate-500">Sender: {act.userFullName}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No recent activity.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
