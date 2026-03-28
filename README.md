<p align="center">
  <img src="public/images/Cyanora.jpg" alt="Cyanora HRMS" width="120" />
</p>

<h1 align="center">Cyanora HRMS</h1>

<p align="center">
  <b>Modern, role-based Human Resource Management System</b><br/>
  <sub>Built with Next.js 15 · TypeScript · Supabase · Prisma</sub>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" alt="Next.js"/>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase"/>
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma"/>
  <img src="https://img.shields.io/badge/Tailwind-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind"/>
  <img src="https://img.shields.io/badge/Vercel-Deployed-000?style=for-the-badge&logo=vercel" alt="Vercel"/>
</p>

<p align="center">
  <a href="https://cyanora.vercel.app">Live Demo</a> · <a href="#getting-started">Quick Start</a> · <a href="#contributing">Contribute</a>
</p>

<!--
🖼️ SCREENSHOTS — Replace with actual screenshots

<p align="center">
  <img src="docs/screenshots/dashboard.png" width="70%" alt="Dashboard" />
</p>
<p align="center">
  <img src="docs/screenshots/attendance.png" width="45%" alt="Attendance"/>
  &nbsp;
  <img src="docs/screenshots/leave.png" width="45%" alt="Leave Management"/>
</p>
-->

---

## Overview

Cyanora HRMS is a full-stack web application that centralizes core HR operations — employee management, attendance tracking, leave workflows, and company announcements — into a single platform with granular role-based access control.

**Why this exists:** Most small-to-medium companies still manage HR through spreadsheets and manual processes. Cyanora replaces that with a structured digital workflow where every action is tracked, permissioned, and auditable.

## Key Features

| Module | Description |
|--------|-------------|
| **Authentication** | Google OAuth via NextAuth with JWT session management and middleware-level route protection |
| **Role-Based Access** | Three-tier RBAC (Admin → HR → Employee) with granular permission guards at page and API level |
| **Attendance** | GPS-enabled check-in/check-out with real-time status tracking and offline fallback |
| **Leave Management** | Request submission, balance calculation, multi-level approval workflow |
| **Employee Directory** | Full CRUD with department/position relations and profile management |
| **Announcements** | Company-wide updates published by Admin/HR, visible on employee dashboards |
| **Dashboard** | Role-aware overview with key metrics and quick actions |

## Architecture

```
Client (Browser)
    │
    ▼
┌─────────────────────────────────────────────┐
│  Next.js 15 (App Router + RSC)              │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │  Pages   │  │  API      │  │ Middleware │  │
│  │  (RSC)   │  │  Routes   │  │ (JWT Auth) │  │
│  └────┬─────┘  └────┬─────┘  └───────────┘  │
│       │              │                        │
│  ┌────▼──────────────▼─────┐                  │
│  │  Shared Lib Layer       │                  │
│  │  (Supabase clients,     │                  │
│  │   Prisma, JWT, RBAC)    │                  │
│  └────────────┬────────────┘                  │
└───────────────┼──────────────────────────────┘
                │
    ┌───────────▼───────────┐
    │  Supabase Platform    │
    │  ┌─────┐ ┌─────────┐ │
    │  │ DB  │ │ Storage  │ │
    │  │(PG) │ │ (Files)  │ │
    │  └─────┘ └─────────┘ │
    └───────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, RSC, Turbopack) |
| Language | TypeScript (strict mode) |
| Database | PostgreSQL via Supabase |
| ORM | Prisma (NextAuth tables) + Supabase Client (HR tables) |
| Auth | NextAuth + custom JWT middleware |
| UI | Tailwind CSS + shadcn/ui + Radix Primitives |
| Validation | Zod + React Hook Form |
| Icons | Lucide React |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 20+
- Supabase project (PostgreSQL + Auth + Storage)
- Google OAuth credentials

### Installation

```bash
git clone https://github.com/Centauryyy25/Cyanora.git
cd Cyanora
npm install
```

### Environment Setup

Create `.env.local` at the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Database
DATABASE_URL=

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

# JWT
AUTH_JWT_SECRET=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### Database Migration

```bash
npx prisma migrate dev
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
Cyanora/
├── src/
│   ├── app/                # App Router — pages, layouts, API routes
│   │   ├── api/            # Server-side API handlers
│   │   ├── attendance/     # Attendance module
│   │   ├── dashboard/      # Role-aware dashboard
│   │   ├── leave/          # Leave management
│   │   └── ...
│   ├── components/         # Reusable UI (permission guards, widgets)
│   └── lib/                # Shared utilities
│       ├── auth.ts         # NextAuth configuration
│       ├── jwt.ts          # JWT sign/verify helpers
│       ├── supabase.ts     # Supabase server client
│       ├── supabase-browser.ts
│       ├── supabase-admin.ts
│       ├── prisma.ts       # Prisma client singleton
│       ├── leave.ts        # Leave balance calculation
│       └── rate-limit.ts   # API rate limiter
├── prisma/
│   └── schema.prisma       # NextAuth + user schema
├── public/                 # Static assets
├── scripts/                # Build-time tooling
├── middleware.ts           # Route protection & JWT validation
└── package.json
```

## Roles & Permissions

| Role | Capabilities |
|------|-------------|
| **Admin** | Employee CRUD, role/permission management, user provisioning, announcements |
| **HR** | Leave approvals, attendance monitoring, employee directory (read) |
| **Employee** | Check-in/out, leave requests, profile updates, view announcements |

Permissions are enforced at two layers: middleware (route-level) and `<PermissionGuard>` components (UI-level), ensuring consistent access control across SSR and client navigation.

## Database Schema

```
roles ──1:N── role_permissions ──N:1── permissions

users ──1:N── employees ──1:N── attendance
                        ──1:N── leave_requests
                        ──1:1── leave_balances
```

Core tables: `users`, `employees`, `attendance`, `leave_requests`, `leave_balances`, `roles`, `permissions`, `role_permissions`, `announcements`.

## Roadmap

- [ ] Geofencing-based attendance validation
- [ ] Email/SMS notifications for approvals
- [ ] HR analytics dashboard with attrition insights
- [ ] React Native mobile companion app
- [ ] Payroll module integration

## Contributing

```bash
# Create a feature branch from dev
git checkout -b feature/your-feature

# Commit using conventional commits
git commit -m "feat: add attendance summary export"

# Push and open a PR against dev
git push origin feature/your-feature
```

## License

MIT — see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built by <a href="https://www.linkedin.com/in/ilham-ahsan-saputra/"><b>Ilham Ahsan Saputra</b></a><br/>
  <sub>Computer Science Student · Junior Network Engineer</sub>
</p>
