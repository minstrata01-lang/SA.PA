const blue   = '#003D6B';
const orange = '#E8920A';

export default function AdminTable({ columns = [], data = [], onEdit, onDelete, loading, deletingId }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-52 gap-3">
        <div
          className="w-7 h-7 rounded-full border-[3px] animate-spin"
          style={{ borderColor: 'rgba(0,61,107,0.15)', borderTopColor: blue }}
        />
        <span
          className="text-sm font-medium"
          style={{ color: 'rgba(0,61,107,0.45)', fontFamily: "'Manrope', sans-serif" }}
        >
          Memuat data…
        </span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-52 gap-2">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mb-1"
          style={{ background: 'rgba(0,61,107,0.06)' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={blue} strokeWidth="1.6" strokeLinecap="round">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
            <rect x="9" y="3" width="6" height="4" rx="1"/>
          </svg>
        </div>
        <p
          className="text-sm font-semibold"
          style={{ color: blue, fontFamily: "'Manrope', sans-serif" }}
        >
          Belum ada data
        </p>
        <p
          className="text-xs"
          style={{ color: 'rgba(0,61,107,0.45)', fontFamily: "'Manrope', sans-serif" }}
        >
          Klik tombol Tambah untuk menambahkan data baru.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr style={{ background: 'rgba(0,61,107,0.04)', borderBottom: '1px solid rgba(0,61,107,0.08)' }}>
            <th
              className="px-5 py-3.5 text-xs font-bold uppercase tracking-widest"
              style={{ color: 'rgba(0,61,107,0.5)', fontFamily: "'Manrope', sans-serif" }}
            >
              No
            </th>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-5 py-3.5 text-xs font-bold uppercase tracking-widest"
                style={{ color: 'rgba(0,61,107,0.5)', fontFamily: "'Manrope', sans-serif" }}
              >
                {col.label}
              </th>
            ))}
            <th
              className="px-5 py-3.5 text-xs font-bold uppercase tracking-widest"
              style={{ color: 'rgba(0,61,107,0.5)', fontFamily: "'Manrope', sans-serif" }}
            >
              Aksi
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={row.id ?? index}
              className="transition-colors duration-150 group"
              style={{ borderBottom: '1px solid rgba(0,61,107,0.06)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,61,107,0.025)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <td
                className="px-5 py-4 font-semibold text-xs tabular-nums"
                style={{ color: 'rgba(0,61,107,0.35)', fontFamily: "'Manrope', sans-serif" }}
              >
                {String(index + 1).padStart(2, '0')}
              </td>
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="px-5 py-4"
                  style={{ color: blue, fontFamily: "'Manrope', sans-serif" }}
                >
                  {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '-')}
                </td>
              ))}
              <td className="px-5 py-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(row)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-all duration-150"
                    style={{
                      color: blue,
                      background: 'rgba(0,61,107,0.07)',
                      border: '1px solid rgba(0,61,107,0.15)',
                      fontFamily: "'Manrope', sans-serif",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,61,107,0.13)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,61,107,0.07)'; }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(row)}
                    disabled={deletingId === row.id}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      color: '#be123c',
                      background: 'rgba(190,18,60,0.06)',
                      border: '1px solid rgba(190,18,60,0.2)',
                      fontFamily: "'Manrope', sans-serif",
                    }}
                    onMouseEnter={e => { if (deletingId !== row.id) e.currentTarget.style.background = 'rgba(190,18,60,0.12)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(190,18,60,0.06)'; }}
                  >
                    {deletingId === row.id ? (
                      <>
                        <div className="w-3 h-3 rounded-full border-2 border-rose-300 border-t-rose-600 animate-spin" />
                        Menghapus…
                      </>
                    ) : (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6"/>
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                        Hapus
                      </>
                    )}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
