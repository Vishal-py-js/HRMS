# HRMS Lite

A production-ready Human Resource Management System built with Django REST Framework and React. Supports employee management, daily attendance tracking, per-employee attendance history, and a live dashboard with drill-down navigation.

---

## Live Demo

| Service     | URL                                          |
|-------------|----------------------------------------------|
| Frontend    | `https://zippy-celebration-production-0538.up.railway.app`          |
| Backend API | `https://hrms-production-c9e9.up.railway.app/api/v1/`   |
| Health      | `https://hrms-production-c9e9.up.railway.app/health/`   |

---

## Tech Stack

| Layer              | Technology                         | Purpose                                   |
|--------------------|------------------------------------|-------------------------------------------|
| **Frontend**       | React 18 + Vite                    | SPA framework                             |
| **State / Cache**  | TanStack React Query v5            | Server state, client-side caching         |
| **Routing**        | React Router v6                    | SPA navigation + URL-driven drill-downs   |
| **Styling**        | Tailwind CSS v3                    | Utility-first styling                     |
| **HTTP Client**    | Axios                              | API calls with normalised error handling  |
| **Notifications**  | react-hot-toast                    | User feedback toasts                      |
| **Backend**        | Django 4.2 + Django REST Framework | REST API                                  |
| **Database**       | PostgreSQL (Railway)               | Primary data store                        |
| **Cache**          | Redis + django-redis               | Server-side response caching              |
| **App Server**     | Gunicorn (gthread)                 | Production WSGI server                    |
| **Static Files**   | WhiteNoise                         | Serve static assets from Django           |
| **Deployment**     | Railway                            | Backend + Frontend + DB + Redis           |

---

## Architecture

```
Browser
  |
  v
React SPA (Railway — Express static server)
  |  HTTPS + JSON
  v
Django + Gunicorn (Railway)
  |               |
  v               v
PostgreSQL      Redis
(Railway)      (Railway)
```

### Performance Optimisations

- **React Query** with `staleTime: 0` and `resetQueries` after every mutation — guarantees UI always reflects the latest data immediately after create, update, or delete
- **Redis** caches dashboard stats with a 30s TTL — reduces DB load on the most expensive aggregation query
- **Annotated querysets** — attendance counts computed with a single SQL `COUNT + filter`, never in Python loops
- **`select_related`** on all attendance queries — eliminates N+1 joins on the employee foreign key
- **`.only()`** on attendance list — fetches only required columns, reduces data transferred from DB
- **DB indexes** on `employee_id`, `email`, `department`, `date`, `status`, plus composite indexes for the most common filter combinations
- **Gunicorn gthread workers** — `(2 x CPU cores + 1)` workers x 4 threads, reads `PORT` dynamically from Railway's environment variable
- **`CONN_MAX_AGE=60`** — persistent DB connections, avoids per-request TCP handshake overhead

---

## Prerequisites

- Python 3.11+
- Node.js 20+
- A `.env` file for the backend (provided separately — contains Railway PostgreSQL and Redis credentials)

PostgreSQL and Redis run on Railway. You do **not** need to install them locally.

---

## Project Structure

