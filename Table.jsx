import React from 'react';

export const Table = ({
  columns = [],
  data = [],
  keyExtractor = (item, index) => item.id || index,
  emptyMessage = 'No records found',
  className = '',
}) => {
  return (
    <div className={`w-full overflow-x-auto rounded-xl border border-[#1E293B] bg-[#111C2E] ${className}`}>
      <table className="w-full text-left text-sm text-[#F8FAFC]">
        <thead className="bg-[#0B1220]/80 text-xs uppercase font-semibold text-[#94A3B8] border-b border-[#1E293B] tracking-wider">
          <tr>
            {columns.map((col, idx) => (
              <th key={col.key || idx} scope="col" className={`px-4 py-3.5 ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1E293B]">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-[#94A3B8] font-medium">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={keyExtractor(row, rowIdx)}
                className="hover:bg-[#16243B]/60 transition-colors"
              >
                {columns.map((col, colIdx) => (
                  <td key={col.key || colIdx} className={`px-4 py-3.5 whitespace-nowrap ${col.cellClassName || ''}`}>
                    {col.render ? col.render(row, rowIdx) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
export default Table;
