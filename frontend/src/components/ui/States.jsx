import { cn } from "@/lib/utils";
import Button from "./Button";

// ── Empty State ───────────────────────────────────────────────────────────

export function EmptyState({ icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-subtle text-slate-400">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-slate-400 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ── Error State ───────────────────────────────────────────────────────────

export function ErrorState({ message, onRetry, className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center",
        className
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-400">
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-slate-700">Something went wrong</h3>
      <p className="mt-1 text-sm text-slate-400 max-w-xs">
        {message || "Failed to load data. Please try again."}
      </p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

// ── Table Skeleton ────────────────────────────────────────────────────────

export function TableSkeleton({ rows = 8, cols = 5 }) {
  return (
    <div className="w-full">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 px-4 py-3.5 border-b border-surface-border/60"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          {/* Avatar */}
          <div className="skeleton h-8 w-8 rounded-full shrink-0" />
          {Array.from({ length: cols - 1 }).map((_, j) => (
            <div
              key={j}
              className="skeleton h-4 rounded"
              style={{ width: `${60 + ((i + j) % 3) * 20}px`, flex: j === 0 ? "1" : "none" }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Stat Card Skeleton ────────────────────────────────────────────────────

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-card">
      <div className="skeleton h-3 w-20 rounded mb-3" />
      <div className="skeleton h-7 w-14 rounded mb-1" />
      <div className="skeleton h-3 w-24 rounded" />
    </div>
  );
}

// ── Inline Spinner ────────────────────────────────────────────────────────

export function Spinner({ className, size = "md" }) {
  const s = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-6 w-6" }[size];
  return (
    <svg
      className={cn("animate-spin text-brand-500", s, className)}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
