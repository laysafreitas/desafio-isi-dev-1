import { X } from 'lucide-react';
import { useEscape } from '../lib/hooks';

export function Modal({ title, description, onClose, children, footer, width = 480 }) {
  useEscape(onClose);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: width }} role="dialog" aria-modal="true" aria-label={title}>
        <button className="icon-btn modal-close" onClick={onClose} aria-label="Fechar">
          <X size={18} />
        </button>
        <h2>{title}</h2>
        {description && <p className="muted modal-desc">{description}</p>}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export function Drawer({ onClose, children }) {
  useEscape(onClose);
  return (
    <div className="overlay drawer-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="drawer" role="dialog" aria-modal="true">
        {children}
      </aside>
    </div>
  );
}