```
hrms-lite/
|-- backend/
|   |-- hrms/
|   |   |-- settings/
|   |   |   |-- base.py            # Shared settings (DB, Redis, DRF, pagination)
|   |   |   |-- development.py     # Local dev overrides
|   |   |   `-- production.py      # Production security settings
|   |   |-- urls.py                # Root URL config + /health/ endpoint
|   |   `-- wsgi.py
|   |-- core/
|   |   |-- cache.py               # Cache key registry + invalidation helpers
|   |   |-- exceptions.py          # Normalised error handler for all exceptions
|   |   `-- pagination.py          # Standard paginated response envelope
|   |-- employees/
|   |   |-- models.py              # Employee model with UUID PK and composite indexes
|   |   |-- serializers.py         # Validation, field errors, AttendanceOverviewSerializer
|   |   |-- views.py               # Viewset with dashboard-stats, not-marked, overview
|   |   |-- filters.py             # Search + department filter
|   |   |-- admin.py
|   |   `-- urls.py
|   |-- attendance/
|   |   |-- models.py              # UniqueConstraint (employee+date), composite indexes
|   |   |-- serializers.py         # Date validation, duplicate check, bulk serializer
|   |   |-- views.py               # select_related, .only(), bulk endpoint, summary
|   |   |-- filters.py             # Date range, status, department filter
|   |   |-- admin.py
|   |   `-- urls.py
|   |-- gunicorn.conf.py           # Dynamic PORT binding, gthread workers
|   |-- railway.toml               # migrate + collectstatic + gunicorn on deploy
|   |-- nixpacks.toml              # Explicit Python 3.11 for Railway build
|   |-- manage.py
|   `-- requirements.txt
|
`-- frontend/
    |-- public/
    |   `-- favicon.svg
    |-- src/
    |   |-- components/
    |   |   |-- ui/
    |   |   |   |-- Button.jsx
    |   |   |   |-- Input.jsx
    |   |   |   |-- Select.jsx
    |   |   |   |-- Modal.jsx
    |   |   |   |-- Pagination.jsx
    |   |   |   |-- States.jsx         # EmptyState, ErrorState, TableSkeleton, Spinner
    |   |   |   `-- ConfirmDialog.jsx
    |   |   |-- layout/
    |   |   |   |-- AppLayout.jsx
    |   |   |   |-- Sidebar.jsx
    |   |   |   `-- Header.jsx
    |   |   |-- employees/
    |   |   |   |-- EmployeeTable.jsx  # Clickable rows navigate to EmployeeDetail
    |   |   |   `-- AddEmployeeModal.jsx
    |   |   |-- attendance/
    |   |   |   |-- AttendanceTable.jsx
    |   |   |   |-- AttendanceOverviewTable.jsx  # Unified Present+Absent+NotMarked view
    |   |   |   `-- MarkAttendanceModal.jsx      # useEffect form-reset fix
    |   |   `-- dashboard/
    |   |       `-- StatCard.jsx       # Clickable drill-down stat cards
    |   |-- hooks/
    |   |   |-- useEmployees.js        # useEmployees, useEmployee, useNotMarkedEmployees,
    |   |   |                          # useAttendanceOverview, useDashboardStats
    |   |   |-- useAttendance.js       # useAttendance, useAttendanceSummary + mutations
    |   |   `-- useDebounce.js
    |   |-- lib/
    |   |   |-- queryKeys.js           # Centralised React Query key factory
    |   |   `-- utils.js               # cn, formatDate, getInitials, getDeptColor, todayISO
    |   |-- pages/
    |   |   |-- Dashboard.jsx          # Stats, dept breakdown, today feed, quick links
    |   |   |-- Employees.jsx          # Search, filter, not-marked drill-down mode
    |   |   |-- Attendance.jsx         # Filters including Not Marked + overview mode
    |   |   |-- EmployeeDetail.jsx     # Per-employee attendance history + summary stats
    |   |   `-- NotFound.jsx
    |   |-- services/
    |   |   |-- apiClient.js           # Axios + normalised error interceptor
    |   |   |-- employeeService.js     # All employee API calls
    |   |   `-- attendanceService.js   # All attendance API calls
    |   |-- App.jsx                    # Routes including /employees/:id
    |   |-- main.jsx                   # QueryClient + BrowserRouter + Toaster
    |   `-- index.css                  # Tailwind base + custom component classes
    |-- server.js                      # Express static file server (ES module syntax)
    |-- tailwind.config.js
    |-- vite.config.js
    |-- railway.toml
    |-- nixpacks.toml
    `-- package.json
```

---

## Running Locally

### Step 1 — Clone the Repo

```bash
git clone https://github.com/Vishal-py-js/HRMS.git
cd HRMS
```

---

### Step 2 — Backend Setup

