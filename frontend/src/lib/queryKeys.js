/**
 * Centralized React Query key factory.
 *
 * Using a factory pattern means:
 * - Keys are consistent across all hooks and components
 * - Partial invalidation is easy: invalidate(['employees'] wipes all employee queries
 * - No magic strings scattered across the codebase
 */
export const queryKeys = {
  // Employees
  employees: {
    all: () => ["employees"],
    lists: () => ["employees", "list"],
    list: (params) => ["employees", "list", params],
    details: () => ["employees", "detail"],
    detail: (id) => ["employees", "detail", id],
    departments: () => ["employees", "departments"],
    dashboardStats: () => ["employees", "dashboard-stats"],
  },

  // Attendance
  attendance: {
    all: () => ["attendance"],
    lists: () => ["attendance", "list"],
    list: (params) => ["attendance", "list", params],
    detail: (id) => ["attendance", "detail", id],
    summary: (employeeId) => ["attendance", "summary", employeeId],
  },
};
