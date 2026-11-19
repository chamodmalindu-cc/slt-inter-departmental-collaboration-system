import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Loader2, AlertCircle, CheckCircle2, TrendingUp,
  MessageSquare, Star, ChevronRight, Info, Flag, Award,
  Activity, Package
} from 'lucide-react'
import {
  getProjectById, updateProjectStatus, submitRating
} from '../../services/api'
import type { ProjectDetail, SubmitRatingRequest } from '../../types/auth'

const STATUS_CHAIN = ['ASSIGNED', 'DEVELOPMENT', 'TESTING', 'POC', 'VALIDATE', 'HANDOVER']

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  ASSIGNED:    { label: 'Assigned',    color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  DEVELOPMENT: { label: 'Development', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  TESTING:     { label: 'Testing',     color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  POC:         { label: 'POC',         color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  VALIDATE:    { label: 'Validation',  color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  HANDOVER:    { label: 'Handover',    color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200' },
  PENDING_REVIEW: { label: 'Pending Review', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
  APPROVED:    { label: 'Approved',    color: 'text-teal-700',   bg: 'bg-teal-50',   border: 'border-teal-200' },
  REJECTED:    { label: 'Rejected',    color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200' },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' }
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      {cfg.label}
    </span>
  )
}

function StarRatingInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-600 mb-1">{label}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} type="button" onClick={() => onChange(n)} className="focus:outline-none">
            <Star className={`w-6 h-6 transition-colors ${n <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Status update
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [statusComment, setStatusComment] = useState('')
  const [statusError, setStatusError] = useState<string | null>(null)
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null)

  // Rating
  const [showRatingForm, setShowRatingForm] = useState(false)
  const [rating, setRating] = useState<SubmitRatingRequest>({
    technicalQuality: 0, communication: 0, timelyDelivery: 0, professionalism: 0, overallRating: 0
  })
  const [ratingError, setRatingError] = useState<string | null>(null)
  const [submittingRating, setSubmittingRating] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'handover' | 'ratings'>('overview')

  const reload = () => {
    if (!id) return
    setLoading(true)
    getProjectById(id)
      .then(setProject)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { reload() }, [id])

  const nextStatus = project ? STATUS_CHAIN[STATUS_CHAIN.indexOf(project.status) + 1] : null
  const statusIdx = project ? STATUS_CHAIN.indexOf(project.status) : -1

  const handleStatusUpdate = async () => {
    if (!project || !nextStatus) return
    setUpdatingStatus(true)
    setStatusError(null)
    setStatusSuccess(null)
    try {
      await updateProjectStatus(project.id, { newStatus: nextStatus, comments: statusComment })
      setStatusSuccess(`Project advanced to ${STATUS_CONFIG[nextStatus]?.label ?? nextStatus}!`)
      setStatusComment('')
      reload()
    } catch (e: unknown) {
      setStatusError(e instanceof Error ? e.message : 'Failed to update status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleRatingSubmit = async () => {
    if (!project) return
    const scores = [rating.technicalQuality, rating.communication, rating.timelyDelivery, rating.professionalism, rating.overallRating]
    if (scores.some(s => s < 1 || s > 5)) {
      setRatingError('Please fill all rating dimensions (1–5 stars each).')
      return
    }
    setSubmittingRating(true)
    setRatingError(null)
    try {
      await submitRating(project.id, rating)
      setShowRatingForm(false)
      reload()
    } catch (e: unknown) {
      setRatingError(e instanceof Error ? e.message : 'Failed to submit rating')
    } finally {
      setSubmittingRating(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20 gap-3 text-gray-500">
      <Loader2 className="w-5 h-5 animate-spin" /> Loading project…
    </div>
  )

  if (error || !project) return (
    <div className="text-center py-20 text-red-500">
      <AlertCircle className="w-10 h-10 mx-auto mb-3" />
      <p>{error ?? 'Project not found.'}</p>
      <button onClick={() => navigate('/projects')} className="mt-4 text-blue-600 hover:underline text-sm">← Back to Projects</button>
    </div>
  )

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back + header */}
      <div>
        <button onClick={() => navigate('/projects')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-3">
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </button>
        <div className="flex flex-wrap items-start gap-3 justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
            <p className="text-sm text-gray-400 mt-1">{project.projectCode} · {project.departmentName}</p>
          </div>
          <StatusBadge status={project.status} />
        </div>
      </div>

      {/* Lifecycle progress bar */}
      {STATUS_CHAIN.includes(project.status) && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" /> Project Lifecycle
          </h2>
          <div className="flex items-center gap-0">
            {STATUS_CHAIN.map((s, i) => {
              const done = i <= statusIdx
              const current = i === statusIdx
              const cfg = STATUS_CONFIG[s]
              return (
                <div key={s} className="flex-1 flex flex-col items-center">
                  <div className="relative flex items-center w-full">
                    {i > 0 && <div className={`flex-1 h-1 ${i <= statusIdx ? 'bg-blue-500' : 'bg-gray-200'}`} />}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 font-bold text-xs z-10
                      ${current ? 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100'
                        : done ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-white border-gray-300 text-gray-400'}`}>
                      {done && !current ? '✓' : i + 1}
                    </div>
                    {i < STATUS_CHAIN.length - 1 && <div className={`flex-1 h-1 ${i < statusIdx ? 'bg-blue-500' : 'bg-gray-200'}`} />}
                  </div>
                  <span className={`text-xs mt-2 font-medium text-center ${current ? cfg.color : done ? 'text-blue-600' : 'text-gray-400'}`}>
                    {cfg.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Status Update (supervisor only) */}
      {project.canUpdateStatus && nextStatus && (
        <div className="bg-white rounded-xl border border-blue-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Flag className="w-4 h-4 text-blue-600" /> Advance Project Status
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            Move project from <strong>{STATUS_CONFIG[project.status]?.label}</strong> → <strong>{STATUS_CONFIG[nextStatus]?.label ?? nextStatus}</strong>
          </p>
          <textarea
            value={statusComment}
            onChange={e => setStatusComment(e.target.value)}
            placeholder="Optional comment about this status change…"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
          />
          {statusError && <p className="text-red-600 text-sm mb-2">{statusError}</p>}
          {statusSuccess && <p className="text-green-600 text-sm mb-2 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" />{statusSuccess}</p>}
          <button
            onClick={handleStatusUpdate}
            disabled={updatingStatus}
            className="bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
          >
            {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
            Advance to {STATUS_CONFIG[nextStatus]?.label ?? nextStatus}
          </button>
        </div>
      )}

      {/* Add Progress / Handover shortcuts */}
      <div className="flex flex-wrap gap-3">
        {project.canAddProgress && (
          <Link
            to={`/projects/${project.id}/progress/new`}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
          >
            <Activity className="w-4 h-4" /> Add Progress Update
          </Link>
        )}
        {project.canSubmitHandover && (
          <Link
            to={`/projects/${project.id}/handover`}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
          >
            <Package className="w-4 h-4" /> Submit Handover
          </Link>
        )}
        {project.status === 'HANDOVER' && (
          <Link
            to={`/messages?projectId=${project.id}`}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-semibold"
          >
            <MessageSquare className="w-4 h-4" /> Open Chat
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {(['overview', 'progress', 'handover', 'ratings'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-medium capitalize border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-700 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'overview' && <Info className="w-3.5 h-3.5 inline mr-1.5" />}
              {tab === 'progress' && <Activity className="w-3.5 h-3.5 inline mr-1.5" />}
              {tab === 'handover' && <Package className="w-3.5 h-3.5 inline mr-1.5" />}
              {tab === 'ratings' && <Star className="w-3.5 h-3.5 inline mr-1.5" />}
              {tab}
              {tab === 'progress' && project.progressUpdates.length > 0 && (
                <span className="ml-1.5 bg-indigo-100 text-indigo-700 text-xs rounded-full px-1.5">{project.progressUpdates.length}</span>
              )}
              {tab === 'ratings' && project.ratings.length > 0 && (
                <span className="ml-1.5 bg-yellow-100 text-yellow-700 text-xs rounded-full px-1.5">{project.ratings.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Requester</p>
                  <p className="text-sm font-medium text-gray-800">{project.requesterName}</p>
                  <p className="text-xs text-gray-400">{project.requesterEmail}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Supervisor</p>
                  {project.supervisorName ? (
                    <>
                      <p className="text-sm font-medium text-gray-800">{project.supervisorName}</p>
                      <p className="text-xs text-gray-400">{project.supervisorEmail}</p>
                    </>
                  ) : <p className="text-sm text-gray-400 italic">Not yet assigned</p>}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Priority</p>
                  <span className={`text-sm font-semibold ${
                    project.priority === 'High' ? 'text-red-600' :
                    project.priority === 'Medium' ? 'text-yellow-600' : 'text-green-600'
                  }`}>{project.priority}</span>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Target Deadline</p>
                  <p className="text-sm text-gray-800">{project.assignedDeadline ? new Date(project.assignedDeadline).toLocaleDateString() : project.targetEndDate ? new Date(project.targetEndDate).toLocaleDateString() : '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Started</p>
                  <p className="text-sm text-gray-800">{project.startDate ? new Date(project.startDate).toLocaleDateString() : '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Business Impact</p>
                  <div className="flex flex-wrap gap-1.5">
                    {project.impactCostSaving && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">Cost Saving</span>}
                    {project.impactRevenue && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200">Revenue</span>}
                    {project.impactProcessOptimization && <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">Process Optimization</span>}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Business Problem</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{project.businessProblem}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Expected Outcome</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{project.expectedOutcome}</p>
            </div>

            {/* Status History */}
            {project.statusHistory.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Status History</p>
                <div className="relative pl-4 border-l-2 border-gray-200 space-y-4">
                  {project.statusHistory.map(h => (
                    <div key={h.id} className="relative">
                      <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />
                      <div className="bg-gray-50 rounded-lg p-3 text-sm">
                        <div className="flex items-center gap-2 flex-wrap">
                          {h.previousStatus && (
                            <span className="text-gray-400 text-xs line-through">{h.previousStatus}</span>
                          )}
                          <span className="text-blue-700 font-semibold text-xs">→ {h.newStatus}</span>
                          <span className="text-gray-400 text-xs ml-auto">{new Date(h.changedAt).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">by {h.changedByName}</p>
                        {h.remarks && <p className="text-xs text-gray-500 mt-1 italic">"{h.remarks}"</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-800">Progress Updates</h3>
              {project.canAddProgress && (
                <Link
                  to={`/projects/${project.id}/progress/new`}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
                >
                  <Activity className="w-3.5 h-3.5" /> Add Update
                </Link>
              )}
            </div>
            {project.progressUpdates.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No progress updates yet.</p>
                {project.canAddProgress && <p className="text-sm mt-1">Add your first progress update above.</p>}
              </div>
            ) : (
              <div className="space-y-4">
                {project.progressUpdates.map(pu => {
                  const typeColor = pu.updateType === 'Milestone' ? 'bg-green-100 text-green-700' :
                    pu.updateType === 'Issue' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                  return (
                    <div key={pu.id} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeColor}`}>{pu.updateType}</span>
                          {pu.milestoneTitle && <span className="text-sm font-medium text-gray-800">🏁 {pu.milestoneTitle}</span>}
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">{new Date(pu.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{pu.description}</p>
                      {pu.completedActivities && (
                        <div className="mt-2 p-2 bg-green-50 rounded-lg">
                          <p className="text-xs font-semibold text-green-700 mb-1">✅ Completed</p>
                          <p className="text-xs text-green-800">{pu.completedActivities}</p>
                        </div>
                      )}
                      {pu.currentChallenges && (
                        <div className="mt-2 p-2 bg-orange-50 rounded-lg">
                          <p className="text-xs font-semibold text-orange-700 mb-1">⚠️ Challenges</p>
                          <p className="text-xs text-orange-800">{pu.currentChallenges}</p>
                        </div>
                      )}
                      {pu.nextPlannedActivities && (
                        <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                          <p className="text-xs font-semibold text-blue-700 mb-1">▶ Next Steps</p>
                          <p className="text-xs text-blue-800">{pu.nextPlannedActivities}</p>
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-2">by {pu.supervisorName}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Handover Tab */}
        {activeTab === 'handover' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-800">Project Handover</h3>
              {project.canSubmitHandover && (
                <Link
                  to={`/projects/${project.id}/handover`}
                  className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
                >
                  <Package className="w-3.5 h-3.5" /> Submit Handover
                </Link>
              )}
            </div>
            {!project.handover ? (
              <div className="text-center py-10 text-gray-400">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>{project.status === 'HANDOVER' ? 'Handover not yet submitted by supervisor.' : 'Project has not reached handover stage yet.'}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-green-800 text-sm">Handover Submitted</span>
                    <span className="text-xs text-green-600 ml-auto">{new Date(project.handover.submittedAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-green-700">Handover date: {new Date(project.handover.handoverDate).toLocaleDateString()}</p>
                  <p className="text-xs text-green-700">Submitted by: {project.handover.supervisorName}</p>
                </div>
                {[
                  { label: 'Final Summary', value: project.handover.finalSummary },
                  { label: 'Deliverables Completed', value: project.handover.deliverablesCompleted },
                  { label: 'Technical Documentation / Links', value: project.handover.technicalDocumentationLinks },
                  { label: 'Deployment Details', value: project.handover.deploymentDetails },
                  { label: 'Known Limitations', value: project.handover.knownLimitations },
                  { label: 'Recommendations', value: project.handover.recommendations },
                ].filter(item => item.value).map(item => (
                  <div key={item.label} className="border border-gray-200 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{item.label}</p>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{item.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Ratings Tab */}
        {activeTab === 'ratings' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-800">Supervisor Performance Ratings</h3>
              {project.canRate && !project.hasRated && (
                <button
                  onClick={() => setShowRatingForm(true)}
                  className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
                >
                  <Star className="w-3.5 h-3.5" /> Rate Supervisor
                </button>
              )}
              {project.hasRated && (
                <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" /> You have rated
                </span>
              )}
            </div>

            {showRatingForm && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 mb-5">
                <h4 className="font-semibold text-gray-800 mb-4">Rate {project.supervisorName}</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <StarRatingInput label="Technical Quality" value={rating.technicalQuality} onChange={v => setRating(r => ({ ...r, technicalQuality: v }))} />
                  <StarRatingInput label="Communication" value={rating.communication} onChange={v => setRating(r => ({ ...r, communication: v }))} />
                  <StarRatingInput label="Timely Delivery" value={rating.timelyDelivery} onChange={v => setRating(r => ({ ...r, timelyDelivery: v }))} />
                  <StarRatingInput label="Professionalism" value={rating.professionalism} onChange={v => setRating(r => ({ ...r, professionalism: v }))} />
                  <StarRatingInput label="Overall Rating" value={rating.overallRating} onChange={v => setRating(r => ({ ...r, overallRating: v }))} />
                </div>
                <textarea
                  value={rating.writtenFeedback ?? ''}
                  onChange={e => setRating(r => ({ ...r, writtenFeedback: e.target.value }))}
                  placeholder="Written feedback (optional)…"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 mb-3"
                />
                {ratingError && <p className="text-red-600 text-sm mb-2">{ratingError}</p>}
                <div className="flex gap-3">
                  <button
                    onClick={handleRatingSubmit}
                    disabled={submittingRating}
                    className="bg-yellow-500 hover:bg-yellow-600 disabled:opacity-60 text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
                  >
                    {submittingRating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                    Submit Rating
                  </button>
                  <button onClick={() => setShowRatingForm(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {project.ratings.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No ratings submitted yet.</p>
                {project.canRate && !project.hasRated && <p className="text-sm mt-1">Be the first to rate the supervisor.</p>}
              </div>
            ) : (
              <div className="space-y-4">
                {project.ratings.map(r => {
                  const dims = [
                    { label: 'Technical Quality', value: r.technicalQuality },
                    { label: 'Communication', value: r.communication },
                    { label: 'Timely Delivery', value: r.timelyDelivery },
                    { label: 'Professionalism', value: r.professionalism },
                    { label: 'Overall', value: r.overallRating },
                  ]
                  return (
                    <div key={r.id} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2.5 py-1 rounded-full">{r.raterType}</span>
                        <span className="text-sm text-gray-600">by {r.raterName}</span>
                        <span className="ml-auto text-2xl font-bold text-yellow-500">{r.averageScore}<span className="text-sm text-gray-400">/5</span></span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                        {dims.map(d => (
                          <div key={d.label} className="text-center">
                            <div className="flex justify-center gap-0.5 mb-1">
                              {[1, 2, 3, 4, 5].map(n => (
                                <Star key={n} className={`w-3.5 h-3.5 ${n <= d.value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                              ))}
                            </div>
                            <p className="text-xs text-gray-500">{d.label}</p>
                          </div>
                        ))}
                      </div>
                      {r.writtenFeedback && (
                        <p className="text-sm text-gray-600 italic bg-gray-50 rounded-lg px-3 py-2">"{r.writtenFeedback}"</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">{new Date(r.createdAt).toLocaleDateString()}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
