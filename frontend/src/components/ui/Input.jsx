import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const Input = forwardRef(function Input(
  { label, error, hint, className, containerClassName, ...props },
  ref
) {
  const id = props.id || props.name;

  return (
    <div className={cn("flex flex-col gap-1.5", containerClassName)}>
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-slate-700 select-none"
        >
          {label}
          {props.required && (
            <span className="ml-1 text-red-500" aria-hidden="true">*</span>
          )}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          "h-9 w-full rounded-lg border bg-white px-3 text-sm text-slate-900",
          "placeholder:text-slate-400",
          "transition-shadow duration-150",
          "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-0 focus:border-brand-500",
          error
            ? "border-red-400 focus:ring-red-400"
            : "border-surface-border hover:border-slate-300",
          props.disabled && "bg-surface-subtle cursor-not-allowed opacity-60",
          className
        )}
        {...props}
      />
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-600">
          <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs text-slate-400">{hint}</p>
      )}
    </div>
  );
});

export default Input;
