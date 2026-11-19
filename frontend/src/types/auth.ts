// API types aligned with backend DTOs

export interface LoginRequest {
  username: string
  password: string
}

export interface UserProfile {
  id: string
  username: string
  email: string
  fullName: string
  departmentName: string
  departmentCode: string
  roles: string[]
  isDemoAccount: boolean
  isActive: boolean
}

export interface LoginResponse {
  token: string
  tokenType: string
  expiresInSeconds: number
  expiresAt: string
  user: UserProfile
}

export interface EntraConfig {
  enabled: boolean
  clientId?: string | null
  tenantId?: string | null
  redirectUri?: string | null
  authority?: string | null
  scope?: string | null
}

export type UserRole =
  | 'ADMIN'
  | 'DGM'
  | 'HIGHER_MANAGEMENT'
  | 'DIGITAL_LAB_USER'
  | 'NON_DIGITAL_LAB_USER'

// Dashboard DTOs
export interface ProjectSummary {
  id: string
  projectCode: string
  title: string
  departmentName: string
  status: string
  priority: string
  createdAt: string
  supervisorName?: string
  progressPercentage: number
}

export interface RecentActivity {
  id: string
  action: string
  title: string
  userFullName: string
  timestamp: string
  type: 'info' | 'success' | 'warning'
}

export interface SystemMetric {
  key: string
  label: string
  value: string
  change: string
  isPositive: boolean
}

export interface DepartmentPerformance {
  departmentName: string
  totalProjects: number
  completed: number
  satisfactionRating: number
}

export interface SupervisorPerformance {
  supervisorName: string
  department: string
  activeProjects: number
  deliveredProjects: number
  averageRating: number
}

export interface AdminDashboardData {
  totalUsers: number
  totalProjects: number
  totalDepartments: number
  totalAuditLogs: number
  recentActivities: RecentActivity[]
  metrics: SystemMetric[]
}

export interface DgmDashboardData {
  pendingProposalsCount: number
  approvedProjectsCount: number
  ongoingProjectsCount: number
  totalSupervisorsCount: number
  pendingProposals: ProjectSummary[]
  activeProjects: ProjectSummary[]
}

export interface HigherManagementDashboardData {
  totalProjects: number
  projectCompletionRate: number
  inProgressCount: number
  completedCount: number
  departmentStats: DepartmentPerformance[]
  supervisorPerformance: SupervisorPerformance[]
}

export interface DigitalLabDashboardData {
  assignedProjectsCount: number
  pendingAcceptanceCount: number
  ongoingWorkCount: number
  completedProjectsCount: number
  assignedProjects: ProjectSummary[]
  recentActivities: RecentActivity[]
}

export interface NonDigitalLabDashboardData {
  submittedProposalsCount: number
  approvedCount: number
  underReviewCount: number
  ongoingCount: number
  myProposals: ProjectSummary[]
  projectUpdates: RecentActivity[]
}

// ─── Phase 05 Proposal DTOs ──────────────────────────────────────────────────
export interface CreateProposalRequest {
  title: string
  businessProblem: string
  expectedOutcome: string
  impactCostSaving: boolean
  impactRevenue: boolean
  impactProcessOptimization: boolean
  quantifiedImpact?: string
  targetDeadline?: string
  additionalInformation?: string
  priority?: string
}

export interface UpdateProposalRequest {
  title: string
  businessProblem: string
  expectedOutcome: string
  impactCostSaving: boolean
  impactRevenue: boolean
  impactProcessOptimization: boolean
  quantifiedImpact?: string
  targetDeadline?: string
  additionalInformation?: string
  priority?: string
}

export interface EvaluateProposalRequest {
  decision: 'APPROVE' | 'REJECT'
  evaluationComments?: string
  rejectionReason?: string
}

export interface ProposalStatusHistory {
  id: string
  previousStatus: string | null
  newStatus: string
  remarks: string | null
  changedByUserName: string
  changedAt: string
}

