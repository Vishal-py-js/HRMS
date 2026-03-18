import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useEmployees, useNotMarkedEmployees, useDepartments } from "@/hooks/useEmployees";
import { useDebounce } from "@/hooks/useDebounce";
import EmployeeTable from "@/components/employees/EmployeeTable";
import AddEmployeeModal from "@/components/employees/AddEmployeeModal";
import Pagination from "@/components/ui/Pagination";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { formatDate } from "@/lib/utils";

const PAGE_SIZE = 20;

export default function Employees() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // If ?not_marked=YYYY-MM-DD is present, we are in drill-down mode
  const notMarkedDate = searchParams.get("not_marked");
  const isNotMarkedMode = !!notMarkedDate;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const debouncedSearch = useDebounce(search, 350);

  function handleSearch(e) {
    setSearch(e.target.value);
    setPage(1);
  }

  function handleDepartment(e) {
    setDepartment(e.target.value);
    setPage(1);
  }

  function clearNotMarkedMode() {
    navigate("/employees");
  }

  // ── Normal mode query ────────────────────────────────────────────────────
  const normalParams = {
    page,
    page_size: PAGE_SIZE,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(department && { department }),
  };

  const normalQuery = useEmployees(normalParams);

  // ── Not-marked drill-down query ──────────────────────────────────────────
  const notMarkedQuery = useNotMarkedEmployees(
    isNotMarkedMode ? { date: notMarkedDate, page, page_size: PAGE_SIZE } : {}
  );

  // Pick which query to use based on mode
  const { data, isLoading, isError, refetch } = isNotMarkedMode
    ? notMarkedQuery
    : normalQuery;

  const employees = data?.results ?? [];
  const pagination = data?.pagination;

  const { data: departments = [] } = useDepartments();
  const deptOptions = [
    { value: "", label: "All departments" },
    ...departments.map((d) => ({ value: d.value, label: d.label })),
  ];

  return (
    <div className="space-y-5 max-w-6xl mx-auto animate-slide-up">

      {/* ── Not-marked drill-down banner ─────────────────────────────────── */}
      {isNotMarkedMode && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <svg
              className="h-4 w-4 shrink-0 text-amber-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-amber-800">
              Showing employees with{" "}
              <span className="font-semibold">no attendance marked</span> for{" "}
              <span className="font-semibold">{formatDate(notMarkedDate)}</span>
            </p>
          </div>
          <button
            onClick={clearNotMarkedMode}
            className="shrink-0 text-xs font-medium text-amber-700 hover:text-amber-900 underline underline-offset-2"
          >
            Clear filter
          </button>
        </div>
      )}

      {/* ── Toolbar — hidden in not-marked mode ──────────────────────────── */}
      {!isNotMarkedMode && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3 max-w-xl">
            {/* Search */}
            <div className="relative flex-1">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                type="search"
                placeholder="Search by name, email or ID…"
                value={search}
                onChange={handleSearch}
                className="h-9 w-full rounded-lg border border-surface-border bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 hover:border-slate-300 transition-shadow"
              />
            </div>

            {/* Department filter */}
            <div className="w-44 shrink-0">
              <Select
                name="department_filter"
                options={deptOptions}
                value={department}
                onChange={handleDepartment}
                placeholder={undefined}
              />
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="shrink-0"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            Add Employee
          </Button>
        </div>
      )}

      {/* ── Summary line ─────────────────────────────────────────────────── */}
      {!isLoading && !isError && (
        <p className="text-xs text-slate-400">
          {pagination?.count ?? employees.length}{" "}
          {isNotMarkedMode ? "employee(s) not yet marked" : `employee${pagination?.count !== 1 ? "s" : ""}`}
          {!isNotMarkedMode && debouncedSearch && ` matching "${debouncedSearch}"`}
          {!isNotMarkedMode && department && ` in ${department}`}
        </p>
      )}

      {/* ── Table card ───────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-surface-border bg-white shadow-card overflow-hidden">
        <EmployeeTable
          employees={employees}
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
        />
      </div>

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      {pagination && pagination.total_pages > 1 && (
        <Pagination
          pagination={pagination}
          onPageChange={setPage}
        />
      )}

      {/* ── Add modal ────────────────────────────────────────────────────── */}
      <AddEmployeeModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </div>
  );
}