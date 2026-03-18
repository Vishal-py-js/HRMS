import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEmployee } from "@/hooks/useEmployees";
import { useAttendance } from "@/hooks/useAttendance";
import { useDeleteEmployee } from "@/hooks/useEmployees";
import AttendanceTable from "@/components/attendance/AttendanceTable";
import MarkAttendanceModal from "@/components/attendance/MarkAttendanceModal";
import Pagination from "@/components/ui/Pagination";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { StatCardSkeleton, ErrorState, Spinner } from "@/components/ui/States";
import { formatDate, getDeptColor, getInitials, cn, todayISO } from "@/lib/utils";
import { useAttendanceSummary } from "@/hooks/useAttendance";

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: "",        label: "All statuses" },
  { value: "Present", label: "Present"      },
  { value: "Absent",  label: "Absent"       },
];

// ── Summary stat card ─────────────────────────────────────────────────────
function MiniStat({ label, value, color }) {
  const colors = {
    blue:  "bg-brand-50 text-brand-700",
    green: "bg-green-50 text-green-700",
    red:   "bg-red-50 text-red-600",
  };
  return (
    <div className="rounded-xl border border-surface-border bg-white p-4 shadow-card">
      <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">{label}</p>
      <p className={cn(
        "mt-1.5 text-2xl font-display font-700 leading-none rounded-lg px-1 inline-block",
        colors[color]
      )}>
        {value ?? "—"}
      </p>
    </div>
  );
}

// ── Employee profile header ───────────────────────────────────────────────
function EmployeeHeader({ employee, onDelete, onMarkAttendance }) {
  return (
    <div className="rounded-2xl border border-surface-border bg-white p-6 shadow-card animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Avatar */}
        <div className={cn(
          "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-display font-700 select-none",
          getDeptColor(employee.department)
        )}>
          {getInitials(employee.full_name)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-display font-700 text-slate-900">
              {employee.full_name}
            </h2>
            <span className={cn("dept-pill", getDeptColor(employee.department))}>
              {employee.department}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="font-mono text-xs bg-surface-subtle px-2 py-0.5 rounded">
              {employee.employee_id}
            </span>
            <span>{employee.email}</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Joined {formatDate(employee.created_at)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={onMarkAttendance}
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd"/>
            </svg>
            Mark Attendance
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="text-red-600 hover:bg-red-50 hover:border-red-200"
            onClick={onDelete}
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd"/>
            </svg>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [page, setPage]             = useState(1);
  const [dateFrom, setDateFrom]     = useState("");
  const [dateTo, setDateTo]         = useState("");
  const [statusFilter, setStatus]   = useState("");
  const [showMarkModal, setMark]    = useState(false);
  const [showDelete, setDelete]     = useState(false);

  function handleFilterChange(setter) {
    return (e) => { setter(e.target.value); setPage(1); };
  }

  function clearFilters() {
    setDateFrom(""); setDateTo(""); setStatus(""); setPage(1);
  }

  const hasFilters = !!(dateFrom || dateTo || statusFilter);

  // ── Data fetching ────────────────────────────────────────────────────
  const {
    data: employee,
    isLoading: empLoading,
    isError: empError,
  } = useEmployee(id);

  const attendanceParams = {
    employee: id,
    page,
    page_size: PAGE_SIZE,
    ...(dateFrom      && { date_from: dateFrom   }),
    ...(dateTo        && { date_to:   dateTo      }),
    ...(statusFilter  && { status:    statusFilter }),
  };

  const {
    data: attData,
    isLoading: attLoading,
    isError: attError,
    refetch: attRefetch,
  } = useAttendance(attendanceParams);

  const deleteEmployee = useDeleteEmployee();

  const records    = attData?.results    ?? [];
  const pagination = attData?.pagination;

  const {
    data: summary,
    isLoading: summaryLoading,
  } = useAttendanceSummary(id);

    const totalPresent = summary?.total_present ?? 0;
    const totalAbsent  = summary?.total_absent  ?? 0;
    const totalRecords = summary?.total_records ?? 0;

  async function handleDelete() {
    await deleteEmployee.mutateAsync(id);
    navigate("/employees");
  }

  // ── Loading state ────────────────────────────────────────────────────
  if (empLoading) {
    return (
      <div className="space-y-5 max-w-5xl mx-auto">
        <div className="skeleton h-32 rounded-2xl" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  if (empError || !employee) {
    return (
      <ErrorState
        message="Employee not found."
        onRetry={() => navigate("/employees")}
      />
    );
  }

  return (
    <div className="space-y-5 max-w-5xl mx-auto animate-slide-up">

      {/* Back link */}
      <button
        onClick={() => navigate("/employees")}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd"/>
        </svg>
        Back to Employees
      </button>

      {/* Employee profile card */}
      <EmployeeHeader
        employee={employee}
        onDelete={() => setDelete(true)}
        onMarkAttendance={() => setMark(true)}
      />

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        {summaryLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-surface-border bg-white p-4 shadow-card">
                <div className="skeleton h-3 w-20 rounded mb-3" />
                <div className="skeleton h-7 w-10 rounded" />
            </div>
            ))
        ) : (
            <>
            <MiniStat label="Total Records" value={totalRecords} color="blue"  />
            <MiniStat label="Days Present"  value={totalPresent} color="green" />
            <MiniStat label="Days Absent"   value={totalAbsent}  color="red"   />
            </>
        )}
      </div>

      {/* Attendance history */}
      <div className="rounded-2xl border border-surface-border bg-white shadow-card overflow-hidden">

        {/* Table header with filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b border-surface-border">
          <h3 className="text-sm font-semibold text-slate-700">
            Attendance History
            {pagination?.count !== undefined && (
              <span className="ml-2 text-xs font-normal text-slate-400">
                {pagination.count} record{pagination.count !== 1 ? "s" : ""}
              </span>
            )}
          </h3>

          <div className="flex flex-wrap items-center gap-2">
            {/* Date from */}
            <input
              type="date"
              value={dateFrom}
              max={dateTo || todayISO()}
              onChange={handleFilterChange(setDateFrom)}
              className="h-8 rounded-lg border border-surface-border bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 hover:border-slate-300 transition-shadow"
              title="From date"
            />
            <span className="text-slate-300 text-xs">–</span>
            {/* Date to */}
            <input
              type="date"
              value={dateTo}
              min={dateFrom}
              max={todayISO()}
              onChange={handleFilterChange(setDateTo)}
              className="h-8 rounded-lg border border-surface-border bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 hover:border-slate-300 transition-shadow"
              title="To date"
            />
            {/* Status */}
            <div className="w-32">
              <Select
                name="status_filter"
                options={STATUS_OPTIONS}
                value={statusFilter}
                onChange={handleFilterChange(setStatus)}
                placeholder={undefined}
                className="h-8 text-xs"
              />
            </div>
            {/* Clear */}
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
                </svg>
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <AttendanceTable
          records={records}
          isLoading={attLoading}
          isError={attError}
          onRetry={attRefetch}
        />
      </div>

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <Pagination pagination={pagination} onPageChange={setPage} />
      )}

      {/* Mark attendance modal — pre-filled for this employee */}
      <MarkAttendanceModal
        open={showMarkModal}
        onClose={() => setMark(false)}
        prefillEmployee={id}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={showDelete}
        onClose={() => setDelete(false)}
        onConfirm={handleDelete}
        loading={deleteEmployee.isPending}
        title="Delete employee"
        description={`Are you sure you want to delete ${employee.full_name}? All their attendance records will also be permanently removed.`}
      />
    </div>
  );
}