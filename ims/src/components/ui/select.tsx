import * as React from "react";
export const Select = ({ children, onValueChange, value, ...props }: React.HTMLAttributes<HTMLElement> & { value?: string, onValueChange?: (v: string) => void }) => <div {...props}>{children}</div>;
export const SelectGroup = ({ children, ...props }: React.HTMLAttributes<HTMLElement> & { value?: string, onValueChange?: (v: string) => void }) => <div {...props}>{children}</div>;
export const SelectValue = ({ children, ...props }: React.HTMLAttributes<HTMLElement> & { value?: string, onValueChange?: (v: string) => void }) => <span {...props}>{children}</span>;
export const SelectTrigger = ({ children, ...props }: React.HTMLAttributes<HTMLElement> & { value?: string, onValueChange?: (v: string) => void }) => <button {...props}>{children}</button>;
export const SelectContent = ({ children, ...props }: React.HTMLAttributes<HTMLElement> & { value?: string, onValueChange?: (v: string) => void }) => <div {...props}>{children}</div>;
export const SelectLabel = ({ children, ...props }: React.HTMLAttributes<HTMLElement> & { value?: string, onValueChange?: (v: string) => void }) => <div {...props}>{children}</div>;
export const SelectItem = ({ children, value, ...props }: React.HTMLAttributes<HTMLElement> & { value?: string, onValueChange?: (v: string) => void }) => <div {...props}>{children}</div>;
export const SelectSeparator = ({ ...props }: React.HTMLAttributes<HTMLElement> & { value?: string, onValueChange?: (v: string) => void }) => <div {...props} />;
