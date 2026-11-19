import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, RefreshCw, Server, Database } from 'lucide-react'
import { checkHealth } from '../services/api'

type HealthData = {
  status: string
  timestamp: string
  service: string
  version: string
  database: { configured: boolean; connected: boolean; host: string; port: string; database: string }
}

export default function HealthPage() {
  const [data, setData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastChecked, setLastChecked] = useState('')

  const fetch = async () => {
    setLoading(true)
    setError(null)
    try {
      const d = await checkHealth()
      setData(d)
      setLastChecked(new Date().toLocaleTimeString())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch health data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [])

  const healthy = data?.status === 'Healthy'

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Server className="w-6 h-6 text-slate-500" /> System Health
        </h1>
        <button
          onClick={fetch}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium
                     rounded-xl hover:bg-blue-700 disabled:opacity-60 transition shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex gap-3 bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 mb-6">
          <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {data && (
        <div className="space-y-4">
          <div className={`flex items-center gap-4 p-5 rounded-2xl border ${healthy ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
            {healthy
              ? <CheckCircle2 className="w-7 h-7 text-emerald-500 shrink-0" />
              : <XCircle className="w-7 h-7 text-amber-500 shrink-0" />}
            <div>
              <p className={`text-lg font-extrabold ${healthy ? 'text-emerald-700' : 'text-amber-700'}`}>
                {data.status}
              </p>
              <p className="text-sm text-slate-500">{data.service} · v{data.version}</p>
            </div>
          </div>

          <div className={`flex items-center gap-4 p-5 rounded-2xl border ${data.database.connected ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
            <Database className={`w-6 h-6 shrink-0 ${data.database.connected ? 'text-blue-500' : 'text-red-500'}`} />
            <div>
              <p className="text-sm font-bold text-slate-900">PostgreSQL</p>
              <p className="text-xs text-slate-500">{data.database.host}:{data.database.port}/{data.database.database}</p>
            </div>
            <span className={`ml-auto text-xs font-semibold px-2.5 py-1 rounded-full ${data.database.connected ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
              {data.database.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {lastChecked && (
            <p className="text-right text-xs text-slate-400">Last checked: {lastChecked}</p>
          )}
        </div>
      )}
    </div>
  )
}
