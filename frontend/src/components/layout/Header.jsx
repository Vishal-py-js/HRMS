import { useLocation } from "react-router-dom";

const PAGE_TITLES = {
  "/": { title: "Dashboard", description: "Overview of your workforce" },
  "/employees": { title: "Employees", description: "Manage employee records" },
  "/attendance": { title: "Attendance", description: "Track daily attendance" },
};

export default function Header() {
  const { pathname } = useLocation();

  // Match exact or prefix (e.g. /employees/123)
  const base = "/" + pathname.split("/")[1];
  const meta = PAGE_TITLES[base] || PAGE_TITLES["/"];

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-surface-border bg-white px-6">
      <div>
        <h1 className="text-sm font-semibold text-slate-900">{meta.title}</h1>
        <p className="text-xs text-slate-400">{meta.description}</p>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden sm:block text-xs text-slate-400">{today}</span>
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-semibold select-none">
          A
        </div>
      </div>
    </header>
  );
}
