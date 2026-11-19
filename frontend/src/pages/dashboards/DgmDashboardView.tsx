import { Link } from 'react-router-dom'
import {
  FileText,
  CheckCircle2,
  Clock,
  Users,
  UserCheck,
  AlertCircle,
  ArrowRight,
  TrendingUp
} from 'lucide-react'
import type { DgmDashboardData } from '../../types/auth'

interface DgmViewProps {
  data: DgmDashboardData | null
  loading: boolean
}

export default function DgmDashboardView({ data, loading }: DgmViewProps) {
  if (loading && !data) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-500">
        <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-semibold">Loading DGM Overview...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
              Deputy General Manager
            </span>
            <span className="text-xs text-slate-500">• Executive Project Governance</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">DGM Project Governance</h1>
          <p className="text-xs text-slate-500">
            Review incoming project proposals, assign project supervisors, and monitor cross-department deliveries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/proposals"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Review Proposals</span>
          </Link>
          <Link
            to="/assignments/manage"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-purple-50 border border-slate-200 text-purple-800 text-xs font-bold rounded-xl shadow-xs transition"
          >
            <UserCheck className="w-3.5 h-3.5 text-purple-700" />
            <span>Assignment Desk</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Proposals */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Proposals</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
            {data?.pendingProposalsCount ?? 3}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-amber-700 font-semibold">
            <AlertCircle className="w-3 h-3" />
            <span>Requires DGM Decision</span>
          </div>
        </div>

        {/* Approved Projects */}
        <Link
          to="/assignments/manage"
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-purple-300 transition group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-purple-700 transition">Approved Projects</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
            {data?.approvedProjectsCount ?? 4}
          </p>
          <div className="flex items-center justify-between mt-2 text-[11px] text-blue-600 font-semibold">
            <span>Ready for Lab Assignment</span>
            <ArrowRight className="w-3.5 h-3.5 transition group-hover:translate-x-1" />
          </div>
        </Link>

        {/* Ongoing Work */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ongoing Projects</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
            {data?.ongoingProjectsCount ?? 2}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-purple-700 font-semibold">
            <span>In Execution Phase</span>
          </div>
        </div>

        {/* Total Supervisors */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Supervisors</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
            {data?.totalSupervisorsCount ?? 6}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-600 font-semibold">
            <span>Digital Lab & Network Team</span>
          </div>
        </div>
      </div>

      {/* Main Content: Pending Proposals Table & Active Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Proposals Awaiting Approval */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Project Proposals for Approval</h2>
              <p className="text-[11px] text-slate-500">Submitted by non-digital lab departments</p>
            </div>
            <Link
              to="/proposals"
              className="text-xs font-bold text-purple-700 hover:text-purple-800 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3 flex-1">
            {data?.pendingProposals && data.pendingProposals.length > 0 ? (
              data.pendingProposals.map(prop => (
                <div
                  key={prop.id}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/20 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        {prop.projectCode}
                      </span>
                      <h3 className="text-xs font-bold text-slate-900 mt-1">{prop.title}</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">{prop.departmentName}</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        prop.priority === 'High'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {prop.priority}
                    </span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-400">
                      {new Date(prop.createdAt).toLocaleDateString()}
                    </span>
                    <Link
                      to="/proposals"
                      className="text-purple-700 font-bold hover:underline inline-flex items-center gap-1 text-[11px]"
                    >
                      <span>Review Details</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">No proposals currently awaiting review.</p>
            )}
          </div>
        </div>

        {/* Active Ongoing Projects with Assignment Status */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Active Executing Projects</h2>
              <p className="text-[11px] text-slate-500">Live development by Digital Lab</p>
            </div>
            <Link
              to="/projects"
              className="text-xs font-bold text-purple-700 hover:text-purple-800 flex items-center gap-1"
            >
              <span>Project Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3 flex-1">
            {data?.activeProjects && data.activeProjects.length > 0 ? (
              data.activeProjects.map(prj => (
                <div
                  key={prj.id}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {prj.projectCode}
                      </span>
                      <h3 className="text-xs font-bold text-slate-900 mt-1">{prj.title}</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Supervisor: <span className="font-semibold text-slate-700">{prj.supervisorName ?? 'Unassigned'}</span>
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {prj.status}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1">
                      <span>Delivery Benchmark</span>
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
              <p className="text-xs text-slate-400 text-center py-6">No active projects ongoing.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
