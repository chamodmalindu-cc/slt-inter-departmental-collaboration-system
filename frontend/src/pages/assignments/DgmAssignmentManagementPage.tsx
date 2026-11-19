import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  getUnassignedProjects,
  getAvailableSupervisors,
  createAssignment,
  getAllAssignments,
  cancelAssignment
} from '../../services/api'
import type {
  UnassignedApprovedProject,
  SupervisorCandidate,
  ProjectAssignment
} from '../../types/auth'
import {
  UserCheck,
  FolderKanban,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  PlusCircle,
  Send,
  Building2,
  FileText,
  User,
  ArrowRight,
  X
} from 'lucide-react'

function getAssignmentStatusBadge(status: string) {
  switch (status) {
    case 'PENDING_ACCEPTANCE':
      return { label: 'Pending Acceptance', className: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock }
    case 'ACCEPTED':
      return { label: 'Accepted', className: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle2 }
    case 'DECLINED':
      return { label: 'Declined by Supervisor', className: 'bg-rose-100 text-rose-800 border-rose-200', icon: XCircle }
    case 'CANCELLED':
      return { label: 'Cancelled', className: 'bg-slate-100 text-slate-700 border-slate-200', icon: XCircle }
    default:
      return { label: status, className: 'bg-slate-100 text-slate-700 border-slate-200', icon: Clock }
  }
}

