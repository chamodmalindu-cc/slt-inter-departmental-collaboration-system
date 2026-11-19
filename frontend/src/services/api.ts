import type {
  LoginRequest,
  LoginResponse,
  EntraConfig,
  UserProfile,
  AdminDashboardData,
  DgmDashboardData,
  HigherManagementDashboardData,
  DigitalLabDashboardData,
  NonDigitalLabDashboardData,
  CreateProposalRequest,
  UpdateProposalRequest,
  EvaluateProposalRequest,
  Proposal,
  NotificationItem,
  ProjectAssignment,
  SupervisorCandidate,
  UnassignedApprovedProject,
  CreateAssignmentRequest,
  RespondAssignmentRequest,
  CancelAssignmentRequest,
  ChatRoomSummary,
  ChatMessage,
  ChatAttachmentInfo,
  SendMessageRequest,
  ProjectListItem,
  ProjectDetail,
  UpdateProjectStatusRequest,
  CreateProgressUpdateRequest,
  ProjectProgressUpdate,
  ProjectHandover,
  SubmitHandoverRequest,
  ProjectRating,
  SubmitRatingRequest,
  SupervisorPerformanceStats
} from '../types/auth'

import { chatHub } from './chatHubService'

const API = ''  // empty = use Vite proxy (/api → http://localhost:5000)

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('slt_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { message?: string; errors?: Record<string, string[]> }
    let msg = body.message
    if (!msg && body.errors) {
      msg = Object.values(body.errors).flat().join(', ')
    }
    throw new Error(msg ?? `Request failed: ${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

export async function login(request: LoginRequest): Promise<LoginResponse> {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  return handleResponse<LoginResponse>(res)
}

export async function loginWithEntra(idToken: string): Promise<LoginResponse> {
  const res = await fetch(`${API}/api/auth/entra-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  })
  return handleResponse<LoginResponse>(res)
}

export async function getEntraConfig(): Promise<EntraConfig> {
  const res = await fetch(`${API}/api/auth/entra-config`)
  return handleResponse<EntraConfig>(res)
}

export async function getProfile(): Promise<UserProfile> {
  const res = await fetch(`${API}/api/auth/me`, {
    headers: getAuthHeaders(),
  })
  return handleResponse<UserProfile>(res)
}

