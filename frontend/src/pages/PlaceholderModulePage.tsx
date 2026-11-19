import { Link } from 'react-router-dom'
import {
  FolderKanban,
  FileText,
  MessageSquare,
  Bell,
  BarChart3,
  Users,
  ShieldAlert,
  Construction,
  ArrowLeft
} from 'lucide-react'

interface PlaceholderProps {
  moduleName: string
  description: string
  iconType: 'projects' | 'proposals' | 'messages' | 'notifications' | 'reports' | 'users' | 'audit'
}

export default function PlaceholderModulePage({
  moduleName,
  description,
  iconType
}: PlaceholderProps) {
  const renderIcon = () => {
    switch (iconType) {
      case 'projects':
        return <FolderKanban className="w-8 h-8 text-blue-700" />
      case 'proposals':
        return <FileText className="w-8 h-8 text-purple-700" />
      case 'messages':
        return <MessageSquare className="w-8 h-8 text-indigo-700" />
      case 'notifications':
        return <Bell className="w-8 h-8 text-amber-700" />
      case 'reports':
        return <BarChart3 className="w-8 h-8 text-emerald-700" />
      case 'users':
        return <Users className="w-8 h-8 text-blue-800" />
      case 'audit':
        return <ShieldAlert className="w-8 h-8 text-red-700" />
      default:
        return <Construction className="w-8 h-8 text-slate-700" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb / Back button */}
      <div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl p-8 sm:p-12 border border-slate-200 text-center max-w-2xl mx-auto shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 border border-slate-200 shadow-xs">
          {renderIcon()}
        </div>

        <h1 className="text-2xl font-black text-slate-900 tracking-tight">{moduleName}</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
          {description}
        </p>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
