import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  TrendingUp,
  Star,
  Award,
  Users,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Loader2,
  Briefcase
} from 'lucide-react'
import { getHigherManagementDashboard, getSupervisorPerformance } from '../../services/api'
import type { HigherManagementDashboardData, SupervisorPerformanceStats } from '../../types/auth'

export default function ReportsPage() {
  const [mgmtData, setMgmtData] = useState<HigherManagementDashboardData | null>(null)
  const [supervisors, setSupervisors] = useState<SupervisorPerformanceStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getHigherManagementDashboard().catch(() => null),
      getSupervisorPerformance().catch(() => [])
    ])
      .then(([dash, sups]) => {
        setMgmtData(dash)
        setSupervisors(sups)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-500">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
        <p className="text-xs font-semibold">Generating Executive Performance Reports...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20 text-red-500">
        <p className="text-sm font-semibold">{error}</p>
        <Link to="/dashboard" className="mt-4 text-xs text-blue-600 hover:underline inline-block">
          Return to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                Executive Reports
              </span>
              <span className="text-xs text-slate-500">• Portfolio Analytics & Delivery Matrix</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Cross-Department Delivery & Performance Matrix
            </h1>
            <p className="text-xs text-slate-500">
              Audited delivery ratios, supervisor evaluation dimensions, and completed handovers across SLT.
            </p>
          </div>
        </div>
      </div>

      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Portfolio</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
            {mgmtData?.totalProjects ?? 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">All recorded inter-department projects</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completion Rate</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
            {mgmtData?.projectCompletionRate ?? 0}%
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">Formal Handover Verified</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Sprints</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
            {mgmtData?.inProgressCount ?? 0}
          </p>
          <p className="text-[11px] text-indigo-600 font-semibold mt-1">Development to Validation</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Delivered</span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
            {mgmtData?.completedCount ?? 0}
          </p>
          <p className="text-[11px] text-teal-700 font-semibold mt-1">Handed Over to Departments</p>
        </div>
      </div>

      {/* Supervisor Multi-Dimension Evaluation Matrix */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Supervisor Multi-Dimensional Evaluation Matrix
            </h2>
            <p className="text-[11px] text-slate-500">
              Aggregated from post-handover evaluations by DGM and Requesters across 5 dimensions (1–5 scale).
            </p>
          </div>
        </div>

        {supervisors.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-xs font-semibold">No supervisor ratings recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="px-4 py-3">Supervisor</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3 text-center">Active Projects</th>
                  <th className="px-4 py-3 text-center">Completed</th>
                  <th className="px-4 py-3 text-center">Technical</th>
                  <th className="px-4 py-3 text-center">Communication</th>
                  <th className="px-4 py-3 text-center">Timely Delivery</th>
                  <th className="px-4 py-3 text-center">Professionalism</th>
                  <th className="px-4 py-3 text-center">Overall Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {supervisors.map(sup => (
                  <tr key={sup.supervisorId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">{sup.supervisorName}</td>
                    <td className="px-4 py-3 text-slate-600">{sup.departmentName}</td>
                    <td className="px-4 py-3 text-center font-mono">{sup.activeProjects}</td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-emerald-700">{sup.completedProjects}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-slate-700">
                        {sup.averageTechnicalQuality > 0 ? `${sup.averageTechnicalQuality}⭐` : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-slate-700">
                        {sup.averageCommunication > 0 ? `${sup.averageCommunication}⭐` : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-slate-700">
                        {sup.averageTimelyDelivery > 0 ? `${sup.averageTimelyDelivery}⭐` : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-slate-700">
                        {sup.averageProfessionalism > 0 ? `${sup.averageProfessionalism}⭐` : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-extrabold">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        {sup.averageOverallRating > 0 ? `${sup.averageOverallRating} / 5` : 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Department Output Breakdown */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              Department Delivery Breakdown
            </h2>
            <p className="text-[11px] text-slate-500">Initiatives generated and completion ratios by SLT department.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mgmtData?.departmentStats && mgmtData.departmentStats.length > 0 ? (
            mgmtData.departmentStats.map((dept, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-900">{dept.departmentName}</h3>
                  <span className="text-[11px] text-slate-500">
                    {dept.completed} of {dept.totalProjects} delivered
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full"
                    style={{
                      width: `${dept.totalProjects > 0 ? Math.round((dept.completed / dept.totalProjects) * 100) : 0}%`
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center col-span-2">No department metrics available.</p>
          )}
        </div>
      </div>
    </div>
  )
}
