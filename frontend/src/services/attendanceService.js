import apiClient from "./apiClient";

export const attendanceService = {
  /**
   * Fetch paginated attendance records.
   * @param {Object} params - { employee, date, date_from, date_to, status, page, page_size }
   */
  getAll: (params = {}) =>
    apiClient.get("/attendance/", { params }).then((r) => r.data),

  /**
   * Fetch a single attendance record.
   */
  getById: (id) =>
    apiClient.get(`/attendance/${id}/`).then((r) => r.data),

  /**
   * Mark or create an attendance record.
   * @param {Object} payload - { employee, date, status, notes? }
   */
  create: (payload) =>
    apiClient.post("/attendance/", payload).then((r) => r.data),

  /**
   * Update an existing attendance record.
   * @param {string} id
   * @param {Object} payload
   */
  update: (id, payload) =>
    apiClient.patch(`/attendance/${id}/`, payload).then((r) => r.data),

  /**
   * Delete an attendance record.
   */
  delete: (id) =>
    apiClient.delete(`/attendance/${id}/`).then((r) => r.data),

  /**
   * Bulk mark attendance for multiple employees on one date.
   * @param {Object} payload - { date, records: [{ employee, status, notes? }] }
   */
  bulkCreate: (payload) =>
    apiClient.post("/attendance/bulk/", payload).then((r) => r.data),

  /**
   * Get attendance summary (present/absent counts) for one employee.
   */
  getSummary: (employeeId) =>
    apiClient
      .get("/attendance/summary/", { params: { employee: employeeId } })
      .then((r) => r.data),
};
