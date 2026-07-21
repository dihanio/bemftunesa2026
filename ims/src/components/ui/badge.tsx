export const Badge = ({ children, className, variant, ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: string }) => {
  // Base styling follows the status-badge token
  // background: {colors.surface-2}, text: {colors.ink-muted}, typography: {typography.caption}, rounded: {rounded.pill}, padding: 2px 8px
  return (
    <div 
      className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[12px] font-medium leading-[1.4] bg-surface-2 text-ink-muted border border-hairline ${className || ""}`} 
      {...props}
    >
      {children}
    </div>
  );
};
