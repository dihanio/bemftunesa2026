import React from 'react';

interface ListColumn<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface ListWidgetProps<T> {
  title: string;
  data: T[];
  columns: ListColumn<T>[];
  keyExtractor: (item: T) => string;
}

export function ListWidget<T>({ title, data, columns, keyExtractor }: ListWidgetProps<T>) {
  return (
    <div className="p-0 border border-hairline rounded-xl bg-surface-1 shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden h-full flex flex-col">
      <div className="p-5 border-b border-hairline flex items-center justify-between bg-surface-1/50">
        <h4 className="text-sm font-semibold text-ink">{title}</h4>
      </div>
      
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="text-xs text-ink-tertiary bg-surface-2 border-b border-hairline uppercase">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className={`px-4 py-3 font-medium ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {data.map((item, i) => (
              <tr key={keyExtractor(item)} className="hover:bg-surface-2/70 transition-all duration-150 cursor-pointer">
                {columns.map((col, j) => (
                  <td key={j} className={`px-4 py-3 ${col.className || ''}`}>
                    {typeof col.accessor === 'function' ? col.accessor(item) : String(item[col.accessor])}
                  </td>
                ))}
              </tr>
            ))}
            
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-ink-tertiary">
                  Tidak ada data yang tersedia.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
