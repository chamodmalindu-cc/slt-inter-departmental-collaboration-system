# SLT Inter-Departmental Project Communication & Collaboration System
## Document 4: REST API & SignalR Hub Specification

---

### Document Information
- **Document Reference:** SLT-DOC-2026-SYS-004
- **Document Title:** Comprehensive REST API & SignalR Specification
- **Classification:** CONFIDENTIAL &bull; INTERNAL HANDOVER
- **Version:** 1.0.0 (Production Candidate)
- **Prepared Date:** November 2026
- **Target Audience:** Integration Engineers, Frontend Developers, Mobile App Developers, QA Automation Teams

---

# 1. API Architecture & Standards

The **SLT Inter-Departmental Project Communication & Collaboration System** exposes a RESTful HTTP/JSON Web API alongside a high-performance WebSockets SignalR hub.

### 1.1 Base URL & Protocol
- **Base URL:** `http://localhost:5000/api` (Production will bind to `https://<domain>/api`)
- **SignalR Hub Endpoint:** `http://localhost:5000/hubs/project-chat`
- **Default Payload Encoding:** `application/json; charset=utf-8`
- **Multipart Form Encoding:** `multipart/form-data` (file uploads)

### 1.2 Authentication Scheme
All protected endpoints require a signed JSON Web Token (JWT) supplied in the standard HTTP header:
```http
Authorization: Bearer <eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...>
```
Unauthenticated requests receive `401 Unauthorized`. Requests failing Role-Based Access Control (RBAC) receive `403 Forbidden`.

### 1.3 Standard Error Responses
The API adheres to RFC 9110 HTTP status semantics. Standard error envelopes follow this format:
```json
{
  "message": "Human-readable descriptive error message",
  "errors": ["Specific field validation failure detail"]
}
```

---

# 2. Module 1: Authentication & Identity Management

### 2.1 Public Entra Configuration Discovery
Returns the active Microsoft Entra ID public settings for SPA MSAL initialization.

- **Endpoint:** `GET /api/auth/entra-config`
- **Auth Required:** No (Public)
- **Response (200 OK):**
```json
{
  "enabled": false,
  "clientId": null,
  "tenantId": null,
  "redirectUri": "http://127.0.0.1:5173/login",
  "authority": null,
  "scope": "openid profile email User.Read"
}
```

### 2.2 Microsoft Entra ID Authentication
Validates Microsoft ID tokens cryptographically, matches employee account, and issues an SLT application JWT.

- **Endpoint:** `POST /api/auth/entra-login`
- **Auth Required:** No (Public)
- **Request Body:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFhMmIzYy4uLiJ9..."
}
```
- **Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresInSeconds": 28800,
  "expiresAt": "2026-11-19T08:00:00Z",
  "user": {
    "id": "13c417de-b0b9-4040-9463-388bace01e5f",
    "username": "demo.digitallab",
    "email": "demo.digitallab@test.slt.internal",
    "fullName": "Demo Digital Lab Specialist",
    "roles": ["DIGITAL_LAB_USER"],
    "departmentName": "Digital Services Lab",
    "departmentCode": "DL",
    "isDemoAccount": true,
    "isActive": true
  }
}
```
- **Error Responses:**
  - `400 Bad Request`: Missing or malformed token.
  - `401 Unauthorized`: Cryptographic signature invalid, expired token, or wrong audience/issuer.
  - `403 Forbidden`: Valid Microsoft account not linked to any SLT employee account.

### 2.3 Local / Demo Account Authentication
Authenticates using PBKDF2-SHA256 hashed credentials.

- **Endpoint:** `POST /api/auth/login`
- **Auth Required:** No (Public)
- **Request Body:**
```json
{
  "username": "slt.dgm",
  "password": "DGM@SLT2026!"
}
```
- **Response (200 OK):** Same `LoginResponse` structure as 2.2.
- **Error Responses:**
  - `401 Unauthorized`: Invalid username or password.

### 2.4 User Profile Retrieval
Retrieves current profile details for the authenticated session.

