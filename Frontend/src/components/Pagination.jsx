import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({ page, totalPages, totalItems, limit, noun = 'jogadores', onChange }) {
  const from = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(totalItems, page * limit);

  const pages = [];
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  for (let p = start; p <= Math.min(totalPages, start + 4); p++) pages.push(p);

  return (
    <div className="pagination">
      <span className="muted">
        Mostrando {from}–{to} de {totalItems} {noun}
      </span>
      <div className="pages">
        <button className="btn ghost" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <ChevronLeft size={16} /> Anterior
        </button>
        {pages.map((p) => (
          <button key={p} className={`page-btn ${p === page ? 'current' : ''}`} onClick={() => onChange(p)}>
            {p}
          </button>
        ))}
        <button className="btn ghost" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          Próxima <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}