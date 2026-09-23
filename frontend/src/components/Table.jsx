export default function Table({ columns, rows, onRowClick, emptyMessage = 'No records found.', striped = true }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-warm-200">
      <table className="min-w-full divide-y divide-warm-200 text-sm">
        <thead className="bg-warm-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-xs font-semibold text-warm-500 uppercase tracking-wider"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-warm-100 bg-white">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-warm-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={row.id ?? i}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`
                  ${onRowClick ? 'cursor-pointer hover:bg-green-50/50' : ''}
                  ${striped && i % 2 === 1 ? 'bg-warm-50/50' : ''}
                `}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-warm-700">
                    {col.render ? col.render(row) : row[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}