import * as React from "react";
export const Select = ({ children, onValueChange, value, ...props }: any) => <div {...props}>{children}</div>;
export const SelectGroup = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const SelectValue = ({ children, ...props }: any) => <span {...props}>{children}</span>;
export const SelectTrigger = ({ children, ...props }: any) => <button {...props}>{children}</button>;
export const SelectContent = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const SelectLabel = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const SelectItem = ({ children, value, ...props }: any) => <div {...props}>{children}</div>;
export const SelectSeparator = ({ ...props }: any) => <div {...props} />;
