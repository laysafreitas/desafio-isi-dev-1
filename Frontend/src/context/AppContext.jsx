import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { CreateClubModal } from '../components/CreateClubModal';

const Ctx = createContext(null);

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp fora do AppProvider');
  return v;
}

export function AppProvider({ children }) {
  const [clubs, setClubs] = useState([]);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [lastMatch, setLastMatch] = useState(null);
  const [version, setVersion] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [clubModal, setClubModal] = useState(false);

  const notify = useCallback((kind, title, message) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, title, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);

  const load = useCallback(async () => {
    try {
      const [c, p, m] = await Promise.all([api.listClubs(), api.listPlayers({ limit: 1 }), api.listMatches()]);
      setClubs(c);
      setTotalPlayers(p.meta.total_items);
      setLastMatch(m[0] ?? null);
    } catch (e) {
      notify('error', 'Falha ao carregar dados', e.message);
    }
  }, [notify]);

  const refresh = useCallback(async () => {
    await load();
    setVersion((v) => v + 1);
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  const value = useMemo(
    () => ({ clubs, totalPlayers, lastMatch, version, refresh, notify, openCreateClub: () => setClubModal(true) }),
    [clubs, totalPlayers, lastMatch, version, refresh, notify],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      {clubModal && <CreateClubModal onClose={() => setClubModal(false)} />}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`}>
            <div className="toast-icon">{t.kind === 'success' ? '✓' : '!'}</div>
            <div className="toast-body">
              <strong>{t.title}</strong>
              {t.message && <p>{t.message}</p>}
            </div>
            <button className="icon-btn" onClick={() => setToasts((x) => x.filter((i) => i.id !== t.id))} aria-label="Fechar">
              ×
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}