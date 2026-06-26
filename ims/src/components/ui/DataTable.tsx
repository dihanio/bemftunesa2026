"use client";

import React from "react";

export interface Column<T> {
  header: string;
  accessor?: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
}

export function DataTable<T>({
  data,
  columns,
  loading,
  onRowClick,
  emptyMessage = "Tidak ada data yang ditemukan",
  emptyIcon,
}: DataTableProps<T>) {
  return (
    <div className="glass-subtle border border-white/5 rounded-2xl overflow-hidden relative">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-white/5 border-b border-white/10 text-xs font-semibold uppercase tracking-wider text-foreground/50">
              {columns.map((col, idx) => (
                <th key={idx} className={`p-4 ${idx === 0 ? "pl-6" : ""} ${col.className || ""}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="p-12 text-center text-foreground/50">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 animate-spin rounded-full border-4 border-sage/20 border-t-sage" />
                    <span className="text-sm font-medium">Memuat data...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-16 text-center text-foreground/40">
                  <div className="flex flex-col items-center justify-center gap-2.5">
                    {emptyIcon && <div className="mb-1">{emptyIcon}</div>}
                    <span className="text-sm font-medium">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, rowIdx) => (
                <tr
                  key={rowIdx}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`border-b border-white/5 hover:bg-white/5 transition-colors group ${
                    onRowClick ? "cursor-pointer" : ""
                  }`}
                >
                  {columns.map((col, colIdx) => {
                    let content: React.ReactNode = null;
                    if (col.accessor) {
                      if (typeof col.accessor === "function") {
                        content = col.accessor(item);
                      } else {
                        content = item[col.accessor] as React.ReactNode;
                      }
                    }
                    return (
                      <td
                        key={colIdx}
                        className={`p-4 ${colIdx === 0 ? "pl-6" : ""} align-middle ${col.className || ""}`}
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default DataTable;
