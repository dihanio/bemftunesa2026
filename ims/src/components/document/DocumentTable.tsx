"use client";

import React from 'react';
import { DataTable, Column } from '../ui/DataTable';
import { FileText } from 'lucide-react';

interface DocumentTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

export function DocumentTable<T>({ 
  data, 
  columns, 
  loading, 
  onRowClick, 
  emptyMessage = "Belum ada dokumen" 
}: DocumentTableProps<T>) {
  return (
    <DataTable
      data={data}
      columns={columns}
      loading={loading}
      onRowClick={onRowClick}
      emptyMessage={emptyMessage}
      emptyIcon={<FileText className="w-8 h-8 text-white/20 mb-2" />}
    />
  );
}