export interface Proposal {
  id: string
  projectCode: string
  title: string
  description: string
  businessProblem: string
  expectedOutcome: string
  impactCostSaving: boolean
  impactRevenue: boolean
  impactProcessOptimization: boolean
  quantifiedImpact?: string
  additionalInformation?: string
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'PENDING_ACCEPTANCE' | 'ASSIGNED' | 'ASSIGNMENT_DECLINED' | string
  priority: string
  
  departmentId: string
  departmentName: string
  departmentCode: string

  createdByUserId: string
  createdByUserName: string
  createdByUserFullName: string
  createdByUserEmail: string

  targetEndDate?: string
  createdAt: string
  updatedAt?: string

  reviewedByUserId?: string
  reviewedByUserName?: string
  reviewedByUserFullName?: string
  reviewedAt?: string
  reviewRemarks?: string
  rejectionReason?: string

  statusHistory: ProposalStatusHistory[]
}

export interface NotificationItem {
  id: string
  title: string
  message: string
  type: string
  referenceId?: string
  isRead: boolean
  createdAt: string
}

// ─── Phase 06 Project Assignment DTOs ────────────────────────────────────────
export interface ProjectAssignment {
  id: string
  projectId: string
  projectCode: string
  projectTitle: string
  departmentName: string
  requesterName: string
  requesterEmail: string

  userId: string
  supervisorName: string
  supervisorUsername: string
  supervisorEmail: string

  assignmentRole: string
  status: 'PENDING_ACCEPTANCE' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED'
  instructions?: string
  declineReason?: string
  assignedDeadline?: string

  assignedByUserId?: string
  assignedByUserName?: string
  assignedByUserFullName?: string

  assignedAt: string
  respondedAt?: string
  isActive: boolean
}

export interface SupervisorCandidate {
  id: string
  username: string
  fullName: string
  email: string
  departmentName: string
  activeAssignmentsCount: number
  isActive: boolean
}

export interface UnassignedApprovedProject {
  id: string
  projectCode: string
  title: string
  businessProblem: string
  expectedOutcome: string
  priority: string
  status: string
  departmentId: string
  departmentName: string
  requesterName: string
  targetEndDate?: string
  createdAt: string
  reviewedAt?: string
}

export interface CreateAssignmentRequest {
  projectId: string
  supervisorUserId: string
  assignedDeadline: string
  instructions?: string
  assignmentRole?: string
}

export interface RespondAssignmentRequest {
  action: 'ACCEPT' | 'DECLINE'
  declineReason?: string
}

export interface CancelAssignmentRequest {
  reason?: string
}

// ─── Phase 07 Real-Time Chat DTOs ──────────────────────────────────────────
export interface ChatParticipant {
  id: string
  userId: string
  fullName: string
  username: string
  role: string
  departmentCode: string
  isOnline: boolean
  joinedAt: string
  lastReadAt?: string
}

export interface ChatAttachmentInfo {
  id: string
  chatRoomId: string
  uploadedByUserId: string
  uploadedByUserName: string
  originalFileName: string
  fileExtension: string
  contentType: string
  fileSize: number
  uploadedAt: string
  downloadUrl: string
  viewUrl?: string | null
  canViewInline: boolean
}

export interface ChatMessage {
  id: string
  chatRoomId: string
  senderUserId: string
  senderName: string
  senderUsername: string
  senderRole: string
  senderDepartment: string
  messageContent: string
  messageType: 'Text' | 'System' | 'Attachment'
  sentAt: string
  isMine: boolean
  attachmentId?: string
  attachment?: ChatAttachmentInfo
}

export interface ChatRoomSummary {
  id: string
  title: string
  roomType: string
  projectId?: string
  projectCode?: string
  projectTitle?: string
  departmentName?: string
  createdAt: string
  unreadCount: number
  lastMessage?: ChatMessage
  participants: ChatParticipant[]
}

