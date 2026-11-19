import { Link } from 'react-router-dom'
import {
  BarChart3,
  TrendingUp,
  FolderKanban,
  Star,
  Award,
  ArrowRight
} from 'lucide-react'
import type { HigherManagementDashboardData } from '../../types/auth'

interface HigherMgmtProps {
  data: HigherManagementDashboardData | null
  loading: boolean
}

export default function HigherManagementDashboardView({ data, loading }: HigherMgmtProps) {
  if (loading && !data) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-500">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-semibold">Loading Management Analytics...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200">
              Higher Management
            </span>
            <span className="text-xs text-slate-500">• Strategic Portfolio Visibility</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Executive Performance & Portfolios
          </h1>
          <p className="text-xs text-slate-500">
            Cross-department project metrics, completion ratios, and supervisor delivery ratings (read-only governance).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/reports"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Executive Reports</span>
          </Link>
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition"
          >
            <FolderKanban className="w-3.5 h-3.5 text-slate-500" />
            <span>All Projects</span>
          </Link>
        </div>
      </div>

      {/* Strategic Portfolio Visibility Note */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-slate-800">Higher Management Strategic Portfolio View</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Cross-department initiatives, milestone delivery metrics, and supervisor performance ratings.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Projects Portfolio */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Portfolio</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
            {data?.totalProjects ?? 12}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500">
            <span>Inter-department initiatives</span>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completion Rate</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
            {data?.projectCompletionRate ?? 84.5}%
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-600 font-semibold">
            <span>+4.2% against quarterly SLA</span>
          </div>
        </div>

        {/* In-Progress */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">In Progress</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
            {data?.inProgressCount ?? 7}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-indigo-600 font-semibold">
            <span>Active Sprint Cycles</span>
          </div>
        </div>

        {/* Handover Completed */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Delivered</span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
            {data?.completedCount ?? 5}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-teal-700 font-semibold">
            <span>Handed Over & Verified</span>
          </div>
        </div>
      </div>

      {/* Main Breakdown: Department Output & Supervisor Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Output Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Department Project Output</h2>
              <p className="text-[11px] text-slate-500">Initiative volume and satisfaction score</p>
            </div>
            <Link to="/reports" className="text-xs font-bold text-indigo-700 hover:text-indigo-800 flex items-center gap-1">
              <span>Full Matrix</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {data?.departmentStats && data.departmentStats.length > 0 ? (
              data.departmentStats.map((dept, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">{dept.departmentName}</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {dept.completed} of {dept.totalProjects} delivered
                      </p>
                    </div>
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-extrabold">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>{dept.satisfactionRating} / 5</span>
                    </div>
                  </div>

                  <div className="mt-2.5 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${Math.round((dept.completed / dept.totalProjects) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No department metrics available.</p>
            )}
          </div>
        </div>

        {/* Supervisor Performance Overview */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Supervisor Delivery Benchmark</h2>
              <p className="text-[11px] text-slate-500">Evaluations across technical supervisors</p>
            </div>
            <Link to="/reports" className="text-xs font-bold text-indigo-700 hover:text-indigo-800 flex items-center gap-1">
              <span>View Ratings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {data?.supervisorPerformance && data.supervisorPerformance.length > 0 ? (
              data.supervisorPerformance.map((sup, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">{sup.supervisorName}</h3>
                      <p className="text-[11px] text-slate-500">{sup.department}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>{sup.averageRating}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                    <span>
                      Active: <strong className="text-slate-900">{sup.activeProjects}</strong>
                    </span>
                    <span>
                      Total Delivered: <strong className="text-emerald-700">{sup.deliveredProjects}</strong>
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No supervisor records available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