- **Endpoint:** `GET /api/auth/me`
- **Auth Required:** Yes (Any role)
- **Response (200 OK):**
```json
{
  "id": "e4a7a8d5-1234-4567-89ab-cdef01234567",
  "username": "slt.dgm",
  "email": "dgm@system.slt.internal",
  "fullName": "SLT Deputy General Manager",
  "roles": ["DGM"],
  "departmentName": "Corporate Management",
  "departmentCode": "MGMT",
  "isDemoAccount": false,
  "isActive": true
}
```

### 2.5 Admin Account Linking for Microsoft Entra ID
Binds an immutable Microsoft identity to an existing employee record. Prevents duplicates.

- **Endpoint:** `POST /api/auth/admin/link-entra`
- **Auth Required:** Yes (`ADMIN` only)
- **Request Body:**
```json
{
  "userId": "13c417de-b0b9-4040-9463-388bace01e5f",
  "entraTenantId": "72f988bf-86f1-41af-91ab-2d7cd011db47",
  "entraObjectId": "entra-oid-supervisor-1234"
}
```
- **Response (200 OK):**
```json
{
  "message": "Microsoft Entra identity successfully linked to employee account."
}
```
- **Error Responses:**
  - `403 Forbidden`: Caller lacks `ADMIN` role.
  - `404 Not Found`: Target user does not exist.
  - `409 Conflict`: OID already assigned to another user.

### 2.6 Admin Account Unlinking
Removes Microsoft identity binding from an employee account.

- **Endpoint:** `POST /api/auth/admin/unlink-entra/{userId}`
- **Auth Required:** Yes (`ADMIN` only)
- **Response (200 OK):**
```json
{
  "message": "Microsoft Entra identity unlinked successfully."
}
```

---

# 3. Module 2: Project Proposals & Review

### 3.1 Submit Project Proposal
Submits a new cross-departmental initiative proposal.

- **Endpoint:** `POST /api/proposals`
- **Auth Required:** Yes (`NON_DIGITAL_LAB_USER`, `ADMIN`)
- **Request Body:**
```json
{
  "title": "Automated Fiber Cable Diagnostic System",
  "description": "IoT-based real-time telemetry for optical distribution frames.",
  "businessProblem": "Fiber break detection currently requires manual field trips taking 3+ hours.",
  "expectedOutcome": "Automated OTDR measurements pinpointing break location within 10 meters.",
  "quantifiedImpact": "Reduces MTTR by 65% and saves LKR 4.2M annually in patrol costs.",
  "additionalInformation": "Integrates with existing NMS via SNMPv3.",
  "priority": "HIGH"
}
```
- **Response (201 Created):**
```json
{
  "id": "15abf81f-936e-4305-a6fe-ebbb7553e76e",
  "projectCode": "PROP-2026-0014",
  "title": "Automated Fiber Cable Diagnostic System",
  "status": "PENDING_REVIEW",
  "priority": "HIGH",
  "createdAt": "2026-11-18T07:57:44Z"
}
```

### 3.2 List Requester's Proposals
Returns proposals submitted by the current user.

- **Endpoint:** `GET /api/proposals/my`
- **Auth Required:** Yes (`NON_DIGITAL_LAB_USER`, `ADMIN`)
- **Response (200 OK):** Array of project proposal summaries.

### 3.3 List All Proposals for Review
Returns all proposals across all departments for executive evaluation.

- **Endpoint:** `GET /api/proposals`
- **Auth Required:** Yes (`DGM`, `ADMIN`, `HIGHER_MANAGEMENT`)
- **Query Parameters:** `?status=PENDING_REVIEW&departmentId={guid}&search=Fiber`
- **Response (200 OK):** Array of detailed proposal objects.

### 3.4 Proposal Detail Lookup
- **Endpoint:** `GET /api/proposals/{id}`
- **Auth Required:** Yes (Authorized stakeholders)
- **Response (200 OK):** Comprehensive proposal detail object.

### 3.5 DGM Proposal Evaluation
Approves or rejects a submitted proposal.

