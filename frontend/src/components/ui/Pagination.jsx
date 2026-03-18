import { cn } from "@/lib/utils";
import Button from "./Button";

/**
 * Controlled pagination component.
 * Works with the StandardResultsPagination envelope from the backend.
 */
export default function Pagination({ pagination, onPageChange, className }) {
  if (!pagination || pagination.total_pages <= 1) return null;

  const { current_page, total_pages, count, page_size } = pagination;
  const from = (current_page - 1) * page_size + 1;
  const to = Math.min(current_page * page_size, count);

  // Build page number range with ellipsis
  const getPages = () => {
    const delta = 1; // Pages to show around current
    const pages = [];
    const left = Math.max(2, current_page - delta);
    const right = Math.min(total_pages - 1, current_page + delta);

    pages.push(1);
    if (left > 2) pages.push("...");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < total_pages - 1) pages.push("...");
    if (total_pages > 1) pages.push(total_pages);

    return pages;
  };

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-3 px-1",
        className
      )}
    >
      <p className="text-sm text-slate-500 shrink-0">
        Showing{" "}
        <span className="font-medium text-slate-700">{from}–{to}</span>
        {" "}of{" "}
        <span className="font-medium text-slate-700">{count}</span>
        {" "}results
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(current_page - 1)}
          disabled={current_page === 1}
          aria-label="Previous page"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd"/>
          </svg>
          Prev
        </Button>

        <div className="flex items-center gap-1">
          {getPages().map((page, i) =>
            page === "..." ? (
              <span key={`ellipsis-${i}`} className="px-2 text-slate-400 text-sm select-none">
                …
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={cn(
                  "h-8 w-8 rounded-lg text-sm font-medium transition-colors",
                  page === current_page
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-surface-subtle"
                )}
                aria-current={page === current_page ? "page" : undefined}
              >
                {page}
              </button>
            )
          )}
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(current_page + 1)}
          disabled={current_page === total_pages}
          aria-label="Next page"
        >
          Next
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd"/>
          </svg>
        </Button>
      </div>
    </div>
  );
}