export default function DgmAssignmentManagementPage() {
  const [unassignedProjects, setUnassignedProjects] = useState<UnassignedApprovedProject[]>([])
  const [supervisors, setSupervisors] = useState<SupervisorCandidate[]>([])
  const [assignments, setAssignments] = useState<ProjectAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal / Form state for Assignment
  const [selectedProject, setSelectedProject] = useState<UnassignedApprovedProject | null>(null)
  const [selectedSupervisorId, setSelectedSupervisorId] = useState('')
  const [assignedDeadline, setAssignedDeadline] = useState('')
  const [instructions, setInstructions] = useState('')
  const [assignmentRole, setAssignmentRole] = useState('Supervisor')
  const [assigning, setAssigning] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Status Filter for Assignments table
  const [statusFilter, setStatusFilter] = useState('ALL')

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [unassigned, sups, allAssigns] = await Promise.all([
        getUnassignedProjects(),
        getAvailableSupervisors(),
        getAllAssignments({ status: statusFilter !== 'ALL' ? statusFilter : undefined })
      ])
      setUnassignedProjects(unassigned)
      setSupervisors(sups)
      setAssignments(allAssigns)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load assignment data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [statusFilter])

  const openAssignModal = (proj: UnassignedApprovedProject) => {
    setSelectedProject(proj)
    setSelectedSupervisorId(supervisors[0]?.id || '')
    setAssignedDeadline(proj.targetEndDate ? proj.targetEndDate.split('T')[0] : '')
    setInstructions('')
    setAssignmentRole('Supervisor')
    setFormError(null)
  }

  const handleCreateAssignment = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedProject) return
    setFormError(null)

    if (!selectedSupervisorId) {
      setFormError('Please select a Digital Lab supervisor.')
      return
    }

    if (!assignedDeadline) {
      setFormError('Please provide an assignment completion deadline.')
      return
    }

    setAssigning(true)

    try {
      await createAssignment({
        projectId: selectedProject.id,
        supervisorUserId: selectedSupervisorId,
        assignedDeadline: new Date(assignedDeadline).toISOString(),
        instructions: instructions.trim() || undefined,
        assignmentRole
      })

      setSuccessMessage(`Project '${selectedProject.title}' successfully assigned to supervisor!`)
      setSelectedProject(null)
      fetchData()
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Assignment creation failed.')
    } finally {
      setAssigning(false)
    }
  }

  const handleCancelAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to cancel this assignment and return the project to the unassigned pool?')) return
    try {
      await cancelAssignment(assignmentId, { reason: 'DGM administrative reassignment' })
      fetchData()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to cancel assignment.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
              Project Supervisor Assignment Desk
            </span>
            <span className="text-xs text-slate-500">• DGM & Admin Desk</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Supervisor Assignment & Governance
          </h1>
          <p className="text-xs text-slate-500">
            Allocate approved departmental project proposals to active Digital Lab supervisors, configure delivery deadlines, and monitor acceptance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/proposals"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Proposals Review</span>
          </Link>
        </div>
      </div>

      {loading && (
        <div className="py-2 flex items-center gap-2 text-xs text-purple-700 font-semibold">
          <div className="w-3.5 h-3.5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Synchronizing assignment records...</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 text-xs font-bold">
          {error}
        </div>
      )}

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-amber-200 bg-amber-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Awaiting Supervisor</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-amber-900 mt-2">{unassignedProjects.length}</p>
          <span className="text-[11px] text-amber-700 font-semibold">Approved proposals ready for allocation</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-blue-200 bg-blue-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Digital Lab Supervisors</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-blue-900 mt-2">{supervisors.length}</p>
          <span className="text-[11px] text-blue-700 font-semibold">Active Lab technical leads</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-purple-200 bg-purple-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">Active Assignments</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-purple-900 mt-2">
            {assignments.filter(a => a.status === 'ACCEPTED').length}
          </p>
          <span className="text-[11px] text-purple-700 font-semibold">Under active supervisor execution</span>
        </div>
      </div>

      {/* Section 1: Approved Proposals Awaiting Supervisor Allocation */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              1. Approved Proposals Awaiting Supervisor Assignment
            </h2>
            <p className="text-[11px] text-slate-500">
              Approved by DGM. Select an active Digital Lab specialist to assign leadership and target deadline.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            {unassignedProjects.length} Pending Assignment
          </span>
        </div>

        {unassignedProjects.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">All approved proposals have been assigned!</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Review new proposals under the Proposals Review section to approve more initiatives.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {unassignedProjects.map(proj => (
              <div
                key={proj.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/10 transition flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                      {proj.projectCode}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Approved
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{proj.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{proj.businessProblem}</p>

                  <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-500">
                    <Building2 className="w-3.5 h-3.5 text-blue-700" />
                    <span className="font-semibold">{proj.departmentName}</span>
                    <span>•</span>
                    <span>Requester: {proj.requesterName}</span>
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    Approved: {proj.reviewedAt ? new Date(proj.reviewedAt).toLocaleDateString() : 'Recent'}
                  </span>
                  <button
                    onClick={() => openAssignModal(proj)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Assign Supervisor</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: All Project Assignments Audit & Status Overview */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              2. Assignment Directory & Status Tracking
            </h2>
            <p className="text-[11px] text-slate-500">
              Track supervisor response states (Pending Acceptance, Accepted, Declined, Cancelled).
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {['ALL', 'PENDING_ACCEPTANCE', 'ACCEPTED', 'DECLINED', 'CANCELLED'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  statusFilter === st
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {assignments.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">No assignments recorded.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {assignments.map(a => {
              const badge = getAssignmentStatusBadge(a.status)
              const BadgeIcon = badge.icon

              return (
                <div
                  key={a.id}
                  className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 hover:bg-slate-50/50 rounded-xl px-2 transition"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                        {a.projectCode}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${badge.className}`}>
                        <BadgeIcon className="w-3 h-3" />
                        <span>{badge.label}</span>
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 truncate">{a.projectTitle}</h4>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                      <span className="flex items-center gap-1 text-slate-700 font-semibold">
                        <User className="w-3.5 h-3.5 text-blue-700" />
                        Supervisor: {a.supervisorName}
                      </span>
                      <span>•</span>
                      <span>Target: {a.assignedDeadline ? new Date(a.assignedDeadline).toLocaleDateString() : 'N/A'}</span>
                      <span>•</span>
                      <span>Assigned: {new Date(a.assignedAt).toLocaleDateString()}</span>
                    </div>

                    {/* Decline Reason alert if declined */}
                    {a.status === 'DECLINED' && a.declineReason && (
                      <p className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200 mt-1">
                        <strong>Supervisor Decline Reason:</strong> {a.declineReason}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                    <Link
                      to={`/assignments/${a.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <span>View Specs</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>

                    {/* DGM can cancel pending assignment */}
                    {a.status === 'PENDING_ACCEPTANCE' && (
                      <button
                        onClick={() => handleCancelAssignment(a.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-bold text-rose-700 transition cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel Assignment</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Assignment Modal Form */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-700 text-white">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Assign Digital Lab Supervisor
                  </h3>
                  <p className="text-[11px] text-slate-500">{selectedProject.projectCode}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                <p className="font-bold text-slate-900">{selectedProject.title}</p>
                <p className="text-slate-500 text-[11px] line-clamp-2">{selectedProject.businessProblem}</p>
                <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-400">
                  <span>Dept: {selectedProject.departmentName}</span>
                  <span>•</span>
                  <span>Requester: {selectedProject.requesterName}</span>
                </div>
              </div>

              {/* Select Supervisor */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Active Digital Lab Supervisor <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedSupervisorId}
                  onChange={e => setSelectedSupervisorId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white"
                  required
                >
                  {supervisors.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.username}) — Active Projects: {s.activeAssignmentsCount}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Only active verified accounts with the DIGITAL_LAB_USER role can be assigned.
                </p>
              </div>

              {/* Target Project Deadline */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Assigned Project Deadline <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={assignedDeadline}
                  onChange={e => setAssignedDeadline(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white"
                  required
                />
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  DGM Assignment Instructions & Expectations <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  placeholder="Provide scope guidance, key milestones, or target delivery objectives for the supervisor..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedProject(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
                >
                  {assigning ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Confirming...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Confirm Assignment</span>
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