- **Endpoint:** `POST /api/proposals/{id}/evaluate`
- **Auth Required:** Yes (`DGM`, `ADMIN`)
- **Request Body (Approval):**
```json
{
  "approved": true,
  "remarks": "Strategically aligned with 2026 FTTH reliability goals. Approved for Q1 execution."
}
```
- **Request Body (Rejection):**
```json
{
  "approved": false,
  "remarks": "Current telemetry infrastructure cannot support SNMP polling at this interval.",
  "rejectionReason": "Technical feasibility constraints on legacy ODFs."
}
```
- **Response (200 OK):** Updated project status object.

---

# 4. Module 3: Supervisor Assignment Desk

### 4.1 List Available Supervisors
Retrieves Digital Lab engineers with active project workloads.

- **Endpoint:** `GET /api/assignments/supervisors`
- **Auth Required:** Yes (`DGM`, `ADMIN`)
- **Response (200 OK):**
```json
[
  {
    "userId": "13c417de-b0b9-4040-9463-388bace01e5f",
    "fullName": "Demo Digital Lab Specialist",
    "email": "demo.digitallab@test.slt.internal",
    "activeProjectCount": 2,
    "completedProjectCount": 6,
    "averageRating": 4.9
  }
]
```

### 4.2 List Unassigned Approved Projects
Retrieves projects approved by DGM awaiting supervisor assignment.

- **Endpoint:** `GET /api/assignments/unassigned-projects`
- **Auth Required:** Yes (`DGM`, `ADMIN`)
- **Response (200 OK):** Array of approved projects with `Status = "APPROVED"`.

### 4.3 Dispatch Supervisor Assignment
Assigns a Digital Lab supervisor to an approved project.

- **Endpoint:** `POST /api/assignments`
- **Auth Required:** Yes (`DGM`, `ADMIN`)
- **Request Body:**
```json
{
  "projectId": "15abf81f-936e-4305-a6fe-ebbb7553e76e",
  "supervisorUserId": "13c417de-b0b9-4040-9463-388bace01e5f",
  "assignmentRole": "Lead IoT Supervisor",
  "instructions": "Deliver firmware POC for optical telemetry unit by end of Month 2."
}
```
- **Response (201 Created):**
```json
{
  "id": "5fab976c-5e54-451e-8c1f-daa69538f9d0",
  "projectId": "15abf81f-936e-4305-a6fe-ebbb7553e76e",
  "status": "PENDING_ACCEPTANCE",
  "assignedAt": "2026-11-18T07:57:44Z"
}
```

### 4.4 Supervisor Personal Assignments Feed
Returns assignments dispatched to the calling supervisor.

- **Endpoint:** `GET /api/assignments/my`
- **Auth Required:** Yes (`DIGITAL_LAB_USER`, `ADMIN`)
- **Response (200 OK):** Array of assignments with status `PENDING_ACCEPTANCE`, `ACCEPTED`, or `DECLINED`.

### 4.5 Supervisor Accept or Decline Assignment
Formally accepts or declines a project assignment.

- **Endpoint:** `POST /api/assignments/{id}/respond`
- **Auth Required:** Yes (Assigned supervisor only)
- **Request Body (Accept):**
```json
{
  "accept": true
}
```
- **Request Body (Decline):**
```json
{
  "accept": false,
  "declineReason": "Currently committed to Core Transmission Ring migration through Q1."
}
```
- **Response (200 OK):** Updated assignment object. Acceptance transitions project status to `ASSIGNED` and provisions a collaboration chat room.

---

# 5. Module 4: Project Lifecycle & Execution

### 5.1 Project Directory Query
- **Endpoint:** `GET /api/projects`
- **Auth Required:** Yes (Authenticated)
- **Query Parameters:** `?status=DEVELOPMENT&priority=HIGH&page=1&pageSize=20`

### 5.2 Transition Lifecycle Status
Advances the project through the standardized 6-stage engineering lifecycle.

- **Endpoint:** `PATCH /api/projects/{id}/status`
- **Auth Required:** Yes (`DIGITAL_LAB_USER`, `DGM`, `ADMIN`)
- **Request Body:**
```json
{
  "newStatus": "DEVELOPMENT",
  "remarks": "Architecture approved. Commencing firmware development sprint."
}
```
- **Lifecycle Sequence:** `ASSIGNED` $\rightarrow$ `DEVELOPMENT` $\rightarrow$ `TESTING` $\rightarrow$ `POC` $\rightarrow$ `VALIDATE` $\rightarrow$ `HANDOVER` $\rightarrow$ `COMPLETED`
- **Response (200 OK):** Updated project detail object.

