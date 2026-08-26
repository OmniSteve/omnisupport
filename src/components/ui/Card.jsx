import React from "react";
import { cn } from "@/lib/cn";

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }) {
  return <div className={cn("px-5 py-4 border-b border-slate-100 dark:border-slate-800", className)}>{children}</div>;
}

export function CardTitle({ className, children }) {
  return <h3 className={cn("text-sm font-semibold text-slate-900 dark:text-slate-100", className)}>{children}</h3>;
}

export function CardContent({ className, children }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}