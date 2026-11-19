import { useEffect, useState, type FormEvent } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getProposalById, evaluateProposal } from '../../services/api'
import type { Proposal } from '../../types/auth'
import {
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Sparkles,
  ShieldAlert,
  User,
  Edit,
  Send,
  History,
  Check,
  X,
  MessageSquare
} from 'lucide-react'

function getStatusBadge(status: string) {
  switch (status) {
    case 'PENDING_REVIEW':
      return {
        label: 'Pending Review',
        className: 'bg-amber-100 text-amber-900 border-amber-300',
        icon: Clock
      }
    case 'APPROVED':
      return {
        label: 'Approved by DGM',
        className: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        icon: CheckCircle2
      }
    case 'REJECTED':
      return {
        label: 'Rejected',
        className: 'bg-rose-100 text-rose-900 border-rose-300',
        icon: XCircle
      }
    default:
      return {
        label: status,
        className: 'bg-slate-100 text-slate-800 border-slate-300',
        icon: Clock
      }
  }
}

export default function ProposalDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const { user, hasRole } = useAuth()

  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Evaluation Form State (for DGM & ADMIN)
  const isDgmOrAdmin = hasRole('ADMIN', 'DGM')
  const [decision, setDecision] = useState<'APPROVE' | 'REJECT'>('APPROVE')
  const [evaluationComments, setEvaluationComments] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [evaluating, setEvaluating] = useState(false)
  const [evalError, setEvalError] = useState<string | null>(null)
  const [evalSuccess, setEvalSuccess] = useState(false)

  const fetchProposal = async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const data = await getProposalById(id)
      setProposal(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load proposal details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProposal()
  }, [id])

  const handleEvaluationSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setEvalError(null)

    if (decision === 'REJECT' && !rejectionReason.trim()) {
      setEvalError('A rejection reason is mandatory when rejecting a proposal.')
      return
    }

    if (!id) return
    setEvaluating(true)

    try {
      const updated = await evaluateProposal(id, {
        decision,
        evaluationComments: evaluationComments.trim() || undefined,
        rejectionReason: decision === 'REJECT' ? rejectionReason.trim() : undefined
      })
      setProposal(updated)
      setEvalSuccess(true)
      setTimeout(() => setEvalSuccess(false), 5000)
    } catch (err: unknown) {
      setEvalError(err instanceof Error ? err.message : 'Evaluation submission failed.')
    } finally {
      setEvaluating(false)
    }
  }

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-500">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-semibold">Loading proposal specification...</p>
      </div>
    )
  }

  if (error || !proposal) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Access Denied or Not Found</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          {error ?? 'Proposal details are unavailable or you do not have permission to view this proposal.'}
        </p>
        <Link
          to="/proposals"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Proposals</span>
        </Link>
      </div>
    )
  }

  const badge = getStatusBadge(proposal.status)
  const BadgeIcon = badge.icon
  const isEditable = proposal.status === 'PENDING_REVIEW' && (proposal.createdByUserId === user?.id || hasRole('ADMIN'))

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/proposals"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Proposals List</span>
        </Link>

        {isEditable && (
          <Link
            to={`/proposals/${proposal.id}/edit`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs transition"
          >
            <Edit className="w-3.5 h-3.5 text-blue-700" />
            <span>Edit Proposal</span>
          </Link>
        )}
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-black px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
              {proposal.projectCode}
            </span>
            <span className={`inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full border ${badge.className}`}>
              <BadgeIcon className="w-3.5 h-3.5" />
              <span>{badge.label}</span>
            </span>
          </div>

          <div className="text-right text-[11px] text-slate-400 font-mono">
            Submitted {new Date(proposal.createdAt).toLocaleString()}
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {proposal.title}
        </h1>

        {/* Metadata Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <Building2 className="w-4 h-4 text-blue-700 shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Department</p>
              <p className="font-bold text-slate-800 truncate">{proposal.departmentName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <User className="w-4 h-4 text-indigo-700 shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Requester</p>
              <p className="font-bold text-slate-800 truncate">{proposal.createdByUserFullName || proposal.createdByUserName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <Calendar className="w-4 h-4 text-amber-700 shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Target Deadline</p>
              <p className="font-bold text-slate-800">
                {proposal.targetEndDate ? new Date(proposal.targetEndDate).toLocaleDateString() : 'Flexible'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Decision Outcome Banner if Evaluated */}
      {proposal.status === 'ASSIGNED' && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-blue-950 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-blue-900 uppercase tracking-wide">
                Project Assigned & Active
              </h3>
              <p className="text-xs text-blue-800 mt-0.5">
                A Digital Lab Supervisor has accepted this project and dedicated real-time chat collaboration is live.
              </p>
            </div>
          </div>

          <Link
            to={`/messages?projectId=${proposal.id}`}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition shrink-0"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Open Project Chat</span>
          </Link>
        </div>
      )}

      {proposal.status === 'APPROVED' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-emerald-950 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-emerald-900 uppercase tracking-wide">
                  Proposal Approved by DGM
                </h3>
                <span className="text-[11px] text-emerald-700">
                  • Evaluated by {proposal.reviewedByUserFullName || proposal.reviewedByUserName}
                </span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                {proposal.reviewRemarks || 'Approved for subsequent Digital Lab technical assignment and project execution.'}
              </p>
              <p className="text-[11px] text-emerald-700 font-medium pt-1">
                Next Stage: Available for supervisor allocation in Assignment Desk.
              </p>
            </div>
          </div>
        </div>
      )}

      {proposal.status === 'REJECTED' && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-rose-950 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <XCircle className="w-5 h-5" />
            </div>
            <div className="space-y-2 flex-1">
              <div>
                <h3 className="text-sm font-extrabold text-rose-900 uppercase tracking-wide">
                  Proposal Rejected by DGM
                </h3>
                <p className="text-[11px] text-rose-700">
                  Evaluated by {proposal.reviewedByUserFullName || proposal.reviewedByUserName} on{' '}
                  {proposal.reviewedAt ? new Date(proposal.reviewedAt).toLocaleDateString() : ''}
                </p>
              </div>

              {/* Mandatory Rejection Reason */}
              <div className="p-3.5 bg-white rounded-xl border border-rose-200">
                <p className="text-[11px] font-extrabold uppercase text-rose-700 tracking-wider">
                  Mandatory Rejection Reason
                </p>
                <p className="text-xs font-semibold text-rose-900 mt-1 leading-relaxed">
                  {proposal.rejectionReason}
                </p>
              </div>

              {proposal.reviewRemarks && (
                <p className="text-xs text-rose-800">
                  <strong>Internal Evaluation Notes:</strong> {proposal.reviewRemarks}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DGM Interactive Evaluation Panel */}
      {isDgmOrAdmin && proposal.status === 'PENDING_REVIEW' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-purple-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-purple-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-700 text-white shadow-xs">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  DGM Proposal Evaluation Desk
                </h2>
                <p className="text-[11px] text-slate-500">
                  Issue an official governance decision to Approve or Reject this departmental proposal.
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200">
              Authority Required
            </span>
          </div>

          {evalError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{evalError}</span>
            </div>
          )}

          {evalSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Proposal evaluation decision applied successfully!</span>
            </div>
          )}

          <form onSubmit={handleEvaluationSubmit} className="space-y-4">
            {/* Decision selector buttons */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Executive Decision <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDecision('APPROVE')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    decision === 'APPROVE'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-900/20'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>Approve Proposal</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDecision('REJECT')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    decision === 'REJECT'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-900/20'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <X className="w-4 h-4" />
                  <span>Reject Proposal</span>
                </button>
              </div>
            </div>

            {/* Mandatory Rejection Reason if Reject */}
            {decision === 'REJECT' && (
              <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1.5 animate-in fade-in duration-150">
                <label htmlFor="rejectionReason" className="block text-xs font-black text-rose-900">
                  Mandatory Rejection Reason <span className="text-rose-600">*</span>
                </label>
                <textarea
                  id="rejectionReason"
                  rows={3}
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="Specify why the proposal is rejected (e.g. budgetary constraints, duplicated initiative, technical infeasibility)..."
                  className="w-full px-3 py-2 rounded-lg border border-rose-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  required
                ></textarea>
                <p className="text-[10px] text-rose-700 italic">
                  This reason will be recorded in the audit trail and transmitted to the requester via notification.
                </p>
              </div>
            )}

            {/* Internal Evaluation Comments */}
            <div>
              <label htmlFor="evalComments" className="block text-xs font-bold text-slate-700 mb-1.5">
                Internal Evaluation Notes & Directives <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                id="evalComments"
                rows={2}
                value={evaluationComments}
                onChange={e => setEvaluationComments(e.target.value)}
                placeholder="Directives for Digital Lab supervisors or guidance for the requester..."
                className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
              ></textarea>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={evaluating}
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition cursor-pointer ${
                  decision === 'APPROVE'
                    ? 'bg-emerald-700 hover:bg-emerald-800'
                    : 'bg-rose-700 hover:bg-rose-800'
                }`}
              >
                {evaluating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Applying Decision...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Decision ({decision})</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Proposal Technical Specification Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Scope & Problem Statement (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Research / Business Problem */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-2">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider text-blue-700">
              Research / Business Problem Statement
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {proposal.businessProblem}
            </p>
          </div>

          {/* Expected Outcome */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-2">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider text-indigo-700">
              Expected Outcome & Deliverables
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {proposal.expectedOutcome}
            </p>
          </div>

          {/* Additional Information */}
          {proposal.additionalInformation && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-2">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider text-slate-500">
                Additional Technical Context & Dependencies
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {proposal.additionalInformation}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Value Impact & Timeline History (1 col) */}
        <div className="space-y-6">
          {/* Business Impact Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Business Impact Analysis</span>
            </h3>

            <div className="space-y-2">
              <div className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                proposal.impactCostSaving ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-100 line-through'
              }`}>
                <DollarSign className="w-3.5 h-3.5 shrink-0" />
                <span>Opex / Cost Saving</span>
              </div>

              <div className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                proposal.impactRevenue ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-slate-50 text-slate-400 border-slate-100 line-through'
              }`}>
                <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                <span>Revenue Generation</span>
              </div>

              <div className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                proposal.impactProcessOptimization ? 'bg-purple-50 text-purple-800 border-purple-200' : 'bg-slate-50 text-slate-400 border-slate-100 line-through'
              }`}>
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Process Optimization</span>
              </div>
            </div>

            {proposal.quantifiedImpact && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Quantified Value</p>
                <p className="text-xs font-bold text-slate-900 mt-1 leading-snug">
                  {proposal.quantifiedImpact}
                </p>
              </div>
            )}
          </div>

          {/* Status History & Audit Trail */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-1.5">
              <History className="w-4 h-4 text-slate-500" />
              <span>Audit & Status History</span>
            </h3>

            <div className="divide-y divide-slate-100">
              {proposal.statusHistory && proposal.statusHistory.length > 0 ? (
                proposal.statusHistory.map(sh => (
                  <div key={sh.id} className="py-2.5 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-800">{sh.newStatus}</span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        {new Date(sh.changedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {sh.remarks && (
                      <p className="text-[11px] text-slate-500 leading-snug">{sh.remarks}</p>
                    )}
                    <p className="text-[10px] text-slate-400">By {sh.changedByUserName}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-2">No history recorded.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