### 5.3 Post Progress Update & Milestone
- **Endpoint:** `POST /api/projects/{id}/progress`
- **Auth Required:** Yes (`DIGITAL_LAB_USER`, `ADMIN`)
- **Request Body:**
```json
{
  "updateType": "MILESTONE",
  "description": "Telemetry module validated on Colombo Central optical ring.",
  "completedActivities": "Benchmarked OTDR pulse reflection; calibrated attenuation thresholds.",
  "currentChallenges": "Supply chain delay on secondary fiber splicing kits.",
  "nextPlannedActivities": "Deploy field unit at Welikada central exchange.",
  "milestoneTitle": "Central Ring Telemetry Verified"
}
```
- **Response (201 Created):** Created progress update record.

### 5.4 Submit Formal Project Handover
Submits technical handover upon reaching `HANDOVER` phase.

- **Endpoint:** `POST /api/projects/{id}/handover`
- **Auth Required:** Yes (Assigned supervisor only)
- **Request Body:**
```json
{
  "finalSummary": "Automated Fiber Cable Diagnostic System deployed and operational on production ring.",
  "deliverablesCompleted": "Firmware binary v1.0, SNMP collector daemon, Grafana monitoring dashboard.",
  "technicalDocumentationLinks": "https://git.slt.internal/digitallab/fiber-telemetry; https://wiki.slt.internal/otdr-guide",
  "deploymentDetails": "Hosted on Linux VM cluster node col-otdr-01. Port 9100 exposed to NMS core.",
  "knownLimitations": "Maximum measurable loop distance is 45km per ODF card.",
  "recommendations": "Conduct optical port recalibration every 6 months."
}
```
- **Response (201 Created):** Created handover record.

### 5.5 Submit Performance Rating
Submits multi-dimensional evaluation.

- **Endpoint:** `POST /api/projects/{id}/rate`
- **Auth Required:** Yes (`DGM`, `NON_DIGITAL_LAB_USER`, `ADMIN`)
- **Request Body:**
```json
{
  "overallRating": 5.0,
  "communicationScore": 5.0,
  "deliverySpeedScore": 4.5,
  "technicalQualityScore": 5.0,
  "writtenFeedback": "Outstanding execution. MTTR reduction exceeded expectations."
}
```
- **Response (201 Created):** Recorded rating entity.

---

# 6. Module 5: Real-Time Chat & File Attachments

### 6.1 List User Chat Rooms
- **Endpoint:** `GET /api/chat/rooms`
- **Auth Required:** Yes (Authenticated)
- **Response (200 OK):** Array of active channels the user participates in.

### 6.2 Retrieve Message History
- **Endpoint:** `GET /api/chat/rooms/{roomId}/messages`
- **Auth Required:** Yes (Room participant)
- **Query Parameters:** `?before={timestamp}&limit=50`
- **Response (200 OK):** Message array with user details and attached document metadata.

### 6.3 Upload Document Attachment
Uploads a business document to a collaboration channel.

- **Endpoint:** `POST /api/chat/rooms/{roomId}/attachments`
- **Auth Required:** Yes (Room participant)
- **Content-Type:** `multipart/form-data`
- **Form Data:**
  - `file`: Binary document payload (max 10 MB)
- **Response (201 Created):**
```json
{
  "attachmentId": "8b3f21cb-4e92-4f61-b543-123456789abc",
  "originalFileName": "Optical_Ring_Architecture_v1.pdf",
  "storedFileName": "9f2a1b3c-5d6e-4f7a-8b9c-0d1e2f3a4b5c.pdf",
  "fileExtension": ".pdf",
  "contentType": "application/pdf",
  "fileSizeBytes": 2458900,
  "uploadedAt": "2026-11-18T07:58:10Z"
}
```

### 6.4 Download Attachment
Streams document with download attachment header.

