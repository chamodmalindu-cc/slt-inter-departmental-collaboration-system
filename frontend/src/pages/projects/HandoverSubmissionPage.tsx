import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, CheckCircle2, Package, AlertCircle } from 'lucide-react'
import { getProjectById, submitHandover } from '../../services/api'
import type { ProjectDetail, SubmitHandoverRequest } from '../../types/auth'

export default function HandoverSubmissionPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [loadingProject, setLoadingProject] = useState(true)
  const [form, setForm] = useState<SubmitHandoverRequest>({
    finalSummary: '',
    deliverablesCompleted: '',
    technicalDocumentationLinks: '',
    deploymentDetails: '',
    knownLimitations: '',
    recommendations: '',
    handoverDate: new Date().toISOString().split('T')[0],
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoadingProject(true)
    getProjectById(id)
      .then(p => {
        setProject(p)
        if (!p.canSubmitHandover) navigate(`/projects/${id}`)
      })
      .catch(() => navigate(`/projects/${id}`))
      .finally(() => setLoadingProject(false))
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    if (!form.finalSummary.trim() || !form.deliverablesCompleted.trim()) {
      setError('Final summary and deliverables completed are required.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await submitHandover(id, form)
      setSuccess(true)
      setTimeout(() => navigate(`/projects/${id}`), 2000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to submit handover')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingProject) return (
    <div className="flex items-center justify-center py-20 gap-3 text-gray-500">
      <Loader2 className="w-5 h-5 animate-spin" /> Loading…
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <button onClick={() => navigate(`/projects/${id}`)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-3">
          <ArrowLeft className="w-4 h-4" /> Back to Project
        </button>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="w-6 h-6 text-green-600" /> Submit Formal Handover
        </h1>
        {project && (
          <p className="text-sm text-gray-500 mt-1">{project.projectCode} — {project.title}</p>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-1">Important</p>
          <p>Once submitted, this handover record is permanent and cannot be edited. DGM and the requester will be notified and can then rate your performance.</p>
        </div>
      </div>

      {success ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="font-bold text-green-800 text-xl">Handover Submitted Successfully!</h3>
          <p className="text-green-700 text-sm mt-2">DGM and the requester have been notified. Redirecting…</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Handover Date *</label>
            <input
              type="date"
              value={form.handoverDate}
              onChange={e => setForm(f => ({ ...f, handoverDate: e.target.value }))}
              required
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Final Summary *</label>
            <p className="text-xs text-gray-400 mb-1">Provide a comprehensive summary of what was achieved.</p>
            <textarea
              value={form.finalSummary}
              onChange={e => setForm(f => ({ ...f, finalSummary: e.target.value }))}
              placeholder="Summarize the project outcome and what was delivered…"
              rows={4}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Deliverables Completed *</label>
            <p className="text-xs text-gray-400 mb-1">List all deliverables that were completed.</p>
            <textarea
              value={form.deliverablesCompleted}
              onChange={e => setForm(f => ({ ...f, deliverablesCompleted: e.target.value }))}
              placeholder="1. Feature A implemented&#10;2. Database schema designed&#10;3. API endpoints deployed…"
              rows={4}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Technical Documentation / Reference Links</label>
            <textarea
              value={form.technicalDocumentationLinks ?? ''}
              onChange={e => setForm(f => ({ ...f, technicalDocumentationLinks: e.target.value }))}
              placeholder="Links to documentation, repos, wikis, design documents…"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Deployment / Implementation Details</label>
            <textarea
              value={form.deploymentDetails ?? ''}
              onChange={e => setForm(f => ({ ...f, deploymentDetails: e.target.value }))}
              placeholder="Describe how the solution was deployed or implemented…"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Known Limitations</label>
            <textarea
              value={form.knownLimitations ?? ''}
              onChange={e => setForm(f => ({ ...f, knownLimitations: e.target.value }))}
              placeholder="Describe any known limitations or constraints of the solution…"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Recommendations & Future Improvements</label>
            <textarea
              value={form.recommendations ?? ''}
              onChange={e => setForm(f => ({ ...f, recommendations: e.target.value }))}
              placeholder="Suggest future improvements or next steps…"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-lg text-sm font-semibold"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
              Submit Formal Handover
            </button>
            <button
              type="button"
              onClick={() => navigate(`/projects/${id}`)}
              className="px-5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
