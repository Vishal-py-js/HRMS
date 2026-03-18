// import { cn } from "@/lib/utils";

// export default function StatCard({ label, value, sub, icon, color = "blue", trend }) {
//   const colorMap = {
//     blue:   { bg: "bg-brand-50",   icon: "text-brand-600",   ring: "ring-brand-100" },
//     green:  { bg: "bg-green-50",   icon: "text-green-600",   ring: "ring-green-100" },
//     red:    { bg: "bg-red-50",     icon: "text-red-500",     ring: "ring-red-100" },
//     amber:  { bg: "bg-amber-50",   icon: "text-amber-600",   ring: "ring-amber-100" },
//     violet: { bg: "bg-violet-50",  icon: "text-violet-600",  ring: "ring-violet-100" },
//   };
//   const c = colorMap[color] ?? colorMap.blue;

//   return (
//     <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card hover:shadow-card-hover transition-shadow duration-200 animate-fade-in">
//       <div className="flex items-start justify-between">
//         <div className="min-w-0 flex-1">
//           <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</p>
//           <p className="mt-1.5 text-2xl font-display font-700 text-slate-900 leading-none">
//             {value ?? "—"}
//           </p>
//           {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
//         </div>
//         {icon && (
//           <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1", c.bg, c.ring, c.icon)}>
//             {icon}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }











import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export default function StatCard({
  label,
  value,
  sub,
  icon,
  color = "blue",
  to,           // ← optional navigation target
}) {
  const navigate = useNavigate();
  const isClickable = !!to;

  const colorMap = {
    blue:   { bg: "bg-brand-50",  icon: "text-brand-600",  ring: "ring-brand-100" },
    green:  { bg: "bg-green-50",  icon: "text-green-600",  ring: "ring-green-100" },
    red:    { bg: "bg-red-50",    icon: "text-red-500",    ring: "ring-red-100"   },
    amber:  { bg: "bg-amber-50",  icon: "text-amber-600",  ring: "ring-amber-100" },
    violet: { bg: "bg-violet-50", icon: "text-violet-600", ring: "ring-violet-100"},
  };
  const c = colorMap[color] ?? colorMap.blue;

  return (
    <div
      onClick={() => isClickable && navigate(to)}
      className={cn(
        "rounded-2xl border border-surface-border bg-white p-5 shadow-card",
        "transition-all duration-200 animate-fade-in",
        isClickable && [
          "cursor-pointer",
          "hover:shadow-card-hover hover:border-slate-300",
          "active:scale-[0.98]",
        ]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-display font-700 text-slate-900 leading-none">
            {value ?? "—"}
          </p>
          {sub && (
            <p className="mt-1 text-xs text-slate-400">{sub}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          {icon && (
            <div className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1",
              c.bg, c.ring, c.icon
            )}>
              {icon}
            </div>
          )}
          {/* Drill-down arrow — only shown on clickable cards */}
          {isClickable && (
            <span className="text-xs text-slate-300 group-hover:text-slate-400 flex items-center gap-0.5">
              View
              <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd"/>
              </svg>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}