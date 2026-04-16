# Academic Planner - Advisor Portal

A Student Learning Roadmap Management and Consulting System built with React, Vite, and Shadcn UI. This portal helps academic advisors (CVHT) analyze student data and recommend courses for upcoming semesters.

## Features

- **Dashboard** — Quick student lookup, program overview, and planning tools summary
- **Student Search** — Query students by ID, name, program, and cohort with pagination
- **Student Detail / Audit** — Progress dashboard with dynamic tabs/accordions based on knowledge blocks, transcript view, missing courses
- **Next-term Planner** — Two-panel interface showing eligible courses and AI-ranked suggestions with explanations
- **Plan Management** — Select, modify, and save course plans to the database
- Light/dark mode, responsive, accessible (Shadcn UI + Radix)

## Tech Stack

- **Framework:** React 19 + TypeScript
- **Build:** Vite 7
- **UI:** Shadcn UI (Tailwind CSS + Radix UI)
- **Routing:** TanStack Router (file-based)
- **Data Fetching:** TanStack Query + Axios
- **State:** Zustand
- **Backend:** .NET Core API (see `../academic-planner-api`)
- **Database:** PostgreSQL with ORDBMS features (JSONB, composite types)
- **Auth:** Keycloak (JWT Bearer with RBAC roles: CVHT, SV, Admin)

## Run Locally

```bash
# Install dependencies
pnpm install

# Create .env from example
cp .env.example .env
# Edit .env to set VITE_API_URL (default: http://localhost:8080)

# Start dev server
pnpm run dev
```

## Project Structure

```
src/
├── features/
│   ├── dashboard/          # Advisor dashboard with quick lookup
│   ├── students/           # Student search + detail/audit pages
│   ├── planner/            # Next-term planner with AI suggestions
│   └── ...
├── hooks/
│   └── use-academic-api.ts # React Query hooks for all API endpoints
├── lib/
│   └── api-client.ts       # Axios client + TypeScript API types
├── routes/
│   └── _authenticated/
│       ├── students/       # /students, /students/:studentId
│       └── planner/        # /planner/:studentId
└── components/
    ├── ui/                 # Shadcn primitives
    └── layout/             # App shell, sidebar, header
```
