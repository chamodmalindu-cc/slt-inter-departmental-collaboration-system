import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, CheckCircle2, Activity, Flag } from 'lucide-react'
import { addProgressUpdate } from '../../services/api'
import type { CreateProgressUpdateRequest } from '../../types/auth'

export default function ProgressUpdateFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [form, setForm] = useState<CreateProgressUpdateRequest>({
    updateType: 'Progress',
    description: '',
    completedActivities: '',
    currentChallenges: '',
    nextPlannedActivities: '',
    milestoneTitle: '',
    milestoneDate: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    if (!form.description.trim()) {
      setError('Description is required.')
      return
    }
    if (form.updateType === 'Milestone' && !form.milestoneTitle?.trim()) {
      setError('Milestone title is required for Milestone updates.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await addProgressUpdate(id, {
        ...form,
        milestoneDate: form.milestoneDate || undefined,
        milestoneTitle: form.milestoneTitle || undefined,
      })
      setSuccess(true)
      setTimeout(() => navigate(`/projects/${id}`), 1500)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to submit update')
    } finally {
      setSubmitting(false)
    }
  }

  const updateTypeConfig = {
    Progress:  { icon: '📊', desc: 'General progress report on current work' },
    Milestone: { icon: '🏁', desc: 'Key milestone or achievement reached' },
    Issue:     { icon: '⚠️', desc: 'Problem or blocker encountered' },
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <button onClick={() => navigate(`/projects/${id}`)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-3">
          <ArrowLeft className="w-4 h-4" /> Back to Project
        </button>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Activity className="w-6 h-6 text-indigo-600" /> Add Progress Update
        </h1>
        <p className="text-sm text-gray-500 mt-1">Record your progress, milestones or issues for this project.</p>
      </div>

      {success ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
          <h3 className="font-semibold text-green-800 text-lg">Progress update submitted!</h3>
          <p className="text-green-700 text-sm mt-1">Redirecting back to project…</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          {/* Update Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Update Type *</label>
            <div className="grid grid-cols-3 gap-3">
              {(['Progress', 'Milestone', 'Issue'] as const).map(type => {
                const cfg = updateTypeConfig[type]
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, updateType: type }))}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      form.updateType === type
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-xl mb-1">{cfg.icon}</div>
                    <div className="font-semibold text-sm text-gray-800">{type}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{cfg.desc}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Milestone-specific fields */}
          {form.updateType === 'Milestone' && (
            <div className="grid grid-cols-2 gap-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Milestone Title *</label>
                <input
                  type="text"
                  value={form.milestoneTitle ?? ''}
                  onChange={e => setForm(f => ({ ...f, milestoneTitle: e.target.value }))}
                  placeholder="e.g. MVP Completed"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Milestone Date</label>
                <input
                  type="date"
                  value={form.milestoneDate ?? ''}
                  onChange={e => setForm(f => ({ ...f, milestoneDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description *</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe the current status, what was done, what's happening…"
              rows={4}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Completed Activities */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
              <span className="text-green-500">✅</span> Completed Activities
            </label>
            <textarea
              value={form.completedActivities ?? ''}
              onChange={e => setForm(f => ({ ...f, completedActivities: e.target.value }))}
              placeholder="List activities completed since last update…"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Current Challenges */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
              <span className="text-orange-500">⚠️</span> Current Challenges / Issues
            </label>
            <textarea
              value={form.currentChallenges ?? ''}
              onChange={e => setForm(f => ({ ...f, currentChallenges: e.target.value }))}
              placeholder="Describe any blockers or challenges…"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Next Planned Activities */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
              <span className="text-blue-500">▶</span> Next Planned Activities
            </label>
            <textarea
              value={form.nextPlannedActivities ?? ''}
              onChange={e => setForm(f => ({ ...f, nextPlannedActivities: e.target.value }))}
              placeholder="What will you work on next?…"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-lg text-sm font-semibold"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
              Submit Update
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
