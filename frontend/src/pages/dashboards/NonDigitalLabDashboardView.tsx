import { Link } from 'react-router-dom'
import {
  FileText,
  Clock,
  CheckCircle2,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  MessageSquare
} from 'lucide-react'
import type { NonDigitalLabDashboardData } from '../../types/auth'

interface NonDigitalLabProps {
  data: NonDigitalLabDashboardData | null
  loading: boolean
}

export default function NonDigitalLabDashboardView({ data, loading }: NonDigitalLabProps) {
  if (loading && !data) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-500">
        <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-semibold">Loading Department Workspace...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-teal-100 text-teal-800 border border-teal-200">
              Department User
            </span>
            <span className="text-xs text-slate-500">• Network Operations & Infrastructure</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Department Project Workspace
          </h1>
          <p className="text-xs text-slate-500">
            Submit new project proposals to the DGM, monitor Digital Lab delivery milestones, and coordinate on live chats.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/proposals"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Submit Proposal</span>
          </Link>
          <Link
            to="/messages"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition"
          >
            <MessageSquare className="w-3.5 h-3.5 text-teal-700" />
            <span>Chat Rooms</span>
          </Link>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Submitted Proposals */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Submitted Proposals</span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
            {data?.submittedProposalsCount ?? 3}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-teal-700 font-semibold">
            <span>By your department</span>
          </div>
        </div>

        {/* Under Review */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Under Review</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
            {data?.underReviewCount ?? 1}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-amber-700 font-semibold">
            <span>With DGM approval desk</span>
          </div>
        </div>

        {/* Approved by DGM */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Approved</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
            {data?.approvedCount ?? 2}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-blue-600 font-semibold">
            <span>Approved for development</span>
          </div>
        </div>

        {/* In Active Execution */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ongoing Projects</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
            {data?.ongoingCount ?? 1}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-600 font-semibold">
            <span>In Lab Development</span>
          </div>
        </div>
      </div>

      {/* Main Split: Submitted Proposals & Progress Updates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Proposals List */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Submitted Proposals & Trackers</h2>
              <p className="text-[11px] text-slate-500">Real-time status of submitted solutions</p>
            </div>
            <Link to="/proposals" className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3 flex-1">
            {data?.myProposals && data.myProposals.length > 0 ? (
              data.myProposals.map(prop => (
                <div
                  key={prop.id}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-teal-300 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {prop.projectCode}
                      </span>
                      <h3 className="text-xs font-bold text-slate-900 mt-1">{prop.title}</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {prop.supervisorName ? `Assigned to: ${prop.supervisorName}` : 'Supervisor unassigned'}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        prop.status === 'Delivered'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : prop.status === 'Ongoing'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {prop.status}
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1">
                      <span>Delivery Completion</span>
                      <span>{prop.progressPercentage}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          prop.progressPercentage === 100 ? 'bg-emerald-500' : 'bg-teal-600'
                        }`}
                        style={{ width: `${prop.progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No submitted proposals found.</p>
            )}
          </div>
        </div>

        {/* Milestone Alerts & Notifications */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Project Progress Updates</h2>
              <p className="text-[11px] text-slate-500">Milestone updates from Digital Lab supervisors</p>
            </div>
            <Link to="/notifications" className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1">
              <span>All Alerts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {data?.projectUpdates && data.projectUpdates.length > 0 ? (
              data.projectUpdates.map(upd => (
                <div key={upd.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg shrink-0 mt-0.5 flex items-center justify-center text-xs font-bold ${
                        upd.type === 'success'
                          ? 'bg-emerald-100 text-emerald-700'
                          : upd.type === 'warning'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-teal-100 text-teal-700'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{upd.title}</p>
                      <p className="text-[11px] text-slate-500">Initiated by {upd.userFullName}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {new Date(upd.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No recent progress updates.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
