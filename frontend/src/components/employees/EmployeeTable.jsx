import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDate, getInitials, getDeptColor, cn } from "@/lib/utils";
import { useDeleteEmployee } from "@/hooks/useEmployees";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { TableSkeleton, EmptyState, ErrorState } from "@/components/ui/States";

function EmployeeAvatar({ name, department }) {
  return (
    <div className={cn(
      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold select-none",
      getDeptColor(department)
    )}>
      {getInitials(name)}
    </div>
  );
}

function EmployeeRow({ employee, onDelete }) {
  const navigate = useNavigate();

  return (
    <tr
      className="cursor-pointer"
      onClick={() => navigate(`/employees/${employee.id}`)}
    >
      <td>
        <div className="flex items-center gap-3">
          <EmployeeAvatar name={employee.full_name} department={employee.department} />
          <div className="min-w-0">
            <p className="font-medium text-slate-900 truncate">{employee.full_name}</p>
            <p className="text-xs text-slate-400 font-mono truncate">{employee.employee_id}</p>
          </div>
        </div>
      </td>
      <td className="hidden md:table-cell text-slate-600">{employee.email}</td>
      <td>
        <span className={cn("dept-pill", getDeptColor(employee.department))}>
          {employee.department}
        </span>
      </td>
      <td className="hidden sm:table-cell">
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-green-700 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
            {employee.attendance_summary?.total_present ?? 0}d
          </span>
          <span className="flex items-center gap-1 text-red-600 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 inline-block" />
            {employee.attendance_summary?.total_absent ?? 0}d
          </span>
        </div>
      </td>
      <td className="hidden lg:table-cell text-slate-400 text-xs">
        {formatDate(employee.created_at)}
      </td>
      <td>
        <Button
          variant="ghost"
          size="xs"
          className="text-slate-400 hover:text-red-600 hover:bg-red-50"
          onClick={(e) => {
            e.stopPropagation();   // ← prevent row click from firing
            onDelete(employee);
          }}
          aria-label={`Delete ${employee.full_name}`}
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
          </svg>
        </Button>
      </td>
    </tr>
  );
}

export default function EmployeeTable({ employees, isLoading, isError, onRetry }) {
  const [deleteTarget, setDeleteTarget] = useState(null);
  const deleteEmployee = useDeleteEmployee();

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    await deleteEmployee.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  }

  if (isLoading) return <TableSkeleton rows={8} cols={6} />;

  if (isError) {
    return <ErrorState message="Failed to load employees." onRetry={onRetry} />;
  }

  if (!employees?.length) {
    return (
      <EmptyState
        icon={
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
        }
        title="No employees found"
        description="Add your first employee to get started, or try adjusting your filters."
      />
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th className="hidden md:table-cell">Email</th>
              <th>Department</th>
              <th className="hidden sm:table-cell">Attendance</th>
              <th className="hidden lg:table-cell">Joined</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <EmployeeRow
                key={emp.id}
                employee={emp}
                onDelete={setDeleteTarget}
              />
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={deleteEmployee.isPending}
        title="Delete employee"
        description={
          deleteTarget
            ? `Are you sure you want to delete ${deleteTarget.full_name}? All attendance records will also be removed.`
            : undefined
        }
      />
    </>
  );
}