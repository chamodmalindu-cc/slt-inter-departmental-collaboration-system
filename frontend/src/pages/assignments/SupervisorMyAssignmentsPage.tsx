import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyAssignments, respondToAssignment } from '../../services/api'
import type { ProjectAssignment } from '../../types/auth'
import {
  FolderKanban,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  AlertCircle,
  ArrowRight,
  Send,
  Building2,
  Check,
  X
} from 'lucide-react'

function getStatusBadge(status: string) {
  switch (status) {
    case 'PENDING_ACCEPTANCE':
      return { label: 'Pending Your Decision', className: 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse', icon: Clock }
    case 'ACCEPTED':
      return { label: 'Accepted & Active', className: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle2 }
    case 'DECLINED':
      return { label: 'Declined', className: 'bg-rose-100 text-rose-800 border-rose-300', icon: XCircle }
    case 'CANCELLED':
      return { label: 'Cancelled by DGM', className: 'bg-slate-100 text-slate-700 border-slate-300', icon: XCircle }
    default:
      return { label: status, className: 'bg-slate-100 text-slate-700 border-slate-300', icon: Clock }
  }
}

export default function SupervisorMyAssignmentsPage() {
  const [assignments, setAssignments] = useState<ProjectAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING_ACCEPTANCE' | 'ACCEPTED' | 'DECLINED'>('ALL')

  // Response Modal state
  const [selectedAssignment, setSelectedAssignment] = useState<ProjectAssignment | null>(null)
  const [actionType, setActionType] = useState<'ACCEPT' | 'DECLINE'>('ACCEPT')
  const [declineReason, setDeclineReason] = useState('')
  const [submittingResponse, setSubmittingResponse] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [successToast, setSuccessToast] = useState<string | null>(null)

  const fetchAssignments = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getMyAssignments(activeTab)
      setAssignments(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assignments.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssignments()
  }, [activeTab])

  const openResponseModal = (assignment: ProjectAssignment, type: 'ACCEPT' | 'DECLINE') => {
    setSelectedAssignment(assignment)
    setActionType(type)
    setDeclineReason('')
    setModalError(null)
  }

  const handleRespond = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAssignment) return
    setModalError(null)

    if (actionType === 'DECLINE' && !declineReason.trim()) {
      setModalError('A mandatory decline reason is required when declining an assignment.')
      return
    }

    setSubmittingResponse(true)
    try {
      await respondToAssignment(selectedAssignment.id, {
        action: actionType,
        declineReason: actionType === 'DECLINE' ? declineReason.trim() : undefined
      })

      setSuccessToast(`Assignment successfully ${actionType.toLowerCase()}ed!`)
      setSelectedAssignment(null)
      fetchAssignments()
      setTimeout(() => setSuccessToast(null), 5000)
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Failed to submit response.')
    } finally {
      setSubmittingResponse(false)
    }
  }

  const pendingCount = assignments.filter(a => a.status === 'PENDING_ACCEPTANCE').length
  const acceptedCount = assignments.filter(a => a.status === 'ACCEPTED').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
              Digital Lab Workspace
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            My Project Assignments
          </h1>
          <p className="text-xs text-slate-500">
            Review assignments allocated by the DGM, inspect requirements & deadlines, and accept or decline with reason.
          </p>
        </div>

        {pendingCount > 0 && (
          <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2 shadow-xs">
            <Clock className="w-4 h-4 text-amber-600 animate-spin" />
            <span>{pendingCount} Pending Assignment(s) Need Your Decision</span>
          </div>
        )}
      </div>

      {successToast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 text-xs font-bold">
          {error}
        </div>
      )}

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Received</span>
          <p className="text-3xl font-black text-slate-900 mt-2">{assignments.length}</p>
          <span className="text-[11px] text-slate-400">Lifetime assignments</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-amber-200 bg-amber-50/20 shadow-xs">
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Awaiting Decision</span>
          <p className="text-3xl font-black text-amber-900 mt-2">{pendingCount}</p>
          <span className="text-[11px] text-amber-700 font-semibold">Immediate action requested</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Accepted Active Projects</span>
          <p className="text-3xl font-black text-emerald-900 mt-2">{acceptedCount}</p>
          <span className="text-[11px] text-emerald-700 font-semibold">In your active development queue</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { id: 'ALL', label: 'All Assignments' },
          { id: 'PENDING_ACCEPTANCE', label: 'Pending Acceptance' },
          { id: 'ACCEPTED', label: 'Accepted' },
          { id: 'DECLINED', label: 'Declined' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-blue-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Assignments List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs font-semibold">Loading assignments...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">No assignments found</p>
            <p className="text-xs text-slate-400 mt-1">
              {activeTab !== 'ALL' ? `No assignments with status '${activeTab}'` : 'You have no assigned projects from DGM currently.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {assignments.map(a => {
              const badge = getStatusBadge(a.status)
              const BadgeIcon = badge.icon
              const isPending = a.status === 'PENDING_ACCEPTANCE'

              return (
                <div
                  key={a.id}
                  className={`p-5 sm:p-6 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    isPending ? 'bg-amber-50/30 hover:bg-amber-50/50' : 'hover:bg-slate-50/70'
                  }`}
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                        {a.projectCode}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${badge.className}`}>
                        <BadgeIcon className="w-3 h-3" />
                        <span>{badge.label}</span>
                      </span>
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        Role: {a.assignmentRole}
                      </span>
                    </div>

                    <Link
                      to={`/assignments/${a.id}`}
                      className="text-sm sm:text-base font-extrabold text-slate-900 hover:text-blue-700 transition block truncate"
                    >
                      {a.projectTitle}
                    </Link>

                    {/* DGM Instructions Box */}
                    {a.instructions && (
                      <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 text-xs text-purple-950">
                        <strong className="text-[10px] uppercase font-bold text-purple-800 block mb-0.5">
                          DGM Instructions & Objectives:
                        </strong>
                        <p className="line-clamp-2">{a.instructions}</p>
                      </div>
                    )}

                    {/* Decline Reason if declined */}
                    {a.status === 'DECLINED' && a.declineReason && (
                      <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900">
                        <strong>Your Declination Reason:</strong> {a.declineReason}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1 text-slate-700 font-semibold">
                        <Building2 className="w-3.5 h-3.5 text-blue-700" />
                        Dept: {a.departmentName}
                      </span>
                      <span>•</span>
                      <span>Requester: {a.requesterName}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-amber-800 font-bold">
                        <Calendar className="w-3.5 h-3.5 text-amber-600" />
                        Deadline: {a.assignedDeadline ? new Date(a.assignedDeadline).toLocaleDateString() : 'None'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                    <Link
                      to={`/assignments/${a.id}`}
                      className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <span>View Full Specs</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>

                    {isPending && (
                      <>
                        <button
                          onClick={() => openResponseModal(a, 'ACCEPT')}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </button>

                        <button
                          onClick={() => openResponseModal(a, 'DECLINE')}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Decline</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Response Modal (Accept / Decline) */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div
                  className={`p-2 rounded-xl text-white ${
                    actionType === 'ACCEPT' ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}
                >
                  {actionType === 'ACCEPT' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    {actionType === 'ACCEPT' ? 'Accept Project Assignment' : 'Decline Project Assignment'}
                  </h3>
                  <p className="text-[11px] text-slate-500">{selectedAssignment.projectCode}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAssignment(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleRespond} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                <p className="font-bold text-slate-900">{selectedAssignment.projectTitle}</p>
                <p className="text-slate-500 text-[11px]">
                  Requester: {selectedAssignment.requesterName} ({selectedAssignment.departmentName})
                </p>
                <p className="text-amber-800 font-semibold text-[11px]">
                  Target Deadline: {selectedAssignment.assignedDeadline ? new Date(selectedAssignment.assignedDeadline).toLocaleDateString() : 'N/A'}
                </p>
              </div>

              {actionType === 'ACCEPT' ? (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
                  By accepting, you confirm leadership of this technical project. The project will transition to{' '}
                  <strong>ASSIGNED</strong> status and notification will be dispatched to the DGM and department requester.
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
                    placeholder="Specify why you cannot lead this project (e.g. current bandwidth saturated, conflicting telecom sprint, technical domain mismatch)..."
                    className="w-full px-3 py-2 rounded-xl border border-rose-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                    required
                  ></textarea>
                  <p className="text-[10px] text-slate-400">
                    The DGM will be notified with your reason and can reallocate the project to another specialist.
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAssignment(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingResponse}
                  className={`inline-flex items-center gap-1.5 px-5 py-2 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer ${
                    actionType === 'ACCEPT'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {submittingResponse ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Confirm {actionType === 'ACCEPT' ? 'Acceptance' : 'Declination'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
