import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getMyProposals, getAllProposals } from '../../services/api'
import type { Proposal } from '../../types/auth'
import {
  FileText,
  PlusCircle,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  Edit,
  TrendingUp,
  DollarSign,
  Sparkles,
  Building2
} from 'lucide-react'

function getStatusBadge(status: string) {
  switch (status) {
    case 'PENDING_REVIEW':
      return {
        label: 'Pending Review',
        className: 'bg-amber-50 text-amber-800 border-amber-200',
        icon: Clock
      }
    case 'APPROVED':
      return {
        label: 'Approved by DGM',
        className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        icon: CheckCircle2
      }
    case 'REJECTED':
      return {
        label: 'Rejected',
        className: 'bg-rose-50 text-rose-800 border-rose-200',
        icon: XCircle
      }
    default:
      return {
        label: status,
        className: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: Clock
      }
  }
}

export default function ProposalsListPage() {
  const { hasRole } = useAuth()
  const isDgmOrAdmin = hasRole('ADMIN', 'DGM')
  const isHigherMgmt = hasRole('HIGHER_MANAGEMENT')
  const isDigitalLab = hasRole('DIGITAL_LAB_USER') && !isDgmOrAdmin && !isHigherMgmt
  const isRequester = hasRole('NON_DIGITAL_LAB_USER') && !isDgmOrAdmin && !isHigherMgmt

  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [searchTerm, setSearchTerm] = useState('')

  const fetchProposals = async () => {
    setLoading(true)
    setError(null)

    try {
      if (isRequester) {
        const data = await getMyProposals()
        setProposals(data)
      } else {
        const data = await getAllProposals({
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          searchTerm: searchTerm.trim() || undefined
        })
        setProposals(data)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load proposals.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProposals()
  }, [statusFilter])

  // Filter client-side if searching in requester mode
  const filteredProposals = proposals.filter(p => {
    if (isRequester && statusFilter !== 'ALL' && p.status !== statusFilter) {
      return false
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      return (
        p.title.toLowerCase().includes(term) ||
        p.projectCode.toLowerCase().includes(term) ||
        p.businessProblem?.toLowerCase().includes(term) ||
        p.departmentName?.toLowerCase().includes(term)
      )
    }
    return true
  })

  // Quick statistics
  const pendingCount = proposals.filter(p => p.status === 'PENDING_REVIEW').length
  const approvedCount = proposals.filter(p => p.status === 'APPROVED').length
  const rejectedCount = proposals.filter(p => p.status === 'REJECTED').length

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
              Proposal Management
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            {isDgmOrAdmin
              ? 'DGM Proposal Review & Governance'
              : isHigherMgmt
              ? 'Executive Proposal Portfolios'
              : isDigitalLab
              ? 'Approved Proposals for Assignment'
              : 'My Project Proposals'}
          </h1>
          <p className="text-xs text-slate-500">
            {isDgmOrAdmin
              ? 'Review pending proposals, inspect business impact metrics, and issue approval or rejection decisions.'
              : isRequester
              ? 'Track submitted initiatives, view evaluation decisions, and submit new departmental proposals.'
              : 'Inspect approved cross-departmental initiatives ready for technical development.'}
          </p>
        </div>

        {/* Submit New Proposal Button (for Requester and Admin) */}
        {(isRequester || hasRole('ADMIN')) && (
          <Link
            to="/proposals/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit Proposal</span>
          </Link>
        )}
      </div>

      {/* KPI Stats Bar (for DGM/Admin/Higher Management) */}
      {!isDigitalLab && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Proposals</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{proposals.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-amber-200 bg-amber-50/20 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Pending Review
            </span>
            <p className="text-2xl font-black text-amber-800 mt-1">{pendingCount}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-emerald-200 bg-emerald-50/20 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Approved
            </span>
            <p className="text-2xl font-black text-emerald-800 mt-1">{approvedCount}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-rose-200 bg-rose-50/20 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1">
              <XCircle className="w-3 h-3" /> Rejected
            </span>
            <p className="text-2xl font-black text-rose-800 mt-1">{rejectedCount}</p>
          </div>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Status Tab buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'PENDING_REVIEW', label: 'Pending Review' },
            { id: 'APPROVED', label: 'Approved' },
            { id: 'REJECTED', label: 'Rejected' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchProposals()}
            placeholder="Search proposals, codes, keywords..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Proposals List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs font-semibold">Loading project proposals...</p>
          </div>
        ) : filteredProposals.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">No project proposals found</p>
            <p className="text-xs text-slate-400 mt-1">
              {statusFilter !== 'ALL' ? `No proposals matching status '${statusFilter}'` : 'Get started by creating a new proposal.'}
            </p>
            {(isRequester || hasRole('ADMIN')) && (
              <Link
                to="/proposals/new"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Submit First Proposal</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredProposals.map(proposal => {
              const badge = getStatusBadge(proposal.status)
              const BadgeIcon = badge.icon
              const isEditable = isRequester && proposal.status === 'PENDING_REVIEW'

              return (
                <div
                  key={proposal.id}
                  className="p-5 hover:bg-slate-50/70 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Left: Code, Title, Dept, Problem Snippet */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                        {proposal.projectCode}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${badge.className}`}>
                        <BadgeIcon className="w-3 h-3" />
                        <span>{badge.label}</span>
                      </span>
                      {proposal.priority && (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {proposal.priority} Priority
                        </span>
                      )}
                    </div>

                    <Link
                      to={`/proposals/${proposal.id}`}
                      className="text-sm font-extrabold text-slate-900 hover:text-blue-700 transition block truncate"
                    >
                      {proposal.title}
                    </Link>

                    <p className="text-xs text-slate-500 line-clamp-2 max-w-3xl">
                      {proposal.businessProblem}
                    </p>

                    {/* Metadata tags: Department, Submitter, Impacts */}
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Building2 className="w-3.5 h-3.5 text-blue-700" />
                        {proposal.departmentName}
                      </span>
                      <span>•</span>
                      <span>
                        By <strong className="text-slate-700">{proposal.createdByUserFullName || proposal.createdByUserName}</strong>
                      </span>
                      <span>•</span>
                      <span>Submitted {new Date(proposal.createdAt).toLocaleDateString()}</span>
                      
                      {/* Business Impact Badges */}
                      <div className="flex items-center gap-1 ml-auto">
                        {proposal.impactCostSaving && (
                          <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200" title="Cost Saving">
                            <DollarSign className="w-2.5 h-2.5" /> OPEX
                          </span>
                        )}
                        {proposal.impactRevenue && (
                          <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200" title="Revenue Generation">
                            <TrendingUp className="w-2.5 h-2.5" /> REVENUE
                          </span>
                        )}
                        {proposal.impactProcessOptimization && (
                          <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200" title="Process Optimization">
                            <Sparkles className="w-2.5 h-2.5" /> PROCESS
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                    {/* If proposal is rejected, show rejection tooltip snippet */}
                    {proposal.status === 'REJECTED' && proposal.rejectionReason && (
                      <span
                        className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200 truncate max-w-[200px]"
                        title={proposal.rejectionReason}
                      >
                        Reason: {proposal.rejectionReason}
                      </span>
                    )}

                    {isEditable && (
                      <Link
                        to={`/proposals/${proposal.id}/edit`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                      >
                        <Edit className="w-3.5 h-3.5 text-blue-700" />
                        <span>Edit</span>
                      </Link>
                    )}

                    <Link
                      to={`/proposals/${proposal.id}`}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
                        isDgmOrAdmin && proposal.status === 'PENDING_REVIEW'
                          ? 'bg-purple-700 hover:bg-purple-800 text-white shadow-purple-900/20'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      <span>
                        {isDgmOrAdmin && proposal.status === 'PENDING_REVIEW' ? 'Review & Evaluate' : 'View Details'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