export async function logout(): Promise<void> {
  const token = localStorage.getItem('slt_token')
  if (token) {
    await fetch(`${API}/api/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
    }).catch(() => {}) // best-effort
  }
  await chatHub.stop().catch(() => {})
  localStorage.removeItem('slt_token')
  localStorage.removeItem('slt_user')
}

export function saveSession(response: LoginResponse): void {
  localStorage.setItem('slt_token', response.token)
  localStorage.setItem('slt_user', JSON.stringify(response.user))
}

export function loadStoredUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem('slt_user')
    return raw ? (JSON.parse(raw) as UserProfile) : null
  } catch {
    return null
  }
}

export function isTokenExpired(): boolean {
  const token = localStorage.getItem('slt_token')
  if (!token) return true
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return (payload.exp as number) * 1000 < Date.now()
  } catch {
    return true
  }
}

export async function checkHealth() {
  const res = await fetch(`${API}/api/health`)
  return handleResponse<{
    status: string
    timestamp: string
    service: string
    version: string
    database: { configured: boolean; connected: boolean; host: string; port: string; database: string }
  }>(res)
}

// ─── Dashboard API Services ──────────────────────────────────────────────────
export async function getAdminDashboard(): Promise<AdminDashboardData> {
  const res = await fetch(`${API}/api/dashboard/admin`, { headers: getAuthHeaders() })
  return handleResponse<AdminDashboardData>(res)
}

export async function getDgmDashboard(): Promise<DgmDashboardData> {
  const res = await fetch(`${API}/api/dashboard/dgm`, { headers: getAuthHeaders() })
  return handleResponse<DgmDashboardData>(res)
}

export async function getHigherManagementDashboard(): Promise<HigherManagementDashboardData> {
  const res = await fetch(`${API}/api/dashboard/higher-management`, { headers: getAuthHeaders() })
  return handleResponse<HigherManagementDashboardData>(res)
}

export async function getDigitalLabDashboard(): Promise<DigitalLabDashboardData> {
  const res = await fetch(`${API}/api/dashboard/digital-lab`, { headers: getAuthHeaders() })
  return handleResponse<DigitalLabDashboardData>(res)
}

export async function getNonDigitalLabDashboard(): Promise<NonDigitalLabDashboardData> {
  const res = await fetch(`${API}/api/dashboard/non-digital-lab`, { headers: getAuthHeaders() })
  return handleResponse<NonDigitalLabDashboardData>(res)
}

// ─── Phase 05 Proposals API Services ─────────────────────────────────────────
export async function createProposal(request: CreateProposalRequest): Promise<Proposal> {
  const res = await fetch(`${API}/api/proposals`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  })
  return handleResponse<Proposal>(res)
}

export async function getMyProposals(): Promise<Proposal[]> {
  const res = await fetch(`${API}/api/proposals/my`, {
    headers: getAuthHeaders(),
  })
  return handleResponse<Proposal[]>(res)
}

export async function getAllProposals(filters?: {
  departmentId?: string
  status?: string
  searchTerm?: string
}): Promise<Proposal[]> {
  const params = new URLSearchParams()
  if (filters?.departmentId) params.append('departmentId', filters.departmentId)
  if (filters?.status) params.append('status', filters.status)
  if (filters?.searchTerm) params.append('searchTerm', filters.searchTerm)

  const url = `${API}/api/proposals${params.toString() ? `?${params.toString()}` : ''}`
  const res = await fetch(url, {
    headers: getAuthHeaders(),
  })
  return handleResponse<Proposal[]>(res)
}

export async function getProposalById(id: string): Promise<Proposal> {
  const res = await fetch(`${API}/api/proposals/${id}`, {
    headers: getAuthHeaders(),
  })
  return handleResponse<Proposal>(res)
}

export async function updateProposal(id: string, request: UpdateProposalRequest): Promise<Proposal> {
  const res = await fetch(`${API}/api/proposals/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  })
  return handleResponse<Proposal>(res)
}

