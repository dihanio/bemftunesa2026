import React from "react";
import { cn } from "@/lib/utils";

// ─── Card ──────────────────────────────────────────────────────────────────

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white dark:border-accent-blue/15 bg-slate-800/30 dark:bg-slate-800/10 shadow-sm backdrop-blur-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── CardHeader ────────────────────────────────────────────────────────────

export type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>;

export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── CardTitle ─────────────────────────────────────────────────────────────

export type CardTitleProps = React.HTMLAttributes<HTMLHeadingElement>;

export function CardTitle({ className, children, ...props }: CardTitleProps) {
  return (
    <h3
      className={cn("font-semibold leading-none tracking-tight text-foreground", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

// ─── CardDescription ───────────────────────────────────────────────────────

export type CardDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

export function CardDescription({ className, children, ...props }: CardDescriptionProps) {
  return (
    <p
      className={cn("text-sm text-foreground/60", className)}
      {...props}
    >
      {children}
    </p>
  );
}

// ─── CardContent ───────────────────────────────────────────────────────────

export type CardContentProps = React.HTMLAttributes<HTMLDivElement>;

export function CardContent({ className, children, ...props }: CardContentProps) {
  return (
    <div className={cn("p-6 pt-0", className)} {...props}>
      {children}
    </div>
  );
}

// ─── CardFooter ────────────────────────────────────────────────────────────

export type CardFooterProps = React.HTMLAttributes<HTMLDivElement>;

export function CardFooter({ className, children, ...props }: CardFooterProps) {
  return (
    <div
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    >
      {children}
    </div>
  );
}
