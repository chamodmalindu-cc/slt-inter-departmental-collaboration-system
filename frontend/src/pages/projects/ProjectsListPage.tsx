import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, Clock, AlertTriangle, CheckCircle2, Filter, ChevronRight, Loader2 } from 'lucide-react'
import { getProjects } from '../../services/api'
import type { ProjectListItem } from '../../types/auth'
import { useAuth } from '../../context/AuthContext'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ASSIGNED:    { label: 'Assigned',    color: 'text-blue-700',   bg: 'bg-blue-100' },
  DEVELOPMENT: { label: 'Development', color: 'text-indigo-700', bg: 'bg-indigo-100' },
  TESTING:     { label: 'Testing',     color: 'text-yellow-700', bg: 'bg-yellow-100' },
  POC:         { label: 'POC',         color: 'text-orange-700', bg: 'bg-orange-100' },
  VALIDATE:    { label: 'Validation',  color: 'text-purple-700', bg: 'bg-purple-100' },
  HANDOVER:    { label: 'Handover',    color: 'text-green-700',  bg: 'bg-green-100' },
  APPROVED:    { label: 'Approved',    color: 'text-teal-700',   bg: 'bg-teal-100' },
  PENDING_REVIEW: { label: 'Pending Review', color: 'text-gray-600', bg: 'bg-gray-100' },
  REJECTED:    { label: 'Rejected',    color: 'text-red-700',    bg: 'bg-red-100' },
}

const PRIORITY_CONFIG: Record<string, { color: string }> = {
  High:   { color: 'text-red-600' },
  Medium: { color: 'text-yellow-600' },
  Low:    { color: 'text-green-600' },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'text-gray-600', bg: 'bg-gray-100' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

export default function ProjectsListPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<ProjectListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [search, setSearch] = useState('')

  const roles = user?.roles ?? []
  const isSupervisor = roles.includes('DIGITAL_LAB_USER')
  const isDgmAdmin = roles.includes('DGM') || roles.includes('ADMIN')
  const isHigher = roles.includes('HIGHER_MANAGEMENT')
  const isRequester = roles.includes('NON_DIGITAL_LAB_USER')

  useEffect(() => {
    setLoading(true)
    getProjects(filterStatus || undefined)
      .then(setProjects)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [filterStatus])

  const filtered = projects.filter(p =>
    !search ||
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.projectCode.toLowerCase().includes(search.toLowerCase()) ||
    p.departmentName.toLowerCase().includes(search.toLowerCase())
  )

  const overdue = filtered.filter(p => p.isOverdue).length
  const inProgress = filtered.filter(p => !['HANDOVER', 'PENDING_REVIEW', 'APPROVED', 'REJECTED'].includes(p.status)).length
  const done = filtered.filter(p => p.status === 'HANDOVER').length

  const statusFilters = isDgmAdmin || isHigher
    ? ['', 'ASSIGNED', 'DEVELOPMENT', 'TESTING', 'POC', 'VALIDATE', 'HANDOVER']
    : isSupervisor
      ? ['', 'ASSIGNED', 'DEVELOPMENT', 'TESTING', 'POC', 'VALIDATE', 'HANDOVER']
      : ['', 'PENDING_REVIEW', 'APPROVED', 'ASSIGNED', 'DEVELOPMENT', 'TESTING', 'POC', 'VALIDATE', 'HANDOVER', 'REJECTED']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <p className="text-sm text-gray-500 mt-1">
          {isSupervisor ? 'Your assigned projects and their lifecycle status' :
           isRequester ? 'Your submitted proposals and project status' :
           'All active projects across the organization'}
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg"><Briefcase className="w-5 h-5 text-blue-600" /></div>
          <div>
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-xl font-bold text-gray-900">{filtered.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="p-2 bg-yellow-50 rounded-lg"><Clock className="w-5 h-5 text-yellow-600" /></div>
          <div>
            <p className="text-xs text-gray-500">In Progress</p>
            <p className="text-xl font-bold text-gray-900">{inProgress}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-lg"><CheckCircle2 className="w-5 h-5 text-green-600" /></div>
          <div>
            <p className="text-xs text-gray-500">Completed</p>
            <p className="text-xl font-bold text-gray-900">{done}</p>
          </div>
        </div>
      </div>

      {overdue > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-red-700 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{overdue} project{overdue > 1 ? 's are' : ' is'} past the deadline.</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by title, code or department…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {statusFilters.map(s => (
              <option key={s} value={s}>{s ? (STATUS_CONFIG[s]?.label ?? s) : 'All Statuses'}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading projects…</span>
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-500">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No projects found</p>
            <p className="text-sm mt-1">
              {isSupervisor ? 'You have no assigned projects yet.' :
               isRequester ? 'You have not submitted any proposals yet.' :
               'No projects match your filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Project</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Department</th>
                  {!isSupervisor && <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Supervisor</th>}
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Priority</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Deadline</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{p.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{p.projectCode}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.departmentName}</td>
                    {!isSupervisor && (
                      <td className="px-4 py-3 text-gray-600">{p.supervisorName ?? <span className="text-gray-400 italic">Unassigned</span>}</td>
                    )}
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold text-xs ${PRIORITY_CONFIG[p.priority]?.color ?? 'text-gray-600'}`}>
                        {p.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {p.assignedDeadline || p.targetEndDate ? (
                        <span className={p.isOverdue ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                          {new Date(p.assignedDeadline ?? p.targetEndDate!).toLocaleDateString()}
                          {p.isOverdue && ' ⚠️'}
                        </span>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/projects/${p.id}`}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-xs"
                      >
                        View <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
