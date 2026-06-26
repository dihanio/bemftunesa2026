export function Dialog({children, open, onOpenChange}: any) { return open ? <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"><div className="bg-background p-6 rounded-lg max-w-lg w-full relative"><button onClick={() => onOpenChange?.(false)} className="absolute top-4 right-4">x</button>{children}</div></div> : null; }
export function DialogContent({children}: any) { return <div className="mt-4">{children}</div>; }
export function DialogHeader({children}: any) { return <div className="space-y-1.5 text-center sm:text-left">{children}</div>; }
export function DialogTitle({children}: any) { return <h2 className="text-lg font-semibold leading-none tracking-tight">{children}</h2>; }
export function DialogTrigger({children, asChild, ...props}: any) { return <button {...props}>{children}</button>; }
export function DialogFooter({children, className, ...props}: any) { return <div className={className} {...props}>{children}</div>; }
