import { Link } from 'react-router-dom'
import { ShieldOff, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function UnauthorizedPage() {
  const { user } = useAuth()
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-100 mb-5">
          <ShieldOff className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Access Denied</h1>
        <p className="text-slate-500 text-sm mb-6">
          You do not have permission to access this page.
          {user && (
            <> Your current role{user.roles.length > 1 ? 's are' : ' is'}{' '}
              <strong className="text-slate-700">{user.roles.join(', ')}</strong>.
            </>
          )}
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 text-white text-sm font-semibold
                     rounded-xl hover:bg-blue-800 transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
