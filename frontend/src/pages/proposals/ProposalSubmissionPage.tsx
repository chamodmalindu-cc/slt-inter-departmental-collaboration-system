import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { createProposal } from '../../services/api'
import {
  FileText,
  Building2,
  Calendar,
  AlertCircle,
  ArrowLeft,
  Send,
  DollarSign,
  TrendingUp,
  Cpu,
  Sparkles
} from 'lucide-react'

export default function ProposalSubmissionPage() {
  const { user } = useAuth()
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

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Project Title is required.')
      return
    }
    if (!businessProblem.trim()) {
      setError('Research / Business Problem is required.')
      return
    }
    if (!expectedOutcome.trim()) {
      setError('Expected Outcome is required.')
      return
    }

    setLoading(true)

    try {
      const created = await createProposal({
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

      navigate(`/proposals/${created.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit proposal. Please verify all inputs.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumb Back Button */}
      <div className="flex items-center justify-between">
        <Link
          to="/proposals"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Proposals</span>
        </Link>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white shadow-md">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-200 border border-blue-400/30">
            Department Proposal Submission
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Submit Project Proposal</h1>
        <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-2xl leading-relaxed">
          Propose an innovative problem or engineering initiative to the Deputy General Manager (DGM) for review and future Digital Lab assignment.
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-rose-800">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider">Submission Error</h4>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        {/* Section 1: Core Details */}
        <div className="space-y-4">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <FileText className="w-4 h-4 text-blue-700" />
            <span>1. Project Identification</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div className="sm:col-span-2">
              <label htmlFor="title" className="block text-xs font-bold text-slate-700 mb-1.5">
                Project Title <span className="text-rose-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Automated Optical Line Terminal Health Telemetry System"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                required
              />
            </div>

            {/* Department (Auto-retrieved from logged-in user) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Submitting Department <span className="text-xs font-normal text-slate-400">(Auto-retrieved)</span>
              </label>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <Building2 className="w-4 h-4 text-blue-700 shrink-0" />
                <span className="font-semibold truncate">{user?.departmentName || 'Your Department'}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 font-bold ml-auto shrink-0">
                  {user?.departmentCode || 'DEPT'}
                </span>
              </div>
            </div>

            {/* Priority */}
            <div>
              <label htmlFor="priority" className="block text-xs font-bold text-slate-700 mb-1.5">
                Target Priority Level
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

        {/* Section 2: Problem & Expected Outcome */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <Cpu className="w-4 h-4 text-indigo-700" />
            <span>2. Technical & Business Scope</span>
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
              placeholder="Describe the operational challenge, inefficiency, or technical limitation faced by your department..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
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
              placeholder="What software, algorithm, automated dashboard, or IoT telemetry system should the Digital Lab develop?"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
              required
            ></textarea>
          </div>
        </div>

        {/* Section 3: Business Impact */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <TrendingUp className="w-4 h-4 text-emerald-700" />
            <span>3. Business Impact & Value Proposition</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                impactCostSaving
                  ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-bold'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
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
                <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                  Reduces field costs, fuel, consumables or operational expenses.
                </p>
              </div>
            </label>

            <label
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                impactRevenue
                  ? 'border-blue-500 bg-blue-50/50 text-blue-950 font-bold'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
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
                <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                  Creates new enterprise telecom offerings or billing channels.
                </p>
              </div>
            </label>

            <label
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                impactProcessOptimization
                  ? 'border-purple-500 bg-purple-50/50 text-purple-950 font-bold'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
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
                <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                  Automates manual workflows, cuts MTTR and eliminates delays.
                </p>
              </div>
            </label>
          </div>

          <div>
            <label htmlFor="quantifiedImpact" className="block text-xs font-bold text-slate-700 mb-1.5">
              Quantifying Business Impact
            </label>
            <input
              id="quantifiedImpact"
              type="text"
              value={quantifiedImpact}
              onChange={e => setQuantifiedImpact(e.target.value)}
              placeholder="e.g. Expected saving of LKR 14.5M annually and 65% reduction in technician dispatch latency"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Section 4: Target Deadline & Additional Info */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <Calendar className="w-4 h-4 text-amber-700" />
            <span>4. Schedule & Additional Context</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="targetDeadline" className="block text-xs font-bold text-slate-700 mb-1.5">
                Target Delivery Deadline
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
                Additional Information & Technical Constraints
              </label>
              <textarea
                id="additionalInformation"
                rows={2}
                value={additionalInformation}
                onChange={e => setAdditionalInformation(e.target.value)}
                placeholder="Mention any hardware dependencies, existing third-party APIs (Huawei/ZTE/Cisco), or data sensitivity constraints..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3">
          <Link
            to="/proposals"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition text-center"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Submitting to DGM...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Submit Proposal</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
