import { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { useOutsideClick } from '../lib/hooks';

export function RowMenu({ title, items }) {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClick(() => setOpen(false), open);

  return (
    <div className="menu-wrap" ref={ref}>
      <button className="icon-btn" aria-label={`Ações de ${title}`} onClick={() => setOpen((o) => !o)}>
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <div className="menu" role="menu">
          <div className="menu-title">{title}</div>
          {items.map((it) => (
            <div key={it.label}>
              {it.dividerBefore && <div className="menu-divider" />}
              <button
                role="menuitem"
                className={`menu-item ${it.danger ? 'danger' : ''}`}
                disabled={it.disabled}
                onClick={() => {
                  setOpen(false);
                  it.onClick?.();
                }}
              >
                {it.icon}
                {it.label}
              </button>
              {it.hint && <p className="menu-hint">{it.hint}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Dropdown({ label, options, value, onChange, icon }) {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClick(() => setOpen(false), open);
  const current = options.find((o) => o.value === value);

  return (
    <div className="menu-wrap" ref={ref}>
      <button className={`btn select-btn ${value ? 'active' : ''}`} onClick={() => setOpen((o) => !o)}>
        {icon}
        <span>{current && value ? current.label : label}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="menu" role="listbox">
          {options.map((o) => (
            <button
              key={o.value}
              className={`menu-item ${o.value === value ? 'selected' : ''}`}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function RangeFilter({ label, icon, min, max, onChange, step = 1 }) {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClick(() => setOpen(false), open);
  const active = min !== '' || max !== '';

  return (
    <div className="menu-wrap" ref={ref}>
      <button className={`btn select-btn ${active ? 'active' : ''}`} onClick={() => setOpen((o) => !o)}>
        {icon}
        <span>{active ? `${label}: ${min || '0'}–${max || '∞'}` : label}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="menu range-menu">
          <div className="menu-title">{label}</div>
          <div className="range-fields">
            <input type="number" step={step} placeholder="Mín." value={min} onChange={(e) => onChange(e.target.value, max)} />
            <input type="number" step={step} placeholder="Máx." value={max} onChange={(e) => onChange(min, e.target.value)} />
          </div>
          {active && (
            <button className="link-btn" onClick={() => onChange('', '')}>
              Limpar
            </button>
          )}
        </div>
      )}
    </div>
  );
}