export interface SendMessageRequest {
  content: string
}

// ─── Phase 08 Project Lifecycle DTOs ─────────────────────────────────────────

export interface ProjectStatusHistoryItem {
  id: string
  previousStatus: string | null
  newStatus: string
  remarks: string | null
  changedByName: string
  changedAt: string
}

export interface ProjectProgressUpdate {
  id: string
  projectId: string
  supervisorName: string
  updateType: 'Progress' | 'Milestone' | 'Issue'
  description: string
  completedActivities?: string
  currentChallenges?: string
  nextPlannedActivities?: string
  milestoneTitle?: string
  milestoneDate?: string
  createdAt: string
}

export interface ProjectHandover {
  id: string
  projectId: string
  projectCode: string
  supervisorName: string
  finalSummary: string
  deliverablesCompleted: string
  technicalDocumentationLinks?: string
  deploymentDetails?: string
  knownLimitations?: string
  recommendations?: string
  handoverDate: string
  submittedAt: string
  isFinalized: boolean
}

export interface ProjectRating {
  id: string
  projectId: string
  raterType: string
  raterName: string
  supervisorName: string
  technicalQuality: number
  communication: number
  timelyDelivery: number
  professionalism: number
  overallRating: number
  averageScore: number
  writtenFeedback?: string
  createdAt: string
}

export interface ProjectDetail {
  id: string
  projectCode: string
  title: string
  description: string
  businessProblem: string
  expectedOutcome: string
  impactCostSaving: boolean
  impactRevenue: boolean
  impactProcessOptimization: boolean
  quantifiedImpact?: string
  additionalInformation?: string
  status: string
  priority: string
  departmentName: string
  departmentCode: string
  requesterName: string
  requesterEmail: string
  supervisorName?: string
  supervisorEmail?: string
  supervisorUserId?: string
  targetEndDate?: string
  assignedDeadline?: string
  startDate?: string
  actualEndDate?: string
  createdAt: string
  updatedAt?: string
  reviewRemarks?: string
  rejectionReason?: string
  reviewedByUserName?: string
  reviewedAt?: string
  assignmentId?: string
  statusHistory: ProjectStatusHistoryItem[]
  progressUpdates: ProjectProgressUpdate[]
  handover?: ProjectHandover
  ratings: ProjectRating[]
  canUpdateStatus: boolean
  canAddProgress: boolean
  canSubmitHandover: boolean
  canRate: boolean
  hasRated: boolean
}

export interface ProjectListItem {
  id: string
  projectCode: string
  title: string
  status: string
  priority: string
  departmentName: string
  requesterName: string
  supervisorName?: string
  targetEndDate?: string
  assignedDeadline?: string
  createdAt: string
  isOverdue: boolean
}

export interface UpdateProjectStatusRequest {
  newStatus: string
  comments?: string
}

export interface CreateProgressUpdateRequest {
  updateType: 'Progress' | 'Milestone' | 'Issue'
  description: string
  completedActivities?: string
  currentChallenges?: string
  nextPlannedActivities?: string
  milestoneTitle?: string
  milestoneDate?: string
}

export interface SubmitHandoverRequest {
  finalSummary: string
  deliverablesCompleted: string
  technicalDocumentationLinks?: string
  deploymentDetails?: string
  knownLimitations?: string
  recommendations?: string
  handoverDate: string
}

export interface SubmitRatingRequest {
  technicalQuality: number
  communication: number
  timelyDelivery: number
  professionalism: number
  overallRating: number
  writtenFeedback?: string
}

export interface SupervisorPerformanceStats {
  supervisorId: string
  supervisorName: string
  departmentName: string
  totalProjects: number
  completedProjects: number
  activeProjects: number
  averageTechnicalQuality: number
  averageCommunication: number
  averageTimelyDelivery: number
  averageProfessionalism: number
  averageOverallRating: number
  totalRatings: number
}

