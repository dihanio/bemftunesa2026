"use client";

import * as React from "react";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <textarea
        className={`
          w-full min-h-[100px] px-4 py-3
          rounded-xl border border-white/10
          bg-black/40 backdrop-blur-sm
          text-sm text-white font-medium tracking-wide leading-relaxed
          transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]
          placeholder:text-white/20
          focus:outline-none focus:border-[#10b981]/50 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.08)]
          hover:border-white/20 hover:bg-black/50
          disabled:cursor-not-allowed disabled:opacity-40
          resize-none
          ${className}
        `}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
