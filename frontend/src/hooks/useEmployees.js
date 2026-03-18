// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import toast from "react-hot-toast";
// import { employeeService } from "@/services/employeeService";
// import { queryKeys } from "@/lib/queryKeys";
// import { getErrorMessage } from "@/lib/utils";

// // ── Queries ────────────────────────────────────────────────────────────────

// export function useEmployees(params = {}) {
//   return useQuery({
//     queryKey: queryKeys.employees.list(params),
//     queryFn: () => employeeService.getAll(params),
//     staleTime: 0,              // ← always consider data stale so refetch fires immediately
//     placeholderData: (prev) => prev,
//   });
// }

// export function useEmployee(id) {
//   return useQuery({
//     queryKey: queryKeys.employees.detail(id),
//     queryFn: () => employeeService.getById(id),
//     enabled: !!id,
//     staleTime: 0,
//   });
// }

// export function useDepartments() {
//   return useQuery({
//     queryKey: queryKeys.employees.departments(),
//     queryFn: employeeService.getDepartments,
//     staleTime: Infinity,
//     gcTime: Infinity,
//   });
// }

// export function useDashboardStats() {
//   return useQuery({
//     queryKey: queryKeys.employees.dashboardStats(),
//     queryFn: employeeService.getDashboardStats,
//     staleTime: 0,
//     refetchInterval: 120_000,
//   });
// }

// // ── Mutations ──────────────────────────────────────────────────────────────

// export function useCreateEmployee() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: employeeService.create,
//     onSuccess: (data) => {
//       // Remove cached data entirely and force fresh fetch
//       queryClient.removeQueries({ queryKey: queryKeys.employees.lists() });
//       queryClient.removeQueries({ queryKey: queryKeys.employees.dashboardStats() });
//       toast.success(`${data.full_name} added successfully.`);
//     },
//     onError: (error) => {
//       toast.error(getErrorMessage(error));
//     },
//   });
// }

// export function useDeleteEmployee() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: employeeService.delete,
//     onSuccess: (data) => {
//       queryClient.removeQueries({ queryKey: queryKeys.employees.all() });
//       queryClient.removeQueries({ queryKey: queryKeys.attendance.all() });
//       toast.success(data.message || "Employee deleted.");
//     },
//     onError: (error) => {
//       toast.error(getErrorMessage(error));
//     },
//   });
// }











import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { employeeService } from "@/services/employeeService";
import { queryKeys } from "@/lib/queryKeys";
import { getErrorMessage } from "@/lib/utils";

// ── Queries ────────────────────────────────────────────────────────────────

export function useEmployees(params = {}) {
  return useQuery({
    queryKey: queryKeys.employees.list(params),
    queryFn: () => employeeService.getAll(params),
    staleTime: 0,
    placeholderData: (prev) => prev,
  });
}

export function useEmployee(id) {
  return useQuery({
    queryKey: queryKeys.employees.detail(id),
    queryFn: () => employeeService.getById(id),
    enabled: !!id,
    staleTime: 0,
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: queryKeys.employees.departments(),
    queryFn: employeeService.getDepartments,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.employees.dashboardStats(),
    queryFn: employeeService.getDashboardStats,
    staleTime: 0,
    refetchInterval: 120_000,
  });
}

// ── Shared invalidation helper ─────────────────────────────────────────────
// resetQueries = wipe cached data + immediately refetch all active queries.
// This is the only reliable way to force UI to show fresh data after a mutation.

function invalidateAll(queryClient) {
  return Promise.all([
    queryClient.resetQueries({ queryKey: queryKeys.employees.lists() }),
    queryClient.resetQueries({ queryKey: queryKeys.employees.dashboardStats() }),
    queryClient.resetQueries({ queryKey: queryKeys.attendance.lists() }),
  ]);
}

// ── Mutations ──────────────────────────────────────────────────────────────

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: employeeService.create,
    onSuccess: async (data) => {
      await invalidateAll(queryClient);
      toast.success(`${data.full_name} added successfully.`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: employeeService.delete,
    onSuccess: async (data) => {
      // Reset everything — employee gone means attendance records gone too
      await queryClient.resetQueries({ queryKey: queryKeys.employees.all() });
      await queryClient.resetQueries({ queryKey: queryKeys.attendance.all() });
      toast.success(data.message || "Employee deleted.");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useNotMarkedEmployees(params = {}) {
  return useQuery({
    queryKey: queryKeys.employees.list({ ...params, type: "not-marked" }),
    queryFn: () => employeeService.getNotMarked(params),
    enabled: !!params.date,   // only fetch when date is provided
    staleTime: 0,
    placeholderData: (prev) => prev,
  });
}