# HRMS Lite

A production-ready, scalable Human Resource Management System built with Django REST Framework and React.

---

## Live Demo

| Service | URL |
|---|---|
| Frontend | `https://hrms-lite.vercel.app` |
| Backend API | `https://hrms-lite-api.railway.app` |
| API Health | `https://hrms-lite-api.railway.app/health/` |

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18 + Vite | UI framework |
| **State / Cache** | TanStack React Query v5 | Server state, client-side caching |
| **Routing** | React Router v6 | SPA navigation |
| **Styling** | Tailwind CSS v3 | Utility-first styling |
| **HTTP Client** | Axios | API communication with interceptors |
| **Toast Notifications** | react-hot-toast | User feedback |
| **Backend** | Django 4.2 + DRF | REST API framework |
| **Database** | PostgreSQL | Primary data store |
| **Cache Layer** | Redis + django-redis | Server-side response caching |
| **App Server** | Gunicorn (gthread) | Production WSGI server |
| **Static Files** | WhiteNoise | Serve static assets from Django |
| **Frontend Deploy** | Vercel | CDN + CI/CD |
| **Backend Deploy** | Railway | Managed Postgres + Redis + Django |

---

## Architecture

```
Browser → Vercel (React SPA)
              ↕ HTTPS / JSON
         Railway (Nginx → Gunicorn workers → Django DRF)
              ↕                    ↕
         PostgreSQL            Redis Cache
```

### Performance optimizations

- **React Query** client-side caching with 30–60s stale times and `keepPreviousData` for zero-flicker pagination
- **Redis** caches employee lists, attendance records, and dashboard stats — eliminates 90%+ of DB reads under repeated load
- **Annotated querysets** — attendance counts (present/absent) are computed with a single SQL `COUNT` + `GROUP BY`, not in Python loops
- **`select_related`** on all attendance queries — eliminates N+1 joins on employee foreign keys
- **`prefetch_related`** pattern ready for future nested resources
- **DB indexes** on all hot columns: `employee_id`, `email`, `department`, `date`, `status`, and composite indexes for the most common filter combinations
- **Gunicorn gthread workers** — `(2 × CPU cores + 1)` workers × 4 threads each = ~16–32 concurrent requests per instance
- **`CONN_MAX_AGE=60`** — persistent DB connections, avoids per-request TCP handshake overhead

---

## Local Development

### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL 15+
- Redis 7+

---

### 1. Clone the repo

```bash
git clone https://github.com/your-username/hrms-lite.git
cd hrms-lite
```

---

### 2. Backend setup

```bash
cd backend

# Create and activate virtualenv
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your DB credentials and Redis URL
```

**Minimum `.env` for local development:**
```env
SECRET_KEY=any-random-string-for-dev
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DB_NAME=hrms_db
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432
REDIS_URL=redis://localhost:6379/0
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

**Create the PostgreSQL database:**
```bash
psql -U postgres -c "CREATE DATABASE hrms_db;"
```

**Run migrations and start the server:**
```bash
python manage.py migrate
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/v1/`

---

### 3. Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment (optional for local dev — Vite proxies /api to localhost:8000)
cp .env.example .env.local

# Start the dev server
npm run dev
```

The app will be available at `http://localhost:5173`

---

## API Reference

### Employees

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/employees/` | List all employees (paginated, filterable) |
| `POST` | `/api/v1/employees/` | Create a new employee |
| `GET` | `/api/v1/employees/:id/` | Get employee detail |
| `DELETE` | `/api/v1/employees/:id/` | Delete an employee |
| `GET` | `/api/v1/employees/departments/` | List all department choices |
| `GET` | `/api/v1/employees/dashboard-stats/` | Aggregated dashboard counts |

**Query parameters for list:**
- `search` — search by name, email, or employee ID
- `department` — filter by department name
- `page` — page number (default: 1)
- `page_size` — results per page (default: 20, max: 100)
- `ordering` — sort field (e.g. `full_name`, `-created_at`)

### Attendance

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/attendance/` | List attendance records (paginated, filterable) |
| `POST` | `/api/v1/attendance/` | Mark attendance for one employee |
| `PATCH` | `/api/v1/attendance/:id/` | Update an attendance record |
| `DELETE` | `/api/v1/attendance/:id/` | Delete an attendance record |
| `POST` | `/api/v1/attendance/bulk/` | Bulk mark attendance for multiple employees |
| `GET` | `/api/v1/attendance/summary/` | Present/absent summary for one employee |

**Query parameters for list:**
- `employee` — filter by employee UUID
- `date` — exact date (YYYY-MM-DD)
- `date_from` / `date_to` — date range
- `status` — `Present` or `Absent`
- `department` — filter by employee department

---

## Deployment

### Backend — Railway

1. Create a new Railway project and add a **PostgreSQL** and **Redis** plugin
2. Connect your GitHub repo and set the root directory to `/backend`
3. Set environment variables (see `.env.example`)
4. Railway will auto-detect `railway.toml` and run migrations on deploy

### Frontend — Vercel

1. Import the repo on Vercel, set the root directory to `/frontend`
2. Add env variable: `VITE_API_URL=https://your-backend.railway.app/api/v1`
3. Vercel detects `vercel.json` automatically — deploy

---

## Assumptions & Limitations

- **Single admin user** — no authentication or role-based access control
- **No leave management** — out of scope per requirements
- **No payroll** — out of scope per requirements
- **Attendance is daily** — one record per employee per day (enforced at DB and serializer level)
- **Future dates** — attendance cannot be marked for future dates (validated server-side)
- **Department list** — fixed set of departments defined in the model; not user-configurable
- **Soft delete** — not implemented; deleting an employee cascades and permanently removes all their attendance records
- **Redis fallback** — if Redis is unavailable, the app degrades gracefully (cache misses hit the DB directly; no data loss)

---

## Project Structure

```
hrms-lite/
├── backend/
│   ├── hrms/
│   │   ├── settings/
│   │   │   ├── base.py          # Shared settings
│   │   │   ├── development.py
│   │   │   └── production.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── core/
│   │   ├── cache.py             # Cache key registry + invalidation helpers
│   │   ├── exceptions.py        # Normalized error handler
│   │   └── pagination.py        # Standard paginated response envelope
│   ├── employees/
│   │   ├── models.py            # Employee model with indexes
│   │   ├── serializers.py       # Validation + field-level errors
│   │   ├── views.py             # Cached viewset + dashboard stats
│   │   ├── filters.py           # Search + department filter
│   │   └── urls.py
│   ├── attendance/
│   │   ├── models.py            # UniqueConstraint + composite indexes
│   │   ├── serializers.py       # Date validation + bulk serializer
│   │   ├── views.py             # select_related + bulk endpoint
│   │   ├── filters.py           # Date range + status filter
│   │   └── urls.py
│   ├── gunicorn.conf.py         # Production server config
│   ├── railway.toml
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ui/              # Button, Input, Select, Modal, Pagination, States
    │   │   ├── layout/          # AppLayout, Sidebar, Header
    │   │   ├── employees/       # EmployeeTable, AddEmployeeModal
    │   │   ├── attendance/      # AttendanceTable, MarkAttendanceModal
    │   │   └── dashboard/       # StatCard
    │   ├── hooks/               # useEmployees, useAttendance, useDebounce
    │   ├── lib/                 # queryKeys, utils
    │   ├── pages/               # Dashboard, Employees, Attendance, NotFound
    │   ├── services/            # apiClient, employeeService, attendanceService
    │   ├── App.jsx
    │   └── main.jsx
    ├── tailwind.config.js
    ├── vite.config.js
    └── vercel.json
```
