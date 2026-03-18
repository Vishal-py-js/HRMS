import { useState } from "react";
import { formatDate, cn } from "@/lib/utils";
import { useDeleteAttendance } from "@/hooks/useAttendance";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import MarkAttendanceModal from "./MarkAttendanceModal";
import { TableSkeleton, EmptyState, ErrorState } from "@/components/ui/States";

function StatusBadge({ status }) {
  return (
    <span className={status === "Present" ? "badge-present" : "badge-absent"}>
      <span className={cn("h-1.5 w-1.5 rounded-full", status === "Present" ? "bg-green-500" : "bg-red-400")} />
      {status}
    </span>
  );
}

function AttendanceRow({ record, onEdit, onDelete }) {
  return (
    <tr>
      <td>
        <div className="min-w-0">
          <p className="font-medium text-slate-900 truncate">{record.employee_name}</p>
          <p className="text-xs text-slate-400 font-mono">{record.employee_code}</p>
        </div>
      </td>
      <td className="hidden sm:table-cell">
        <span className="dept-pill">{record.employee_department}</span>
      </td>
      <td className="font-medium text-slate-700">{formatDate(record.date)}</td>
      <td><StatusBadge status={record.status} /></td>
      <td className="hidden lg:table-cell text-slate-400 text-xs max-w-[160px] truncate">
        {record.notes || "—"}
      </td>
      <td>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="xs"
            className="text-slate-400 hover:text-brand-600 hover:bg-brand-50"
            onClick={() => onEdit(record)}
            aria-label="Edit"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z"/>
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="xs"
            className="text-slate-400 hover:text-red-600 hover:bg-red-50"
            onClick={() => onDelete(record)}
            aria-label="Delete"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd"/>
            </svg>
          </Button>
        </div>
      </td>
    </tr>
  );
}

export default function AttendanceTable({ records, isLoading, isError, onRetry }) {
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const deleteAttendance = useDeleteAttendance();

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    await deleteAttendance.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  }

  if (isLoading) return <TableSkeleton rows={8} cols={6} />;
  if (isError) return <ErrorState message="Failed to load attendance records." onRetry={onRetry} />;

  if (!records?.length) {
    return (
      <EmptyState
        icon={
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
        }
        title="No attendance records"
        description="Mark attendance for your employees to see records here."
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
              <th className="hidden sm:table-cell">Department</th>
              <th>Date</th>
              <th>Status</th>
              <th className="hidden lg:table-cell">Notes</th>
              <th className="w-20" />
            </tr>
          </thead>
          <tbody>
            {records.map((rec) => (
              <AttendanceRow
                key={rec.id}
                record={rec}
                onEdit={setEditTarget}
                onDelete={setDeleteTarget}
              />
            ))}
          </tbody>
        </table>
      </div>

      {editTarget && (
        <MarkAttendanceModal
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          editRecord={editTarget}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={deleteAttendance.isPending}
        title="Delete attendance record"
        description="This attendance record will be permanently removed."
      />
    </>
  );
}
