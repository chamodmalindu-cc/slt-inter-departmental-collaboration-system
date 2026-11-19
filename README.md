# Inter-Departmental Project Communication & Collaboration System for SLT

Phase 01 – Project Initialization

## Overview
The Inter-Departmental Project Communication & Collaboration System is designed for Sri Lanka Telecom (SLT) to facilitate cross-department project coordination, real-time messaging, status reporting, and workflow tracking.

This repository contains the initialized base architecture establishing clean separation of concerns between frontend and backend tiers.

---

## Architecture & Technology Stack

| Tier | Technology | Description |
|---|---|---|
| **Frontend** | React 19 + TypeScript + Vite | SPA architecture with hot-module reloading and strict typing |
| **Styling** | Tailwind CSS v4 | Modern utility-first CSS framework |
| **Backend** | ASP.NET Core Web API (.NET 8) | High-performance RESTful Web API |
| **Database** | PostgreSQL | Relational database (configured via environment variables) |
| **Real-time** | SignalR | Real-time bidirectional WebSocket/SSE communication |
| **Version Control** | Git | Standard version control structure with dedicated .gitignore |

---

## Directory Structure

```text
.
├── backend/                               # ASP.NET Core 8 Web API
│   ├── Configuration/
│   │   └── DatabaseConfig.cs              # Safe PostgreSQL config from environment variables
│   ├── Controllers/
│   │   └── HealthController.cs            # Health-check endpoint (/api/health)
│   ├── Hubs/
│   │   └── NotificationHub.cs             # SignalR communication hub
│   ├── Properties/
│   │   └── launchSettings.json            # Local development launch configuration (port 5000)
│   ├── appsettings.json                   # Base application settings (no secrets)
│   ├── appsettings.Development.json       # Development logging configuration
│   ├── Program.cs                         # Application entry point, DI, CORS, & middleware
│   ├── SltCommunicationSystem.Api.csproj  # Project file with dependencies
│   ├── .env.example                       # Template for database environment variables
│   └── .gitignore                         # Backend-specific ignore rules
│
├── frontend/                              # React + TypeScript + Vite
│   ├── public/                            # Static assets
│   ├── src/
│   │   ├── services/
│   │   │   └── healthService.ts           # Service for querying backend health check
│   │   ├── App.tsx                        # Main UI dashboard displaying health & system state
│   │   ├── index.css                      # Tailwind CSS root stylesheet
│   │   └── main.tsx                       # React application entry point
│   ├── index.html                         # Single-page application root HTML
│   ├── vite.config.ts                     # Vite config with Tailwind & proxy rules
│   ├── package.json                       # Frontend dependencies and build scripts
│   ├── tsconfig.json                      # TypeScript configuration
│   ├── .env.example                       # Template for frontend environment variables
│   └── .gitignore                         # Frontend-specific ignore rules
│
├── .gitignore                             # Root workspace ignore file
└── README.md                              # Project documentation
```

---

## Environment Variables & Security

**Database credentials and secrets are NEVER hardcoded in source code or committed to version control.**

### Backend (`backend/.env` or OS Environment Variables)
Copy `backend/.env.example` to `backend/.env` (or configure system/Docker environment variables):

```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=slt_collab_db
DB_USER=postgres
DB_PASSWORD=your_secure_password_here
ASPNETCORE_ENVIRONMENT=Development
ASPNETCORE_URLS=http://localhost:5000
```

### Frontend (`frontend/.env`)
Copy `frontend/.env.example` to `frontend/.env`:

```bash
VITE_API_BASE_URL=http://localhost:5000
```

---

## Setup & Running Instructions

### 1. Prerequisites
- **Node.js**: v18+ (tested with v24)
- **.NET SDK**: 8.0+
- **PostgreSQL**: 14+ (optional for Phase 01 initialization)

---

### 2. Frontend Setup & Run

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Run Vite development server
npm run dev
```
The frontend will start at **http://localhost:5173**.

To build for production:
```bash
npm run build
```

---

### 3. Backend Setup & Run

```bash
# Navigate to the backend directory
cd backend

# Restore dependencies
dotnet restore

# Run the ASP.NET Core Web API
dotnet run
```
The backend API will start at **http://localhost:5000**.

- **Health Check Endpoint**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Swagger Documentation**: [http://localhost:5000/swagger](http://localhost:5000/swagger)
- **SignalR Hub**: `http://localhost:5000/hubs/notifications`

---

## Health-Check Verification

When both servers are running:
1. Navigate to **http://localhost:5173** in a browser.
2. The UI automatically queries `/api/health` and displays the real-time status of the API and PostgreSQL configuration.
3. Click **Check Health** at any time to re-query the backend.

Response contract from `/api/health`:
```json
{
  "status": "Healthy",
  "timestamp": "2026-11-09T08:30:00.0000000Z",
  "service": "SLT Inter-Departmental Communication & Collaboration API",
  "version": "1.0.0",
  "database": {
    "configured": true,
    "host": "localhost",
    "port": "5432",
    "database": "slt_collab_db"
  }
}
```