```bash
cd backend

# Windows
python -m venv venv
venv\Scripts\Activate.ps1

# macOS / Linux
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Place the provided `.env` file inside the `backend/` folder:

```env
SECRET_KEY=your-secret-key
DEBUG=True
DJANGO_ENV=development
ALLOWED_HOSTS=localhost,127.0.0.1

# PostgreSQL — Railway remote database (from .env file provided to you)
DB_NAME=railway
DB_USER=postgres
DB_PASSWORD=your-railway-db-password
DB_HOST=your-db-host.railway.app
DB_PORT=your-db-port

# Redis — Railway remote Redis (from .env file provided to you)
REDIS_URL=redis://default:your-redis-password@your-redis-host.railway.app:port

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

Run migrations:

```bash
python manage.py migrate
```

Start the dev server:

```bash
python manage.py runserver
```

API is now available at `http://localhost:8000/api/v1/`

---

### Step 3 — Frontend Setup

Open a new terminal:

```bash
cd hrms-lite/frontend

npm install
npm run dev
```

App is now available at `http://localhost:5173`

Vite automatically proxies all `/api` requests to `http://localhost:8000` — no extra configuration needed for local development.

---

## API Reference

### Employees

| Method   | Endpoint                                 | Description                                           |
|----------|------------------------------------------|-------------------------------------------------------|
| `GET`    | `/api/v1/employees/`                     | List employees — paginated, filterable, searchable    |
| `POST`   | `/api/v1/employees/`                     | Create a new employee                                 |
| `GET`    | `/api/v1/employees/:id/`                 | Get single employee detail                            |
| `DELETE` | `/api/v1/employees/:id/`                 | Delete employee and all their attendance records      |
| `GET`    | `/api/v1/employees/departments/`         | List all valid department choices for dropdowns       |
| `GET`    | `/api/v1/employees/dashboard-stats/`     | Aggregated counts — total, present, absent, unmarked  |
| `GET`    | `/api/v1/employees/not-marked/`          | Employees with no attendance record for a given date  |
| `GET`    | `/api/v1/employees/attendance-overview/` | All employees with their status for a given date      |

**Query parameters — employee list:**

| Param        | Type   | Description                                   |
|--------------|--------|-----------------------------------------------|
| `search`     | string | Search by name, email, or employee ID         |
| `department` | string | Filter by department name                     |
| `page`       | int    | Page number (default: 1)                      |
| `page_size`  | int    | Results per page (default: 20, max: 100)      |
| `ordering`   | string | Sort field e.g. `full_name`, `-created_at`    |

**Query parameters — not-marked:**

| Param  | Type   | Description                    |
|--------|--------|--------------------------------|
| `date` | string | Required. Format: YYYY-MM-DD   |

**Query parameters — attendance-overview:**

| Param        | Type   | Description                                          |
|--------------|--------|------------------------------------------------------|
| `date`       | string | Required. Format: YYYY-MM-DD                         |
| `status`     | string | Optional: `Present`, `Absent`, or `Not Marked`       |
| `department` | string | Optional department filter                           |
| `page`       | int    | Page number                                          |
| `page_size`  | int    | Results per page (default: 20)                       |

---

### Attendance

| Method   | Endpoint                        | Description                                              |
|----------|---------------------------------|----------------------------------------------------------|
| `GET`    | `/api/v1/attendance/`           | List attendance records — paginated, filterable           |
| `POST`   | `/api/v1/attendance/`           | Mark attendance for one employee                          |
| `PATCH`  | `/api/v1/attendance/:id/`       | Update an existing attendance record                      |
| `DELETE` | `/api/v1/attendance/:id/`       | Delete an attendance record                               |
| `POST`   | `/api/v1/attendance/bulk/`      | Bulk mark attendance for multiple employees (idempotent)  |
| `GET`    | `/api/v1/attendance/summary/`   | Total present and absent counts for one employee          |

**Query parameters — attendance list:**

