"use client";

import * as React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <input
        className={`
          w-full h-11 px-4 py-2.5
          rounded-xl border border-white/10
          bg-black/40 backdrop-blur-sm
          text-sm text-white font-medium tracking-wide
          transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]
          placeholder:text-white/20
          focus:outline-none focus:border-[#10b981]/50 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.08)]
          hover:border-white/20 hover:bg-black/50
          disabled:cursor-not-allowed disabled:opacity-40
          ${className}
        `}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
