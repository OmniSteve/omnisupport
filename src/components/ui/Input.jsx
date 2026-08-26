import React from "react";
import { cn } from "@/lib/cn";

export const Input = React.forwardRef(function Input({ className, label, error, ...props }, ref) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>}
      <input
        ref={ref}
        className={cn(
          "w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-slate-700",
          error && "border-red-400 focus:border-red-400 focus:ring-red-100",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
});

export const Textarea = React.forwardRef(function Textarea({ className, label, error, ...props }, ref) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>}
      <textarea
        ref={ref}
        className={cn(
          "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-slate-700",
          error && "border-red-400",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
});

export const Select = React.forwardRef(function Select({ className, label, children, ...props }, ref) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>}
      <select
        ref={ref}
        className={cn(
          "w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 transition-colors focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-slate-700",
          className
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  );
});