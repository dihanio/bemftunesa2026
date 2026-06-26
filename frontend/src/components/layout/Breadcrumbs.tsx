import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  path?: string;
  isCurrent?: boolean;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <div className="inline-flex flex-wrap items-center gap-2.5 py-3 px-5 rounded-2xl glass-subtle border border-sage/15 max-w-full font-mono text-[10px] uppercase tracking-widest text-sage shadow-sm mb-8 animate-in fade-in slide-in-from-left-4 duration-300">
      <Link href="/" className="hover:text-foreground transition-colors inline-flex items-center gap-1.5 leading-none">
        <Home className="w-3.5 h-3.5 shrink-0" />
        <span className="translate-y-[0.5px]">BEM FT</span>
      </Link>
      
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <ChevronRight className="w-3 h-3 text-sage/40 shrink-0" />
          {item.isCurrent || !item.path ? (
            <span className="text-foreground font-bold truncate max-w-[150px] sm:max-w-xs leading-none translate-y-[0.5px]">{item.label}</span>
          ) : (
            <Link href={item.path} className="hover:text-foreground transition-colors inline-flex items-center leading-none translate-y-[0.5px]">
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default Breadcrumbs;