- **Endpoint:** `GET /api/chat/attachments/{attachmentId}/download`
- **Auth Required:** Yes (Room participant)
- **Response Header:** `Content-Disposition: attachment; filename="Optical_Ring_Architecture_v1.pdf"`

### 6.5 Safe Inline Viewing
Displays document directly in browser tab (PDF, PNG, JPEG only).

- **Endpoint:** `GET /api/chat/attachments/{attachmentId}/view`
- **Auth Required:** Yes (Room participant)
- **Response Header:** `Content-Disposition: inline; filename="Optical_Ring_Architecture_v1.pdf"`

### 6.6 SignalR Real-Time WebSocket Hub
- **Hub URL:** `/hubs/project-chat?access_token=<JWT>`
- **Client Methods:**
  - `JoinRoom(Guid roomId)`
  - `LeaveRoom(Guid roomId)`
  - `SendMessage(Guid roomId, string content, string messageType)`
- **Server Broadcast Events:**
  - `ReceiveMessage(ChatMessageDto message)`
  - `ReceiveAttachment(ChatAttachmentDto attachment)`
  - `UserJoined(Guid roomId, string username)`
  - `UserLeft(Guid roomId, string username)`

---

# 7. Module 6: Executive Dashboards & Analytics

### 7.1 Admin Dashboard
- **Endpoint:** `GET /api/dashboard/admin`
- **Auth Required:** Yes (`ADMIN`)
- **Metrics Returned:** Total users, total projects, active chat channels, total audit logs, recent activities log.

### 7.2 DGM Dashboard
- **Endpoint:** `GET /api/dashboard/dgm`
- **Auth Required:** Yes (`DGM`, `ADMIN`)
- **Metrics Returned:** Pending proposal reviews count, approved projects count, ongoing lab projects count, active supervisors count, urgent review queue.

### 7.3 Higher Management Dashboard
- **Endpoint:** `GET /api/dashboard/higher-management`
- **Auth Required:** Yes (`HIGHER_MANAGEMENT`, `DGM`, `ADMIN`)
- **Metrics Returned:** Total portfolio volume, completed projects count, portfolio completion percentage, department velocity benchmarks, average satisfaction ratings.

### 7.4 Digital Lab Workspace
- **Endpoint:** `GET /api/dashboard/digital-lab`
- **Auth Required:** Yes (`DIGITAL_LAB_USER`, `ADMIN`)
- **Metrics Returned:** Assigned active projects, pending assignments awaiting acceptance, milestone targets due this week.

### 7.5 Non-Digital Lab Requester Workspace
- **Endpoint:** `GET /api/dashboard/non-digital-lab`
- **Auth Required:** Yes (`NON_DIGITAL_LAB_USER`, `ADMIN`)
- **Metrics Returned:** Sponsoring department proposals count, approved count, executing count, completed count, active collaboration alerts.

---

# 8. Module 7: Notifications & System Health

### 8.1 List User Notifications
- **Endpoint:** `GET /api/notifications`
- **Auth Required:** Yes (Authenticated)
- **Query Parameters:** `?unreadOnly=false`
- **Response (200 OK):** Notification array with `id`, `title`, `message`, `type`, `referenceId`, `isRead`, `createdAt`.

### 8.2 Mark Single Notification Read
- **Endpoint:** `PUT /api/notifications/{id}/read`
- **Auth Required:** Yes (Notification recipient)
- **Response (200 OK):** Updated status.

### 8.3 Mark All Notifications Read
- **Endpoint:** `PUT /api/notifications/read-all`
- **Auth Required:** Yes (Authenticated)
- **Response (200 OK):** Batch update confirmation.

### 8.4 System Health Check
- **Endpoint:** `GET /api/health`
- **Auth Required:** No (Public)
- **Response (200 OK):**
```json
{
  "status": "Healthy",
  "timestamp": "2026-11-18T18:00:00Z",
  "service": "SLT Inter-Departmental Communication & Collaboration API",
  "version": "1.0.0",
  "database": {
    "configured": true,
    "connected": true,
    "host": "localhost",
    "port": 5432,
    "database": "slt_collab_db"
  }
}
```

---

*End of Document 4: REST API & SignalR Hub Specification.*
