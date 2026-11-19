import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isMsalConfigured, getMsalInstance, loginRequest } from '../config/msalConfig'
import { Eye, EyeOff, LogIn, AlertCircle, ShieldCheck, Info, X } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, loginWithMicrosoft } = useAuth()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msLoading, setMsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfigNotice, setShowConfigNotice] = useState(false)

  // Standard Local / Demo Login
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!username.trim() || !password.trim()) {
      setError('Please enter your username and password.')
      return
    }

    setLoading(true)
    try {
      await login({ username: username.trim(), password })
      navigate(from, { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Microsoft Entra ID Login
  const handleMicrosoftLogin = async () => {
    setError(null)

    // Check if real Microsoft Entra tenant is configured
    if (!isMsalConfigured()) {
      setShowConfigNotice(true)
      return
    }

    setMsLoading(true)
    try {
      const msal = getMsalInstance()
      await msal.initialize()
      const loginResponse = await msal.loginPopup(loginRequest)

      if (!loginResponse || !loginResponse.idToken) {
        throw new Error('Failed to obtain identity token from Microsoft Entra ID.')
      }

      // Send token to backend to validate, match account, and receive application JWT
      await loginWithMicrosoft(loginResponse.idToken)
      navigate(from, { replace: true })
    } catch (err: unknown) {
      console.error('Microsoft login error:', err)
      const msg = err instanceof Error ? err.message : 'Microsoft authentication failed.'
      // User closed popup
      if (msg.includes('user_cancelled') || msg.includes('User cancelled')) {
        setError('Microsoft login window was closed before completing authentication.')
      } else {
        setError(msg)
      }
    } finally {
      setMsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 flex flex-col items-center justify-center p-4 selection:bg-blue-600 selection:text-white">
      {/* Container */}
      <div className="w-full max-w-md my-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl shadow-2xl mb-4 border-2 border-blue-100">
            <span className="text-blue-800 font-black text-3xl tracking-tighter">SLT</span>
          </div>
          <h1 className="text-white text-2xl font-black tracking-tight">Project Collaboration System</h1>
          <p className="text-blue-200 text-sm mt-1 font-medium">Sri Lanka Telecom • Inter-Departmental Platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-slate-900 text-lg font-bold">Sign in to your account</h2>
              <p className="text-xs text-slate-500 mt-0.5">Use corporate credentials or demo access</p>
            </div>
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-lg border border-blue-200">
              v2.0 Entra ID
            </span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 mb-6 text-xs leading-relaxed animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="flex-1">
                <p className="font-bold mb-0.5">Authentication Error</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Microsoft Entra ID Login Button */}
          <button
            type="button"
            onClick={handleMicrosoftLogin}
            disabled={loading || msLoading}
            className="w-full flex items-center justify-center py-3 px-4 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 rounded-2xl text-slate-800 font-semibold text-sm transition-all shadow-xs hover:shadow hover:border-slate-400 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {msLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3" />
                <span>Connecting to Microsoft...</span>
              </>
            ) : (
              <>
                {/* Official Microsoft 4-square logo */}
                <svg className="w-4 h-4 mr-3 shrink-0" viewBox="0 0 21 21">
                  <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                  <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                  <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                  <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                </svg>
                <span>Sign in with Microsoft</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase">
              <span className="bg-white px-3 text-slate-400 font-bold tracking-wider">
                Or sign in with username
              </span>
            </div>
          </div>

          {/* Standard Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="e.g. slt.dgm or demo.digitallab"
                disabled={loading || msLoading}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400
                           focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600
                           disabled:bg-slate-100 disabled:text-slate-400 transition"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={loading || msLoading}
                  className="w-full px-4 py-2.5 pr-11 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400
                             focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600
                             disabled:bg-slate-100 disabled:text-slate-400 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || msLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4
                         bg-blue-700 hover:bg-blue-800 active:bg-blue-900
                         disabled:opacity-60 disabled:cursor-not-allowed
                         text-white font-bold rounded-xl text-sm transition shadow-sm cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Corporate Auth Note */}
          <div className="mt-5 flex items-start gap-2.5 bg-blue-50/80 border border-blue-100 rounded-xl p-3">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-900 leading-relaxed">
              SLT corporate employees can sign in using their official Microsoft Entra ID account once the tenant registration is connected.
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Status Notice Modal */}
      {showConfigNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-700 rounded-2xl border border-blue-200">
                  <Info className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Microsoft Entra ID Ready</h3>
                  <p className="text-xs text-slate-500">Tenant Configuration Required for Live Sign-In</p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigNotice(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-5">
              <p>
                <strong>Architecture Implemented:</strong> The MSAL Authorization Code Flow with PKCE and backend token validation pipeline have been integrated into this release.
              </p>
              <p>
                <strong>Pending SLT IT Tenant Registration:</strong> To complete the live connection for SLT employee credentials, the following variables must be configured in environment files:
              </p>
              <ul className="list-disc list-inside space-y-1 font-mono text-[11px] text-blue-900 pl-1">
                <li>VITE_ENTRA_CLIENT_ID (App Registration Client ID)</li>
                <li>VITE_ENTRA_TENANT_ID (SLT Directory Tenant ID)</li>
                <li>VITE_ENTRA_REDIRECT_URI (http://127.0.0.1:5173/login)</li>
              </ul>
              <p className="text-[11px] text-slate-500 italic pt-1">
                For now, please continue testing with the 5 pre-configured Demo Roles or local credentials.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfigNotice(false)}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
