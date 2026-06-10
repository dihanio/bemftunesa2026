"use client";

import Link from "next/link";
import { Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  id?: string;
}

export function Breadcrumbs({ items, id }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-4 text-[10px] font-mono text-gray-400 uppercase tracking-[0.2em] mb-12 border-b border-white/5 pb-6 overflow-x-auto no-scrollbar whitespace-nowrap"
    >
      <Link
        href="/"
        className="hover:text-[#10b981] transition-colors flex items-center gap-1.5"
      >
        <Home className="w-3 h-3" />
        Root
      </Link>

      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-4">
          <span className="text-white/20 select-none">{"//"}</span>

          {item.isCurrent ? (
            <span className="text-[#10b981] font-bold">
              {item.label}
              {id && <span className="text-gray-400 ml-2">[{id}]</span>}
            </span>
          ) : item.href ? (
            <Link
              href={item.href}
              className="hover:text-[#10b981] transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span>{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
