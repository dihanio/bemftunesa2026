"use client";

import * as React from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          className={`
            flex h-11 w-full items-center justify-between
            rounded-xl border border-white/10
            bg-white/3 backdrop-blur-sm
            px-4 py-2.5 text-sm text-white
            appearance-none pr-10
            transition-all duration-300 ease-out
            placeholder:text-gray-600
            focus:outline-none focus:ring-2 focus:ring-[#10b981]/40 focus:border-[#10b981]/50
            hover:border-white/20 hover:bg-white/5
            disabled:cursor-not-allowed disabled:opacity-40
            font-medium tracking-wide
            ${className}
          `}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        {/* Typographic chevron (no icon library) */}
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 pointer-events-none font-mono font-bold select-none">
          ▾
        </span>
      </div>
    );
  },
);
Select.displayName = "Select";

export { Select };