| Param        | Type   | Description                        |
|--------------|--------|------------------------------------|
| `employee`   | UUID   | Filter by employee UUID            |
| `date`       | string | Exact date — YYYY-MM-DD            |
| `date_from`  | string | Start of date range — YYYY-MM-DD   |
| `date_to`    | string | End of date range — YYYY-MM-DD     |
| `status`     | string | `Present` or `Absent`              |
| `department` | string | Filter by employee department      |
| `page`       | int    | Page number                        |
| `page_size`  | int    | Results per page (default: 20)     |

**Query parameters — summary:**

| Param      | Type | Description             |
|------------|------|-------------------------|
| `employee` | UUID | Required. Employee UUID |

---

### Response Shapes

**Paginated list:**
```json
{
  "pagination": {
    "count": 284,
    "total_pages": 15,
    "current_page": 1,
    "next": "https://...",
    "previous": null,
    "page_size": 20
  },
  "results": []
}
```

**Error:**
```json
{
  "error": "Human readable message.",
  "details": { "field": ["error detail"] },
  "status_code": 400
}
```

---

## Pages and Features

### Dashboard (`/`)
- 4 stat cards — Total Employees, Present Today, Absent Today, Not Marked
- Every stat card is clickable and navigates to a pre-filtered view
  - Present Today → `/attendance?status=Present&date=today`
  - Absent Today → `/attendance?status=Absent&date=today`
  - Not Marked → `/employees?not_marked=today`
  - Total Employees → `/employees`
- Department breakdown bar chart with headcount and percentages
- Today's attendance mini-feed with latest 6 records
- Quick action links to Add Employee and Mark Attendance

### Employees (`/employees`)
- Paginated table — 20 employees per page
- Search by name, email, or employee ID (debounced 350ms — no query on every keystroke)
- Filter by department
- Add Employee modal with server-side validation and field-level error display
- Delete employee with confirmation dialog
- Every row is clickable — navigates to that employee's detail page
- Not Marked drill-down mode (via `?not_marked=YYYY-MM-DD`) — shows only employees with no attendance for that date, with an amber info banner and a Clear Filter button

### Employee Detail (`/employees/:id`)
- Employee profile card — name, employee ID, email, department, join date
- 3 summary stat cards — Total Records, Days Present, Days Absent (real data from `/attendance/summary/`)
- Full paginated attendance history for that employee
- Date range and status filters scoped to that employee only
- Mark Attendance button pre-filled for this employee
- Edit and delete on individual attendance rows
- Delete employee button with confirmation dialog
- Back to Employees navigation

### Attendance (`/attendance`)
- Paginated attendance records — 20 per page
- Filters: employee dropdown, date range, status
- Status dropdown options: All Statuses, Present, Absent, Not Marked
- **Not Marked mode** — selecting Not Marked shows employees with no record for the selected date, each row has a Mark button that opens the modal pre-filled with that employee and date
- **Attendance Overview mode** — automatically activates when a single date is selected with All Statuses — shows every employee with their Present / Absent / Not Marked status in one unified table with edit and delete actions on marked rows
- Mark Attendance modal correctly resets form when opened for different employees (useEffect fix)
- Show Today Only shortcut link

---

## Deployment on Railway

All services run inside one Railway project:

```
Railway Project
|-- PostgreSQL       (database plugin)
|-- Redis            (Redis plugin)
|-- Django Backend   (GitHub repo, root dir: backend)
`-- React Frontend   (GitHub repo, root dir: frontend)
```

### Backend Variables

```env
SECRET_KEY=your-long-random-secret-key
DEBUG=False
DJANGO_ENV=production
ALLOWED_HOSTS=your-backend.railway.app,healthcheck.railway.app
PORT=8000

DB_NAME=${{Postgres.PGDATABASE}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}

REDIS_URL=${{Redis.REDIS_URL}}

CORS_ALLOWED_ORIGINS=https://your-frontend.railway.app
```

### Frontend Variables

```env
VITE_API_URL=https://your-backend.railway.app/api/v1
PORT=3000
```