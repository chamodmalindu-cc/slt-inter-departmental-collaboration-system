import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './components/DashboardLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import HealthPage from './pages/HealthPage'
import UnauthorizedPage from './pages/UnauthorizedPage'
import PlaceholderModulePage from './pages/PlaceholderModulePage'

// Phase 05 Pages
import ProposalsListPage from './pages/proposals/ProposalsListPage'
import ProposalSubmissionPage from './pages/proposals/ProposalSubmissionPage'
import ProposalDetailsPage from './pages/proposals/ProposalDetailsPage'
import ProposalEditPage from './pages/proposals/ProposalEditPage'
import NotificationsPage from './pages/NotificationsPage'

// Phase 06 Assignment Pages
import DgmAssignmentManagementPage from './pages/assignments/DgmAssignmentManagementPage'
import SupervisorMyAssignmentsPage from './pages/assignments/SupervisorMyAssignmentsPage'
import AssignmentDetailsPage from './pages/assignments/AssignmentDetailsPage'

// Phase 07 Chat Page
import ProjectChatPage from './pages/chat/ProjectChatPage'

// Phase 08 Project Lifecycle Pages
import ProjectsListPage from './pages/projects/ProjectsListPage'
import ProjectDetailPage from './pages/projects/ProjectDetailPage'
import ProgressUpdateFormPage from './pages/projects/ProgressUpdateFormPage'
import HandoverSubmissionPage from './pages/projects/HandoverSubmissionPage'

// Phase 09 Executive Reports Page
import ReportsPage from './pages/reports/ReportsPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes inside Unified DashboardLayout */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <DashboardPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ProfilePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/health"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <HealthPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Phase 05 Proposals Routes */}
          <Route
            path="/proposals"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ProposalsListPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/proposals/new"
            element={
              <ProtectedRoute roles={['ADMIN', 'NON_DIGITAL_LAB_USER']}>
                <DashboardLayout>
                  <ProposalSubmissionPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/proposals/:id"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ProposalDetailsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/proposals/:id/edit"
            element={
              <ProtectedRoute roles={['ADMIN', 'NON_DIGITAL_LAB_USER']}>
                <DashboardLayout>
                  <ProposalEditPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Notifications Route */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <NotificationsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Phase 06 Assignments Routes */}
          <Route
            path="/assignments"
            element={
              <ProtectedRoute roles={['ADMIN', 'DIGITAL_LAB_USER']}>
                <DashboardLayout>
                  <SupervisorMyAssignmentsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/assignments/manage"
            element={
              <ProtectedRoute roles={['ADMIN', 'DGM']}>
                <DashboardLayout>
                  <DgmAssignmentManagementPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/assignments/:id"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AssignmentDetailsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Modular Placeholders for future phases */}
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ProjectsListPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ProjectDetailPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/projects/:id/progress/new"
            element={
              <ProtectedRoute roles={['ADMIN', 'DIGITAL_LAB_USER']}>
                <DashboardLayout>
                  <ProgressUpdateFormPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/projects/:id/handover"
            element={
              <ProtectedRoute roles={['ADMIN', 'DIGITAL_LAB_USER']}>
                <DashboardLayout>
                  <HandoverSubmissionPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Phase 07 Real-Time Project Communication Route */}
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ProjectChatPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute roles={['ADMIN', 'DGM', 'HIGHER_MANAGEMENT']}>
                <DashboardLayout>
                  <ReportsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/users"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <DashboardLayout>
                  <PlaceholderModulePage
                    moduleName="User & Role Administration"
                    description="SLT corporate user directory management, department provisioning, and RBAC role assignment."
                    iconType="users"
                  />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/audit-logs"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <DashboardLayout>
                  <PlaceholderModulePage
                    moduleName="Security & Audit Trail"
                    description="Immutable logs of system logins, permission modifications, project status changes and administrative actions."
                    iconType="audit"
                  />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Unauthorized Access Page */}
          <Route
            path="/unauthorized"
            element={
              <DashboardLayout>
                <UnauthorizedPage />
              </DashboardLayout>
            }
          />

          {/* Default Routing */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
