import apiClient from "./apiClient";

/**
 * All employee-related API calls in one place.
 * Keeping API calls separate from components and hooks makes
 * them easy to test and swap out without touching UI code.
 */

export const employeeService = {
  /**
   * Fetch a paginated, filtered list of employees.
   * @param {Object} params - { page, page_size, search, department }
   */
  getAll: (params = {}) =>
    apiClient.get("/employees/", { params }).then((r) => r.data),

  /**
   * Fetch a single employee by UUID.
   * @param {string} id
   */
  getById: (id) =>
    apiClient.get(`/employees/${id}/`).then((r) => r.data),

  /**
   * Create a new employee.
   * @param {Object} payload - { employee_id, full_name, email, department }
   */
  create: (payload) =>
    apiClient.post("/employees/", payload).then((r) => r.data),

  /**
   * Delete an employee by UUID.
   * @param {string} id
   */
  delete: (id) =>
    apiClient.delete(`/employees/${id}/`).then((r) => r.data),

  /**
   * Fetch available department choices.
   */
  getDepartments: () =>
    apiClient.get("/employees/departments/").then((r) => r.data),

  /**
   * Fetch aggregated dashboard statistics.
   */
  getDashboardStats: () =>
    apiClient.get("/employees/dashboard-stats/").then((r) => r.data),

  /**
   * Fetch employees with no attendance record for a given date.
   * @param {string} date - YYYY-MM-DD
   */
  getNotMarked: (params = {}) =>
    apiClient.get("/employees/not-marked/", { params }).then((r) => r.data),
};
