import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely, resolving conflicts. */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Extract a human-readable error message from the normalized
 * error object produced by our Axios interceptor.
 */
export function getErrorMessage(error) {
  if (!error) return "An unexpected error occurred.";
  if (typeof error === "string") return error;
  if (error.message) return error.message;
  return "An unexpected error occurred.";
}

/**
 * Format a date string (YYYY-MM-DD) to a readable format.
 * @param {string} dateStr
 * @param {Object} options - Intl.DateTimeFormat options
 */
// export function formatDate(dateStr, options = {}) {
//   if (!dateStr) return "—";
//   const date = new Date(dateStr + "T00:00:00");
//   return date.toLocaleDateString("en-IN", {
//     day: "numeric",
//     month: "short",
//     year: "numeric",
//     ...options,
//   });
// }
export function formatDate(dateStr, options = {}) {
  if (!dateStr) return "—";

  // Append time only if input is a plain date (no "T" or time info)
  const normalized = dateStr.includes("T") ? dateStr : dateStr + "T00:00:00";
  const date = new Date(normalized);

  if (isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  });
}

/** Return today's date as YYYY-MM-DD string. */
export function todayISO() {
  return new Date().toISOString().split("T")[0];
}

/**
 * Generate initials from a full name (up to 2 characters).
 * "John Doe" → "JD", "Alice" → "A"
 */
export function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Map department name to a consistent Tailwind background color class.
 * Used for avatar backgrounds and department badges.
 */
const DEPT_COLORS = {
  Engineering: "bg-violet-100 text-violet-700",
  Product: "bg-blue-100 text-blue-700",
  Design: "bg-pink-100 text-pink-700",
  Marketing: "bg-orange-100 text-orange-700",
  Sales: "bg-emerald-100 text-emerald-700",
  Finance: "bg-yellow-100 text-yellow-700",
  HR: "bg-rose-100 text-rose-700",
  Operations: "bg-cyan-100 text-cyan-700",
  Legal: "bg-slate-100 text-slate-700",
  "Customer Success": "bg-teal-100 text-teal-700",
};

export function getDeptColor(department) {
  return DEPT_COLORS[department] ?? "bg-slate-100 text-slate-600";
}

/** Debounce a function call. */
export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