export async function evaluateProposal(id: string, request: EvaluateProposalRequest): Promise<Proposal> {
  const res = await fetch(`${API}/api/proposals/${id}/evaluate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  })
  return handleResponse<Proposal>(res)
}

// ─── Phase 06 Assignments API Services ───────────────────────────────────────
export async function getAvailableSupervisors(): Promise<SupervisorCandidate[]> {
  const res = await fetch(`${API}/api/assignments/supervisors`, {
    headers: getAuthHeaders(),
  })
  return handleResponse<SupervisorCandidate[]>(res)
}

export async function getUnassignedProjects(): Promise<UnassignedApprovedProject[]> {
  const res = await fetch(`${API}/api/assignments/unassigned-projects`, {
    headers: getAuthHeaders(),
  })
  return handleResponse<UnassignedApprovedProject[]>(res)
}

export async function createAssignment(request: CreateAssignmentRequest): Promise<ProjectAssignment> {
  const res = await fetch(`${API}/api/assignments`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  })
  return handleResponse<ProjectAssignment>(res)
}

export async function getMyAssignments(status?: string): Promise<ProjectAssignment[]> {
  const url = `${API}/api/assignments/my${status && status !== 'ALL' ? `?status=${status}` : ''}`
  const res = await fetch(url, {
    headers: getAuthHeaders(),
  })
  return handleResponse<ProjectAssignment[]>(res)
}

export async function getAllAssignments(filters?: { status?: string; supervisorId?: string }): Promise<ProjectAssignment[]> {
  const params = new URLSearchParams()
  if (filters?.status && filters.status !== 'ALL') params.append('status', filters.status)
  if (filters?.supervisorId) params.append('supervisorId', filters.supervisorId)

  const url = `${API}/api/assignments${params.toString() ? `?${params.toString()}` : ''}`
  const res = await fetch(url, {
    headers: getAuthHeaders(),
  })
  return handleResponse<ProjectAssignment[]>(res)
}

export async function getAssignmentById(id: string): Promise<ProjectAssignment> {
  const res = await fetch(`${API}/api/assignments/${id}`, {
    headers: getAuthHeaders(),
  })
  return handleResponse<ProjectAssignment>(res)
}

export async function respondToAssignment(id: string, request: RespondAssignmentRequest): Promise<ProjectAssignment> {
  const res = await fetch(`${API}/api/assignments/${id}/respond`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  })
  return handleResponse<ProjectAssignment>(res)
}

export async function cancelAssignment(id: string, request: CancelAssignmentRequest): Promise<ProjectAssignment> {
  const res = await fetch(`${API}/api/assignments/${id}/cancel`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  })
  return handleResponse<ProjectAssignment>(res)
}

// ─── Notifications API Services ──────────────────────────────────────────────
export async function getNotifications(): Promise<NotificationItem[]> {
  const res = await fetch(`${API}/api/notifications`, {
    headers: getAuthHeaders(),
  })
  return handleResponse<NotificationItem[]>(res)
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await fetch(`${API}/api/notifications/${id}/read`, {
    method: 'PUT',
    headers: getAuthHeaders(),
  }).catch(() => {})
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await fetch(`${API}/api/notifications/read-all`, {
    method: 'PUT',
    headers: getAuthHeaders(),
  }).catch(() => {})
}

// ─── Phase 07 Chat API Services ──────────────────────────────────────────────
export async function getMyChatRooms(): Promise<ChatRoomSummary[]> {
  const res = await fetch(`${API}/api/chat/rooms`, {
    headers: getAuthHeaders(),
  })
  return handleResponse<ChatRoomSummary[]>(res)
}

export async function getChatRoomById(roomId: string): Promise<ChatRoomSummary> {
  const res = await fetch(`${API}/api/chat/rooms/${roomId}`, {
    headers: getAuthHeaders(),
  })
  return handleResponse<ChatRoomSummary>(res)
}

export async function getChatRoomMessages(roomId: string): Promise<ChatMessage[]> {
  const res = await fetch(`${API}/api/chat/rooms/${roomId}/messages`, {
    headers: getAuthHeaders(),
  })
  return handleResponse<ChatMessage[]>(res)
}

export async function sendChatMessage(roomId: string, request: SendMessageRequest): Promise<ChatMessage> {
  const res = await fetch(`${API}/api/chat/rooms/${roomId}/messages`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  })
  return handleResponse<ChatMessage>(res)
}

export async function markChatRoomRead(roomId: string): Promise<void> {
  await fetch(`${API}/api/chat/rooms/${roomId}/read`, {
    method: 'POST',
    headers: getAuthHeaders(),
  }).catch(() => {})
}

export async function getChatRoomByProject(projectId: string): Promise<ChatRoomSummary> {
  const res = await fetch(`${API}/api/chat/project/${projectId}`, {
    headers: getAuthHeaders(),
  })
  return handleResponse<ChatRoomSummary>(res)
}

export async function uploadChatAttachment(
  roomId: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ message: string; attachment: ChatAttachmentInfo; chatMessage: ChatMessage }> {
  const token = localStorage.getItem('slt_token')
  const formData = new FormData()
  formData.append('file', file)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API}/api/chat/rooms/${roomId}/attachments`)
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    }

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100)
          onProgress(percent)
        }
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText)
          resolve(data)
        } catch {
          resolve({ message: 'Success', attachment: {} as ChatAttachmentInfo, chatMessage: {} as ChatMessage })
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText)
          reject(new Error(err.message || `Upload failed with status ${xhr.status}`))
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`))
        }
      }
    }

    xhr.onerror = () => {
      reject(new Error('Network error during file upload.'))
    }

    xhr.send(formData)
  })
}

export async function getRoomAttachments(roomId: string): Promise<ChatAttachmentInfo[]> {
  const res = await fetch(`${API}/api/chat/rooms/${roomId}/attachments`, {
    headers: getAuthHeaders(),
  })
  return handleResponse<ChatAttachmentInfo[]>(res)
}

export async function downloadChatAttachment(attachmentId: string, fileName: string): Promise<void> {
  const token = localStorage.getItem('slt_token')
  const res = await fetch(`${API}/api/chat/attachments/${attachmentId}/download`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { message?: string }
    throw new Error(body.message || `Download failed (${res.status})`)
  }
  const blob = await res.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

export async function viewChatAttachmentInline(attachmentId: string): Promise<void> {
  const token = localStorage.getItem('slt_token')
  const res = await fetch(`${API}/api/chat/attachments/${attachmentId}/view`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { message?: string }
    throw new Error(body.message || `View failed (${res.status})`)
  }
  const blob = await res.blob()
  const url = window.URL.createObjectURL(blob)
  window.open(url, '_blank')
}

// ─── Phase 08 Project Lifecycle API Services ──────────────────────────────────
export async function getProjects(status?: string): Promise<ProjectListItem[]> {
  const url = `${API}/api/projects${status ? `?status=${status}` : ''}`
  const res = await fetch(url, { headers: getAuthHeaders() })
  return handleResponse<ProjectListItem[]>(res)
}

export async function getProjectById(id: string): Promise<ProjectDetail> {
  const res = await fetch(`${API}/api/projects/${id}`, { headers: getAuthHeaders() })
  return handleResponse<ProjectDetail>(res)
}

export async function updateProjectStatus(id: string, request: UpdateProjectStatusRequest): Promise<{ message: string; projectId: string; newStatus: string }> {
  const res = await fetch(`${API}/api/projects/${id}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  })
  return handleResponse<{ message: string; projectId: string; newStatus: string }>(res)
}

