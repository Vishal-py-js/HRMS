// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import toast from "react-hot-toast";
// import { attendanceService } from "@/services/attendanceService";
// import { queryKeys } from "@/lib/queryKeys";
// import { getErrorMessage } from "@/lib/utils";

// // ── Queries ────────────────────────────────────────────────────────────────

// export function useAttendance(params = {}) {
//   return useQuery({
//     queryKey: queryKeys.attendance.list(params),
//     queryFn: () => attendanceService.getAll(params),
//     staleTime: 0,              // ← always refetch fresh
//     placeholderData: (prev) => prev,
//   });
// }

// export function useAttendanceSummary(employeeId) {
//   return useQuery({
//     queryKey: queryKeys.attendance.summary(employeeId),
//     queryFn: () => attendanceService.getSummary(employeeId),
//     enabled: !!employeeId,
//     staleTime: 0,
//   });
// }

// // ── Mutations ──────────────────────────────────────────────────────────────

// export function useMarkAttendance() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: attendanceService.create,
//     onSuccess: () => {
//       queryClient.removeQueries({ queryKey: queryKeys.attendance.lists() });
//       queryClient.removeQueries({ queryKey: queryKeys.employees.lists() });
//       queryClient.removeQueries({ queryKey: queryKeys.employees.dashboardStats() });
//       toast.success("Attendance marked successfully.");
//     },
//     onError: (error) => {
//       toast.error(getErrorMessage(error));
//     },
//   });
// }

// export function useUpdateAttendance() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: ({ id, payload }) => attendanceService.update(id, payload),
//     onSuccess: () => {
//       queryClient.removeQueries({ queryKey: queryKeys.attendance.lists() });
//       queryClient.removeQueries({ queryKey: queryKeys.employees.lists() });
//       queryClient.removeQueries({ queryKey: queryKeys.employees.dashboardStats() });
//       toast.success("Attendance updated.");
//     },
//     onError: (error) => {
//       toast.error(getErrorMessage(error));
//     },
//   });
// }

// export function useDeleteAttendance() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: attendanceService.delete,
//     onSuccess: () => {
//       queryClient.removeQueries({ queryKey: queryKeys.attendance.all() });
//       queryClient.removeQueries({ queryKey: queryKeys.employees.lists() });
//       queryClient.removeQueries({ queryKey: queryKeys.employees.dashboardStats() });
//       toast.success("Attendance record deleted.");
//     },
//     onError: (error) => {
//       toast.error(getErrorMessage(error));
//     },
//   });
// }

// export function useBulkAttendance() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: attendanceService.bulkCreate,
//     onSuccess: (data) => {
//       queryClient.removeQueries({ queryKey: queryKeys.attendance.all() });
//       queryClient.removeQueries({ queryKey: queryKeys.employees.all() });
//       toast.success(data.message || "Bulk attendance saved.");
//     },
//     onError: (error) => {
//       toast.error(getErrorMessage(error));
//     },
//   });
// }










import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { attendanceService } from "@/services/attendanceService";
import { queryKeys } from "@/lib/queryKeys";
import { getErrorMessage } from "@/lib/utils";

// ── Queries ────────────────────────────────────────────────────────────────

export function useAttendance(params = {}) {
  return useQuery({
    queryKey: queryKeys.attendance.list(params),
    queryFn: () => attendanceService.getAll(params),
    staleTime: 0,
    placeholderData: (prev) => prev,
  });
}

export function useAttendanceSummary(employeeId) {
  return useQuery({
    queryKey: queryKeys.attendance.summary(employeeId),
    queryFn: () => attendanceService.getSummary(employeeId),
    enabled: !!employeeId,
    staleTime: 0,
  });
}

// ── Shared invalidation helper ─────────────────────────────────────────────

function invalidateAll(queryClient) {
  return Promise.all([
    queryClient.resetQueries({ queryKey: queryKeys.attendance.lists() }),
    queryClient.resetQueries({ queryKey: queryKeys.employees.lists() }),
    queryClient.resetQueries({ queryKey: queryKeys.employees.dashboardStats() }),
  ]);
}

// ── Mutations ──────────────────────────────────────────────────────────────

export function useMarkAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: attendanceService.create,
    onSuccess: async () => {
      await invalidateAll(queryClient);
      toast.success("Attendance marked successfully.");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdateAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => attendanceService.update(id, payload),
    onSuccess: async () => {
      await invalidateAll(queryClient);
      toast.success("Attendance updated.");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useDeleteAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: attendanceService.delete,
    onSuccess: async () => {
      await invalidateAll(queryClient);
      toast.success("Attendance record deleted.");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useBulkAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: attendanceService.bulkCreate,
    onSuccess: async (data) => {
      await queryClient.resetQueries({ queryKey: queryKeys.attendance.all() });
      await queryClient.resetQueries({ queryKey: queryKeys.employees.all() });
      toast.success(data.message || "Bulk attendance saved.");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}