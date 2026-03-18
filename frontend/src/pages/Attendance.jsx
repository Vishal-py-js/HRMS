import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAttendance } from "@/hooks/useAttendance";
import { useEmployees, useNotMarkedEmployees } from "@/hooks/useEmployees";
import AttendanceTable from "@/components/attendance/AttendanceTable";
import MarkAttendanceModal from "@/components/attendance/MarkAttendanceModal";
import Pagination from "@/components/ui/Pagination";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { EmptyState, TableSkeleton, ErrorState } from "@/components/ui/States";
import { todayISO, formatDate, getInitials, getDeptColor, cn } from "@/lib/utils";

const PAGE_SIZE = 20;

const STATUS_FILTER_OPTIONS = [
  { value: "",           label: "Marked" },
  { value: "Present",    label: "Present"      },
  { value: "Absent",     label: "Absent"       },
  { value: "Not Marked", label: "Not Marked"   },  // ← new
];

// ── Not Marked Table ──────────────────────────────────────────────────────
// Separate table component because "not marked" employees have no attendance
// record — they need a different shape of data and different columns.

function NotMarkedTable({ employees, isLoading, isError, onRetry, onMark }) {
  if (isLoading) return <TableSkeleton rows={8} cols={4} />;

  if (isError) {
    return (
      <ErrorState
        message="Failed to load not-marked employees."
        onRetry={onRetry}
      />
    );
  }

  if (!employees?.length) {
    return (
      <EmptyState
        icon={
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        title="All employees marked"
        description="Every employee has attendance recorded for this date."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th className="hidden sm:table-cell">Department</th>
            <th className="hidden md:table-cell">Email</th>
            <th className="w-28">Action</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id}>
              <td>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    getDeptColor(emp.department)
                  )}>
                    {getInitials(emp.full_name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">{emp.full_name}</p>
                    <p className="text-xs text-slate-400 font-mono">{emp.employee_id}</p>
                  </div>
                </div>
              </td>
              <td className="hidden sm:table-cell">
                <span className={cn("dept-pill", getDeptColor(emp.department))}>
                  {emp.department}
                </span>
              </td>
              <td className="hidden md:table-cell text-slate-500 text-sm">
                {emp.email}
              </td>
              <td>
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => onMark(emp)}
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd"/>
                  </svg>
                  Mark
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function Attendance() {
  const [searchParams] = useSearchParams();

  const [page, setPage]                   = useState(1);
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [dateFrom, setDateFrom]           = useState(searchParams.get("date") || "");
  const [dateTo, setDateTo]               = useState(searchParams.get("date") || "");
  const [statusFilter, setStatusFilter]   = useState(searchParams.get("status") || "");
  const [showMarkModal, setShowMarkModal] = useState(false);

  // When "Not Marked" is selected we prefill today if no date is set
  const [markPrefillEmployee, setMarkPrefillEmployee] = useState(null);
  const [markPrefillDate, setMarkPrefillDate]         = useState(null);

  const isNotMarkedMode = statusFilter === "Not Marked";

  // Date used for the not-marked query — falls back to today
  const notMarkedDate = dateFrom || todayISO();

  function handleFilterChange(setter) {
    return (e) => {
      setter(e.target.value);
      setPage(1);
    };
  }

  function handleStatusChange(e) {
    const val = e.target.value;
    setStatusFilter(val);
    setPage(1);
    // Auto-set date to today when switching to Not Marked so the query is
    // immediately useful without requiring the user to pick a date manually
    if (val === "Not Marked" && !dateFrom) {
      setDateFrom(todayISO());
      setDateTo(todayISO());
    }
  }

  function clearFilters() {
    setEmployeeFilter("");
    setDateFrom("");
    setDateTo("");
    setStatusFilter("");
    setPage(1);
  }

  function handleMarkFromNotMarked(employee) {
    setMarkPrefillEmployee(employee.id);
    setMarkPrefillDate(notMarkedDate);
    setShowMarkModal(true);
  }

  function handleMarkModalClose() {
    setMarkPrefillEmployee(null);
    setMarkPrefillDate(null);
    setShowMarkModal(false);
  }

  const hasActiveFilters = !!(employeeFilter || dateFrom || dateTo || statusFilter);

  // ── Attendance query (Present / Absent / All) ──────────────────────────
  const attendanceParams = {
    page,
    page_size: PAGE_SIZE,
    ...(employeeFilter          && { employee:  employeeFilter }),
    ...(dateFrom                && { date_from: dateFrom       }),
    ...(dateTo                  && { date_to:   dateTo         }),
    ...(statusFilter &&
        statusFilter !== "Not Marked" && { status: statusFilter }),
  };

  const attendanceQuery = useAttendance(attendanceParams);

  // ── Not-marked query ───────────────────────────────────────────────────
  const notMarkedQuery = useNotMarkedEmployees(
    isNotMarkedMode
      ? { date: notMarkedDate, page, page_size: PAGE_SIZE }
      : {}
  );

  // Pick active query
  const activeQuery = isNotMarkedMode ? notMarkedQuery : attendanceQuery;
  const { data, isLoading, isError, refetch } = activeQuery;

  const records    = !isNotMarkedMode ? (data?.results ?? []) : [];
  const nmEmployees = isNotMarkedMode  ? (data?.results ?? []) : [];
  const pagination = data?.pagination;

  // Employee dropdown
  const { data: employeesData } = useEmployees({ page_size: 200 });
  const employees = employeesData?.results ?? [];
  const employeeOptions = [
    { value: "", label: "All employees" },
    ...employees.map((e) => ({
      value: e.id,
      label: `${e.employee_id} — ${e.full_name}`,
    })),
  ];

  return (
    <div className="space-y-5 max-w-6xl mx-auto animate-slide-up">

      {/* ── Toolbar ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">

          {/* Employee filter — hidden in not-marked mode (irrelevant) */}
          {!isNotMarkedMode && (
            <div className="w-56">
              <Select
                name="employee_filter"
                options={employeeOptions}
                value={employeeFilter}
                onChange={handleFilterChange(setEmployeeFilter)}
                placeholder={undefined}
              />
            </div>
          )}

          {/* Date range */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              max={dateTo || todayISO()}
              onChange={handleFilterChange(setDateFrom)}
              className="h-9 rounded-lg border border-surface-border bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 hover:border-slate-300 transition-shadow"
              title="From date"
            />
            {!isNotMarkedMode && (
              <>
                <span className="text-slate-400 text-xs">to</span>
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom}
                  max={todayISO()}
                  onChange={handleFilterChange(setDateTo)}
                  className="h-9 rounded-lg border border-surface-border bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 hover:border-slate-300 transition-shadow"
                  title="To date"
                />
              </>
            )}
          </div>

          {/* Status filter — includes Not Marked */}
          <div className="w-36">
            <Select
              name="status_filter"
              options={STATUS_FILTER_OPTIONS}
              value={statusFilter}
              onChange={handleStatusChange}
              placeholder={undefined}
            />
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 font-medium transition-colors"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
              </svg>
              Clear filters
            </button>
          )}
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowMarkModal(true)}
          className="shrink-0"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd"/>
          </svg>
          Mark Attendance
        </Button>
      </div>

      {/* ── Context banner for Not Marked mode ───────────────────────────── */}
      {isNotMarkedMode && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <svg className="h-4 w-4 shrink-0 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd"/>
          </svg>
          <p className="text-sm text-amber-800">
            Employees with <span className="font-semibold">no attendance marked</span>{" "}
            for <span className="font-semibold">{formatDate(notMarkedDate)}</span>.
            Click <span className="font-semibold">Mark</span> on any row to record their attendance.
          </p>
        </div>
      )}

      {/* ── Summary line ─────────────────────────────────────────────────── */}
      {!isLoading && !isError && (
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-xs text-slate-400">
            {pagination?.count ?? (isNotMarkedMode ? nmEmployees.length : records.length)}{" "}
            {isNotMarkedMode
              ? "employee(s) not yet marked"
              : `record${(pagination?.count ?? records.length) !== 1 ? "s" : ""}`}
            {hasActiveFilters && !isNotMarkedMode && " matching filters"}
          </p>
          {!isNotMarkedMode && (
            <button
              onClick={() => {
                const t = todayISO();
                setDateFrom(t);
                setDateTo(t);
                setPage(1);
              }}
              className="text-xs text-brand-600 hover:text-brand-700 font-medium"
            >
              Show today only
            </button>
          )}
        </div>
      )}

      {/* ── Table card ───────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-surface-border bg-white shadow-card overflow-hidden">
        {isNotMarkedMode ? (
          <NotMarkedTable
            employees={nmEmployees}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
            onMark={handleMarkFromNotMarked}
          />
        ) : (
          <AttendanceTable
            records={records}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
          />
        )}
      </div>

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      {pagination && pagination.total_pages > 1 && (
        <Pagination pagination={pagination} onPageChange={setPage} />
      )}

      {/* ── Mark modal ───────────────────────────────────────────────────── */}
      <MarkAttendanceModal
        open={showMarkModal}
        onClose={handleMarkModalClose}
        prefillEmployee={markPrefillEmployee}
        prefillDate={markPrefillDate}
      />
    </div>
  );
}