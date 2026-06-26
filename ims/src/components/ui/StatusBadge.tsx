import React from "react";
import { LucideIcon } from "lucide-react";

interface StatusBadgeProps {
  label: string;
  colorClass: string;
  icon?: LucideIcon;
}

export function StatusBadge({ label, colorClass, icon: Icon }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${colorClass}`}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {label}
    </span>
  );
}

export default StatusBadge;
