import React from "react";
import { cn } from "@/lib/utils";

// ─── Card ──────────────────────────────────────────────────────────────────

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-sage/15 bg-slate-green/30 dark:bg-slate-green/10 shadow-sm backdrop-blur-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── CardHeader ────────────────────────────────────────────────────────────

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

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

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

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

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

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

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardContent({ className, children, ...props }: CardContentProps) {
  return (
    <div className={cn("p-6 pt-0", className)} {...props}>
      {children}
    </div>
  );
}

// ─── CardFooter ────────────────────────────────────────────────────────────

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

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
