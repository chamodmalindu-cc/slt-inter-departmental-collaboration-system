import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getAssignmentById, respondToAssignment } from '../../services/api'
import type { ProjectAssignment } from '../../types/auth'
import {
  UserCheck,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Check,
  X,
  FileText,
  MessageSquare
} from 'lucide-react'

function getStatusBadge(status: string) {
  switch (status) {
    case 'PENDING_ACCEPTANCE':
      return { label: 'Pending Acceptance', className: 'bg-amber-100 text-amber-900 border-amber-300', icon: Clock }
    case 'ACCEPTED':
      return { label: 'Accepted & Active', className: 'bg-emerald-100 text-emerald-900 border-emerald-300', icon: CheckCircle2 }
    case 'DECLINED':
      return { label: 'Declined by Supervisor', className: 'bg-rose-100 text-rose-900 border-rose-300', icon: XCircle }
    case 'CANCELLED':
      return { label: 'Cancelled by DGM', className: 'bg-slate-100 text-slate-700 border-slate-300', icon: XCircle }
    default:
      return { label: status, className: 'bg-slate-100 text-slate-700 border-slate-300', icon: Clock }
  }
}

export default function AssignmentDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()

  const [assignment, setAssignment] = useState<ProjectAssignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Direct response action
  const [actionType, setActionType] = useState<'ACCEPT' | 'DECLINE' | null>(null)
  const [declineReason, setDeclineReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const fetchAssignment = async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const data = await getAssignmentById(id)
      setAssignment(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load assignment details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssignment()
  }, [id])

  const handleRespond = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!actionType || !id) return
    setActionError(null)

    if (actionType === 'DECLINE' && !declineReason.trim()) {
      setActionError('A mandatory decline reason is required when declining.')
      return
    }

    setSubmitting(true)
    try {
      const updated = await respondToAssignment(id, {
        action: actionType,
        declineReason: actionType === 'DECLINE' ? declineReason.trim() : undefined
      })
      setAssignment(updated)
      setActionType(null)
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Action submission failed.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-500">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-semibold">Loading assignment specifications...</p>
      </div>
    )
  }

  if (error || !assignment) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Assignment Not Available</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">{error ?? 'Assignment not found.'}</p>
        <Link
          to="/assignments"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Assignments</span>
        </Link>
      </div>
    )
  }

  const badge = getStatusBadge(assignment.status)
  const BadgeIcon = badge.icon
  const isSupervisor = assignment.userId === user?.id
  const canRespond = isSupervisor && assignment.status === 'PENDING_ACCEPTANCE'

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top back link */}
      <div>
        <Link
          to={isSupervisor ? '/assignments' : '/assignments/manage'}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Assignments Overview</span>
        </Link>
      </div>

      {/* Main Assignment Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-black px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
              {assignment.projectCode}
            </span>
            <span className={`inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full border ${badge.className}`}>
              <BadgeIcon className="w-3.5 h-3.5" />
              <span>{badge.label}</span>
            </span>
          </div>

          <div className="text-right text-[11px] text-slate-400 font-mono">
            Assigned: {new Date(assignment.assignedAt).toLocaleString()}
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {assignment.projectTitle}
        </h1>

        {/* Spec Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-purple-700" /> Assigned Supervisor
            </span>
            <p className="font-bold text-slate-800">{assignment.supervisorName}</p>
            <p className="text-[11px] text-slate-500">{assignment.supervisorEmail}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-blue-700" /> Requester & Dept
            </span>
            <p className="font-bold text-slate-800">{assignment.departmentName}</p>
            <p className="text-[11px] text-slate-500">Requester: {assignment.requesterName}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-700" /> Assignment Deadline
            </span>
            <p className="font-bold text-slate-800">
              {assignment.assignedDeadline ? new Date(assignment.assignedDeadline).toLocaleDateString() : 'None'}
            </p>
            <p className="text-[11px] text-slate-500">Role: {assignment.assignmentRole}</p>
          </div>
        </div>
      </div>

      {/* DGM Instructions Box */}
      {assignment.instructions && (
        <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-6 space-y-2">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-700" />
            <span>DGM Assignment Directives & Expectations</span>
          </h3>
          <p className="text-xs sm:text-sm text-purple-950 leading-relaxed whitespace-pre-line">
            {assignment.instructions}
          </p>
          {assignment.assignedByUserFullName && (
            <p className="text-[11px] text-purple-700 pt-1 font-medium">
              Issued by: {assignment.assignedByUserFullName}
            </p>
          )}
        </div>
      )}

      {/* Decline Reason Box if Declined */}
      {assignment.status === 'DECLINED' && assignment.declineReason && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 space-y-2 text-rose-950">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-rose-900 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-700" />
            <span>Supervisor Declination Statement</span>
          </h3>
          <p className="text-xs sm:text-sm text-rose-900 leading-relaxed bg-white p-3.5 rounded-xl border border-rose-200">
            {assignment.declineReason}
          </p>
          <p className="text-[11px] text-rose-700">
            Responded on {assignment.respondedAt ? new Date(assignment.respondedAt).toLocaleString() : ''}.
          </p>
        </div>
      )}

      {/* Acceptance Status Box */}
      {assignment.status === 'ACCEPTED' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-900">
                Active Project Assignment Confirmed
              </h3>
              <p className="text-xs text-emerald-800 mt-1">
                Supervisor {assignment.supervisorName} accepted this technical project on{' '}
                {assignment.respondedAt ? new Date(assignment.respondedAt).toLocaleDateString() : ''}.
                Dedicated collaboration chat room is live.
              </p>
            </div>
          </div>

          <Link
            to={`/messages?projectId=${assignment.projectId}`}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition shrink-0"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Open Project Chat</span>
          </Link>
        </div>
      )}

      {/* Interactive Response Form for the Assigned Supervisor */}
      {canRespond && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-blue-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Respond to Project Assignment
              </h3>
              <p className="text-[11px] text-slate-500">
                Accept project leadership or decline with mandatory technical justification.
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
              Action Required
            </span>
          </div>

          {actionError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl">
              {actionError}
            </div>
          )}

          {!actionType ? (
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={() => setActionType('ACCEPT')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Accept Project Assignment</span>
              </button>

              <button
                onClick={() => setActionType('DECLINE')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Decline Assignment...</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleRespond} className="space-y-4 pt-2">
              {actionType === 'ACCEPT' ? (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                  <p className="font-bold">Confirm Acceptance?</p>
                  <p className="mt-1 text-[11px] text-emerald-800">
                    You will be recorded as the active supervisor. Notifications will be dispatched to DGM and the requester.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label htmlFor="declineReason" className="block text-xs font-bold text-rose-900">
                    Mandatory Reason for Declining <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="declineReason"
                    rows={3}
                    value={declineReason}
                    onChange={e => setDeclineReason(e.target.value)}
                    placeholder="Provide specific justification for DGM (e.g. specialized RF skill gap, current sprint allocation)..."
                    className="w-full px-3 py-2 rounded-xl border border-rose-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                    required
                  ></textarea>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActionType(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`inline-flex items-center gap-1.5 px-5 py-2 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer ${
                    actionType === 'ACCEPT' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {submitting ? 'Submitting...' : `Confirm ${actionType}`}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Link to Full Original Proposal */}
      <div className="pt-2 flex justify-between items-center text-xs text-slate-500 border-t border-slate-100">
        <span>Project Identifier: <strong className="font-mono text-slate-700">{assignment.projectCode}</strong></span>
        <Link
          to={`/proposals/${assignment.projectId}`}
          className="text-blue-700 font-bold hover:underline inline-flex items-center gap-1"
        >
          <span>Inspect Original Proposal Details</span>
          <FileText className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}
