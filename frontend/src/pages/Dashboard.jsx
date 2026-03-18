import { Link } from "react-router-dom";
import { useDashboardStats } from "@/hooks/useEmployees";
import { useAttendance } from "@/hooks/useAttendance";
import StatCard from "@/components/dashboard/StatCard";
import { StatCardSkeleton, ErrorState } from "@/components/ui/States";
import { getDeptColor, formatDate, cn } from "@/lib/utils";
import { todayISO } from "@/lib/utils";

// ── Icons ─────────────────────────────────────────────────────────────────
const IconUsers = (
  <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
    <path d="M7 8a3 3 0 100-6 3 3 0 000 6zm7.5 1a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 17a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
  </svg>
);
const IconPresent = (
  <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
  </svg>
);
const IconAbsent = (
  <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
  </svg>
);
const IconUnmarked = (
  <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
  </svg>
);

// ── Department bar chart ───────────────────────────────────────────────────
function DeptBreakdown({ departments = [], total }) {
  if (!departments.length) return null;
  return (
    <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card animate-fade-in">
      <h2 className="text-sm font-semibold text-slate-700 mb-4">Employees by Department</h2>
      <div className="space-y-3">
        {departments.map((d) => {
          const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
          return (
            <div key={d.department}>
              <div className="flex items-center justify-between mb-1">
                <span className={cn("dept-pill text-xs", getDeptColor(d.department))}>
                  {d.department}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  {d.count} &middot; {pct}%
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-surface-subtle overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-500 transition-all duration-700 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Today's attendance mini-feed ──────────────────────────────────────────
function TodayFeed() {
  const today = todayISO();
  const { data, isLoading } = useAttendance({ date: today, page_size: 6 });
  const records = data?.results ?? [];

  return (
    <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-700">Today's Attendance</h2>
        <Link
          to="/attendance"
          className="text-xs text-brand-600 hover:text-brand-700 font-medium"
        >
          View all →
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="skeleton h-7 w-7 rounded-full" />
              <div className="skeleton h-3 flex-1 rounded" />
              <div className="skeleton h-5 w-14 rounded-full" />
            </div>
          ))}
        </div>
      ) : records.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">
          No attendance marked yet today.
        </p>
      ) : (
        <ul className="divide-y divide-surface-border/60">
          {records.map((r) => (
            <li key={r.id} className="flex items-center gap-3 py-2.5">
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  getDeptColor(r.employee_department)
                )}
              >
                {r.employee_name?.[0]?.toUpperCase()}
              </div>
              <span className="flex-1 min-w-0 text-sm text-slate-700 truncate">
                {r.employee_name}
              </span>
              <span className={r.status === "Present" ? "badge-present" : "badge-absent"}>
                {r.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { data: stats, isLoading, isError, refetch } = useDashboardStats();

  const att = stats?.attendance_today;
  const today = todayISO(); 

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-slide-up">

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : isError ? (
          <div className="col-span-4">
            <ErrorState message="Could not load dashboard stats." onRetry={refetch} />
          </div>
        ) : (
          <>
            <StatCard
              label="Total Employees"
              value={stats?.total_employees ?? 0}
              sub="All departments"
              icon={IconUsers}
              color="blue"
              to="/employees"                  // ← clicks through to employees list
            />
            <StatCard
              label="Present Today"
              value={att?.present ?? 0}
              sub={formatDate(att?.date)}
              icon={IconPresent}
              color="green"
              to={`/attendance?status=Present&date=${today}`}   // ← pre-filtered
            />
            <StatCard
              label="Absent Today"
              value={att?.absent ?? 0}
              sub={formatDate(att?.date)}
              icon={IconAbsent}
              color="red"
              to={`/attendance?status=Absent&date=${today}`}    // ← pre-filtered
            />
            <StatCard
              label="Not Marked"
              value={att?.not_marked ?? 0}
              sub="Pending today"
              icon={IconUnmarked}
              color="amber"
              to={`/employees?not_marked=${today}`}             // ← we handle this below
            />
          </>
        )}
      </div>

      {/* Lower grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {isLoading ? (
          <>
            <div className="skeleton h-64 rounded-2xl" />
            <div className="skeleton h-64 rounded-2xl" />
          </>
        ) : (
          <>
            <DeptBreakdown
              departments={stats?.department_breakdown ?? []}
              total={stats?.total_employees ?? 0}
            />
            <TodayFeed />
          </>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          to="/employees"
          className="group flex items-center gap-4 rounded-2xl border border-surface-border bg-white p-4 shadow-card hover:shadow-card-hover hover:border-brand-200 transition-all duration-200"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 group-hover:bg-brand-100 transition-colors">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M11 5a3 3 0 11-6 0 3 3 0 016 0zM2.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 018 17a9.953 9.953 0 01-5.385-1.572z"/>
              <path d="M16.25 5.75a.75.75 0 00-1.5 0v2h-2a.75.75 0 000 1.5h2v2a.75.75 0 001.5 0v-2h2a.75.75 0 000-1.5h-2v-2z"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Add Employee</p>
            <p className="text-xs text-slate-400">Create a new employee record</p>
          </div>
          <svg className="ml-auto h-4 w-4 text-slate-300 group-hover:text-brand-400 transition-colors" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd"/>
          </svg>
        </Link>

        <Link
          to="/attendance"
          className="group flex items-center gap-4 rounded-2xl border border-surface-border bg-white p-4 shadow-card hover:shadow-card-hover hover:border-brand-200 transition-all duration-200"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600 group-hover:bg-green-100 transition-colors">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Mark Attendance</p>
            <p className="text-xs text-slate-400">Record today's attendance</p>
          </div>
          <svg className="ml-auto h-4 w-4 text-slate-300 group-hover:text-brand-400 transition-colors" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd"/>
          </svg>
        </Link>
      </div>
    </div>
  );
}
