import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { UserProfile } from '../types/auth'
import { getProfile, isTokenExpired, loadStoredUser, logout as apiLogout, saveSession, login as apiLogin, loginWithEntra } from '../services/api'
import type { LoginRequest, LoginResponse } from '../types/auth'

interface AuthContextValue {
  user: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (req: LoginRequest) => Promise<LoginResponse>
  loginWithMicrosoft: (idToken: string) => Promise<LoginResponse>
  logout: () => Promise<void>
  hasRole: (...roles: string[]) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // On mount: restore session from localStorage if token still valid
  useEffect(() => {
    const restore = async () => {
      if (isTokenExpired()) {
        // Token expired – clear stale data
        localStorage.removeItem('slt_token')
        localStorage.removeItem('slt_user')
        setIsLoading(false)
        return
      }
      // Try to get fresh profile from server; fall back to cached user
      try {
        const freshProfile = await getProfile()
        setUser(freshProfile)
      } catch {
        const cached = loadStoredUser()
        setUser(cached)
      } finally {
        setIsLoading(false)
      }
    }
    restore()
  }, [])

  const login = async (req: LoginRequest): Promise<LoginResponse> => {
    const response = await apiLogin(req)
    saveSession(response)
    setUser(response.user)
    return response
  }

  const loginWithMicrosoft = async (idToken: string): Promise<LoginResponse> => {
    const response = await loginWithEntra(idToken)
    saveSession(response)
    setUser(response.user)
    return response
  }

  const logout = async () => {
    await apiLogout()
    setUser(null)
  }

  const hasRole = (...roles: string[]) =>
    user?.roles.some(r => roles.includes(r)) ?? false

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, loginWithMicrosoft, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
