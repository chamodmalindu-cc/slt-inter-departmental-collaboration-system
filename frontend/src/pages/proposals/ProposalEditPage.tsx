import { useEffect, useState, type FormEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getProposalById, updateProposal } from '../../services/api'
import {
  FileText,
  Building2,
  Calendar,
  AlertCircle,
  ArrowLeft,
  Save,
  DollarSign,
  TrendingUp,
  Cpu,
  Sparkles
} from 'lucide-react'

export default function ProposalEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [businessProblem, setBusinessProblem] = useState('')
  const [expectedOutcome, setExpectedOutcome] = useState('')
  const [impactCostSaving, setImpactCostSaving] = useState(false)
  const [impactRevenue, setImpactRevenue] = useState(false)
  const [impactProcessOptimization, setImpactProcessOptimization] = useState(false)
  const [quantifiedImpact, setQuantifiedImpact] = useState('')
  const [targetDeadline, setTargetDeadline] = useState('')
  const [additionalInformation, setAdditionalInformation] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [departmentName, setDepartmentName] = useState('')
  const [projectCode, setProjectCode] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cannotEditReason, setCannotEditReason] = useState<string | null>(null)

  useEffect(() => {
    async function loadProposal() {
      if (!id) return
      setLoading(true)
      try {
        const p = await getProposalById(id)
        if (p.status !== 'PENDING_REVIEW') {
          setCannotEditReason(`This proposal cannot be edited because its current status is '${p.status}'. Editing is only permitted while status is 'PENDING_REVIEW'.`)
          return
        }

        setTitle(p.title)
        setBusinessProblem(p.businessProblem)
        setExpectedOutcome(p.expectedOutcome)
        setImpactCostSaving(p.impactCostSaving)
        setImpactRevenue(p.impactRevenue)
        setImpactProcessOptimization(p.impactProcessOptimization)
        setQuantifiedImpact(p.quantifiedImpact || '')
        setTargetDeadline(p.targetEndDate ? p.targetEndDate.split('T')[0] : '')
        setAdditionalInformation(p.additionalInformation || '')
        setPriority(p.priority || 'Medium')
        setDepartmentName(p.departmentName)
        setProjectCode(p.projectCode)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to fetch proposal for editing.')
      } finally {
        setLoading(false)
      }
    }
    loadProposal()
  }, [id])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim() || !businessProblem.trim() || !expectedOutcome.trim()) {
      setError('Please fill in all mandatory fields.')
      return
    }

    if (!id) return
    setSaving(true)

    try {
      await updateProposal(id, {
        title: title.trim(),
        businessProblem: businessProblem.trim(),
        expectedOutcome: expectedOutcome.trim(),
        impactCostSaving,
        impactRevenue,
        impactProcessOptimization,
        quantifiedImpact: quantifiedImpact.trim() || undefined,
        targetDeadline: targetDeadline ? new Date(targetDeadline).toISOString() : undefined,
        additionalInformation: additionalInformation.trim() || undefined,
        priority
      })

      navigate(`/proposals/${id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update proposal.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-500">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-semibold">Loading proposal for editing...</p>
      </div>
    )
  }

  if (cannotEditReason) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Editing Locked</h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto">{cannotEditReason}</p>
        <Link
          to={`/proposals/${id}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>View Proposal Details</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Link
          to={`/proposals/${id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Proposal Details</span>
        </Link>
      </div>

      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white shadow-md">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded bg-white/20 text-white border border-white/30">
            {projectCode}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-400 text-amber-950">
            Status: Pending Review
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Edit Project Proposal</h1>
        <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-2xl leading-relaxed">
          Modify proposal parameters prior to DGM executive review. Once evaluated, details will be permanently locked.
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-rose-800">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider">Update Error</h4>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        {/* Section 1 */}
        <div className="space-y-4">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <FileText className="w-4 h-4 text-blue-700" />
            <span>1. Project Identification</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="title" className="block text-xs font-bold text-slate-700 mb-1.5">
                Project Title <span className="text-rose-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Department</label>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-semibold">
                <Building2 className="w-4 h-4 text-blue-700" />
                <span>{departmentName}</span>
              </div>
            </div>

            <div>
              <label htmlFor="priority" className="block text-xs font-bold text-slate-700 mb-1.5">
                Priority Level
              </label>
              <select
                id="priority"
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority (Critical)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2 */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <Cpu className="w-4 h-4 text-indigo-700" />
            <span>2. Scope & Problem Statement</span>
          </h2>

          <div>
            <label htmlFor="businessProblem" className="block text-xs font-bold text-slate-700 mb-1.5">
              Research / Business Problem <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="businessProblem"
              rows={4}
              value={businessProblem}
              onChange={e => setBusinessProblem(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            ></textarea>
          </div>

          <div>
            <label htmlFor="expectedOutcome" className="block text-xs font-bold text-slate-700 mb-1.5">
              Expected Outcome & Deliverables <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="expectedOutcome"
              rows={3}
              value={expectedOutcome}
              onChange={e => setExpectedOutcome(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            ></textarea>
          </div>
        </div>

        {/* Section 3 */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <TrendingUp className="w-4 h-4 text-emerald-700" />
            <span>3. Business Impact</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
              impactCostSaving ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-bold' : 'border-slate-200 hover:bg-slate-50'
            }`}>
              <input
                type="checkbox"
                checked={impactCostSaving}
                onChange={e => setImpactCostSaving(e.target.checked)}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <div className="text-xs">
                <span className="font-bold flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Opex / Cost Saving
                </span>
              </div>
            </label>

            <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
              impactRevenue ? 'border-blue-500 bg-blue-50/50 text-blue-950 font-bold' : 'border-slate-200 hover:bg-slate-50'
            }`}>
              <input
                type="checkbox"
                checked={impactRevenue}
                onChange={e => setImpactRevenue(e.target.checked)}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <div className="text-xs">
                <span className="font-bold flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-600" /> Revenue Generation
                </span>
              </div>
            </label>

            <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
              impactProcessOptimization ? 'border-purple-500 bg-purple-50/50 text-purple-950 font-bold' : 'border-slate-200 hover:bg-slate-50'
            }`}>
              <input
                type="checkbox"
                checked={impactProcessOptimization}
                onChange={e => setImpactProcessOptimization(e.target.checked)}
                className="mt-0.5 rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
              />
              <div className="text-xs">
                <span className="font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Process Optimization
                </span>
              </div>
            </label>
          </div>

          <div>
            <label htmlFor="quantifiedImpact" className="block text-xs font-bold text-slate-700 mb-1.5">
              Quantified Impact
            </label>
            <input
              id="quantifiedImpact"
              type="text"
              value={quantifiedImpact}
              onChange={e => setQuantifiedImpact(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Section 4 */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <Calendar className="w-4 h-4 text-amber-700" />
            <span>4. Schedule & Notes</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="targetDeadline" className="block text-xs font-bold text-slate-700 mb-1.5">
                Target Deadline
              </label>
              <input
                id="targetDeadline"
                type="date"
                value={targetDeadline}
                onChange={e => setTargetDeadline(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="additionalInformation" className="block text-xs font-bold text-slate-700 mb-1.5">
                Additional Information
              </label>
              <textarea
                id="additionalInformation"
                rows={2}
                value={additionalInformation}
                onChange={e => setAdditionalInformation(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              ></textarea>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
          <Link
            to={`/proposals/${id}`}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
