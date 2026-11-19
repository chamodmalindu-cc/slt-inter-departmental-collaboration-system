import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getAdminDashboard,
  getDgmDashboard,
  getHigherManagementDashboard,
  getDigitalLabDashboard,
  getNonDigitalLabDashboard
} from '../services/api'
import type {
  AdminDashboardData,
  DgmDashboardData,
  HigherManagementDashboardData,
  DigitalLabDashboardData,
  NonDigitalLabDashboardData
} from '../types/auth'

import AdminDashboardView from './dashboards/AdminDashboardView'
import DgmDashboardView from './dashboards/DgmDashboardView'
import HigherManagementDashboardView from './dashboards/HigherManagementDashboardView'
import DigitalLabDashboardView from './dashboards/DigitalLabDashboardView'
import NonDigitalLabDashboardView from './dashboards/NonDigitalLabDashboardView'

export default function DashboardPage() {
  const { user, hasRole } = useAuth()

  const [loading, setLoading] = useState(true)
  const [adminData, setAdminData] = useState<AdminDashboardData | null>(null)
  const [dgmData, setDgmData] = useState<DgmDashboardData | null>(null)
  const [higherMgmtData, setHigherMgmtData] = useState<HigherManagementDashboardData | null>(null)
  const [digitalLabData, setDigitalLabData] = useState<DigitalLabDashboardData | null>(null)
  const [nonDigitalLabData, setNonDigitalLabData] = useState<NonDigitalLabDashboardData | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadRoleDashboard() {
      if (!user) return
      setLoading(true)

      try {
        if (hasRole('ADMIN')) {
          const res = await getAdminDashboard()
          if (isMounted) setAdminData(res)
        } else if (hasRole('DGM')) {
          const res = await getDgmDashboard()
          if (isMounted) setDgmData(res)
        } else if (hasRole('HIGHER_MANAGEMENT')) {
          const res = await getHigherManagementDashboard()
          if (isMounted) setHigherMgmtData(res)
        } else if (hasRole('DIGITAL_LAB_USER')) {
          const res = await getDigitalLabDashboard()
          if (isMounted) setDigitalLabData(res)
        } else if (hasRole('NON_DIGITAL_LAB_USER')) {
          const res = await getNonDigitalLabDashboard()
          if (isMounted) setNonDigitalLabData(res)
        }
      } catch (err) {
        console.error('Failed to load dashboard data from API', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadRoleDashboard()

    return () => {
      isMounted = false
    }
  }, [user])

  if (!user) return null

  if (hasRole('ADMIN')) {
    return <AdminDashboardView data={adminData} loading={loading} />
  }

  if (hasRole('DGM')) {
    return <DgmDashboardView data={dgmData} loading={loading} />
  }

  if (hasRole('HIGHER_MANAGEMENT')) {
    return <HigherManagementDashboardView data={higherMgmtData} loading={loading} />
  }

  if (hasRole('DIGITAL_LAB_USER')) {
    return <DigitalLabDashboardView data={digitalLabData} loading={loading} />
  }

  if (hasRole('NON_DIGITAL_LAB_USER')) {
    return <NonDigitalLabDashboardView data={nonDigitalLabData} loading={loading} />
  }

  return (
    <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center">
      <h2 className="text-lg font-bold text-slate-900">User Dashboard</h2>
      <p className="text-xs text-slate-500 mt-1">Role configuration in progress.</p>
    </div>
  )
}