export async function addProgressUpdate(id: string, request: CreateProgressUpdateRequest): Promise<ProjectProgressUpdate> {
  const res = await fetch(`${API}/api/projects/${id}/progress`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  })
  return handleResponse<ProjectProgressUpdate>(res)
}

export async function getProgressUpdates(id: string): Promise<ProjectProgressUpdate[]> {
  const res = await fetch(`${API}/api/projects/${id}/progress`, { headers: getAuthHeaders() })
  return handleResponse<ProjectProgressUpdate[]>(res)
}

export async function submitHandover(id: string, request: SubmitHandoverRequest): Promise<ProjectHandover> {
  const res = await fetch(`${API}/api/projects/${id}/handover`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  })
  return handleResponse<ProjectHandover>(res)
}

export async function getHandover(id: string): Promise<ProjectHandover> {
  const res = await fetch(`${API}/api/projects/${id}/handover`, { headers: getAuthHeaders() })
  return handleResponse<ProjectHandover>(res)
}

export async function submitRating(id: string, request: SubmitRatingRequest): Promise<ProjectRating> {
  const res = await fetch(`${API}/api/projects/${id}/rate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  })
  return handleResponse<ProjectRating>(res)
}

export async function getProjectRatings(id: string): Promise<ProjectRating[]> {
  const res = await fetch(`${API}/api/projects/${id}/ratings`, { headers: getAuthHeaders() })
  return handleResponse<ProjectRating[]>(res)
}

export async function getSupervisorPerformance(): Promise<SupervisorPerformanceStats[]> {
  const res = await fetch(`${API}/api/projects/supervisor-performance`, { headers: getAuthHeaders() })
  return handleResponse<SupervisorPerformanceStats[]>(res)
}
