import { useAuth } from '../context/AuthContext'
import { User, Mail, Building2, Shield, Calendar } from 'lucide-react'

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="text-slate-400 mt-0.5 shrink-0">{icon}</div>
      <div>
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <p className="text-sm text-slate-900 font-semibold mt-0.5">{value}</p>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { user } = useAuth()
  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">My Profile</h1>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Avatar header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-6 py-8 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 text-white flex items-center justify-center text-2xl font-extrabold shadow">
            {user.fullName.charAt(0)}
          </div>
          <div>
            <h2 className="text-white text-xl font-bold">{user.fullName}</h2>
            <p className="text-blue-200 text-sm">@{user.username}</p>
            {user.isDemoAccount && (
              <span className="mt-1.5 inline-block text-xs font-semibold bg-amber-400/30 text-amber-100 border border-amber-300/40 px-2 py-0.5 rounded-full">
                Demo Account
              </span>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="px-6 py-2">
          <InfoRow icon={<User className="w-4 h-4" />}      label="Full Name"   value={user.fullName} />
          <InfoRow icon={<Mail className="w-4 h-4" />}       label="Email"       value={user.email} />
          <InfoRow icon={<Building2 className="w-4 h-4" />}  label="Department"  value={`${user.departmentName} (${user.departmentCode})`} />
          <InfoRow icon={<Shield className="w-4 h-4" />}     label="Roles"       value={user.roles.join(', ')} />
          <InfoRow icon={<Calendar className="w-4 h-4" />}   label="Account Type" value={user.isDemoAccount ? 'Demo / Test Account' : 'System Account'} />
        </div>
      </div>

      {/* Permissions summary */}
      <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Account Permissions</h3>
        <div className="flex flex-wrap gap-2">
          {user.roles.map(role => (
            <span
              key={role}
              className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200"
            >
              {role.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-3">
          Permissions are enforced on the server. Contact your administrator if you need access changes.
        </p>
      </div>
    </div>
  )
}
