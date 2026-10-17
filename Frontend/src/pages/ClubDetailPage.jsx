import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';
import { fmtDateTime, fmtMoney } from '../lib/format';
import { PlayerTable } from '../components/PlayerTable';
import { PlayerDrawer } from '../components/PlayerDrawer';
import { PlayerFormModal } from '../components/PlayerFormModal';
import { ConditionModal } from '../components/ConditionModal';
import { SellModal } from '../components/SellModal';
import { BuyModal } from '../components/BuyModal';
import { DeleteModal } from '../components/DeleteModal';
import { Avatar, ConditionBadge, PositionTag } from '../components/Badges';

const FORMATIONS = [
  { value: '3-1', label: '3-1', hint: '1 GOL · 3 ZAG/LAT · 1 ATA' },
  { value: '2-2', label: '2-2', hint: '1 GOL · 2 ZAG/LAT · 2 ATA' },
  { value: '2-1-1', label: '2-1-1', hint: '1 GOL · 2 ZAG/LAT · 1 MEI · 1 ATA' },
  { value: '1-2-1', label: '1-2-1', hint: '1 GOL · 1 ZAG/LAT · 2 MEI · 1 ATA' },
];

export function ClubDetailPage() {
  const { id } = useParams();
  const clubId = Number(id);
  const { version, refresh, notify } = useApp();

  const [club, setClub] = useState(null);
  const [tab, setTab] = useState('squad'); // squad | lineup | transactions
  const [notFound, setNotFound] = useState(false);

  const [drawerId, setDrawerId] = useState(null);
  const [edit, setEdit] = useState(null);
  const [cond, setCond] = useState(null);
  const [sell, setSell] = useState(null);
  const [buy, setBuy] = useState(null);
  const [del, setDel] = useState(null);

  const load = useCallback(async () => {
    try {
      setClub(await api.getClub(clubId));
      setNotFound(false);
    } catch (e) {
      if (e.status === 404) setNotFound(true);
      else notify('error', 'Falha ao carregar o clube', e.message);
    }
  }, [clubId, notify]);

  useEffect(() => {
    setClub(null);
    load();
  }, [load, version]);

  if (notFound) {
    return (
      <div className="page">
        <p>Clube não encontrado.</p>
        <Link to="/clubes">Voltar</Link>
      </div>
    );
  }
  if (!club) return <div className="page muted">Carregando…</div>;

  return (
    <div className="page">
      <Link to="/clubes" className="back">
        <ArrowLeft size={16} /> Clubes
      </Link>
      <header className="page-head">
        <div className="page-icon tag-icon">{club.acronym}</div>
        <div>
          <h1>{club.name}</h1>
          <p className="muted">{club.players.length} de 12 jogadores no elenco</p>
        </div>
      </header>

      <div className="stat-grid three">
        <div className="stat-card">
          <div className="stat-top">
            <span>Caixa</span>
          </div>
          <strong>{fmtMoney(club.cash)}</strong>
        </div>
        <div className="stat-card">
          <div className="stat-top">
            <span>Valor do elenco</span>
          </div>
          <strong>{fmtMoney(club.squad_value)}</strong>
        </div>
        <div className="stat-card">
          <div className="stat-top">
            <span>Patrimônio</span>
          </div>
          <strong>{fmtMoney(club.net_worth)}</strong>
        </div>
      </div>

      <section className="card">
        <div className="card-head">
          <div className="tabs">
            {[
              ['squad', 'Elenco'],
              ['lineup', 'Escalação'],
              ['transactions', 'Transações'],
            ].map(([k, label]) => (
              <button key={k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {tab === 'squad' && (
          <PlayerTable
            players={club.players}
            empty="Este clube ainda não tem jogadores. Compre jogadores livres na tela de Jogadores."
            actions={{
              onView: (p) => setDrawerId(p.id),
              onEdit: setEdit,
              onCondition: setCond,
              onBuy: setBuy,
              onSell: setSell,
              onDelete: setDel,
            }}
          />
        )}
        {tab === 'lineup' && <LineupTab club={club} onSaved={refresh} />}
        {tab === 'transactions' && <TransactionsTab clubId={club.id} version={version} />}
      </section>

      {drawerId !== null && (
        <PlayerDrawer
          playerId={drawerId}
          onClose={() => setDrawerId(null)}
          onEdit={setEdit}
          onCondition={setCond}
          onBuy={setBuy}
          onSell={setSell}
        />
      )}
      {edit && <PlayerFormModal player={edit} onClose={() => setEdit(null)} />}
      {cond && <ConditionModal player={cond} onClose={() => setCond(null)} />}
      {sell && <SellModal player={sell} onClose={() => setSell(null)} />}
      {buy && <BuyModal player={buy} onClose={() => setBuy(null)} />}
      {del && <DeleteModal player={del} onClose={() => setDel(null)} />}
    </div>
  );
}

function LineupTab({ club, onSaved }) {
  const { notify } = useApp();
  const [formation, setFormation] = useState('2-1-1');
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [current, setCurrent] = useState(null);

  useEffect(() => {
    api
      .getLineup(club.id)
      .then((l) => {
        setCurrent({ formation: l.formation, complete: l.complete });
        setSelected(l.player_ids);
        if (l.formation) setFormation(l.formation);
      })
      .catch(() => undefined);
  }, [club.id]);

  const eligible = useMemo(() => club.players.filter((p) => p.condition !== 'DOENTE'), [club.players]);

  const toggle = (pid) =>
    setSelected((s) => (s.includes(pid) ? s.filter((x) => x !== pid) : s.length >= 5 ? s : [...s, pid]));

  async function save() {
    setBusy(true);
    setError('');
    try {
      await api.setLineup(club.id, formation, selected);
      notify('success', 'Escalação salva', `${club.name} jogará no ${formation}.`);
      setCurrent({ formation, complete: true });
      await onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="lineup">
      <div className="lineup-head">
        <div>
          <h3>Formação</h3>
          <div className="formation-grid">
            {FORMATIONS.map((f) => (
              <button key={f.value} className={`pos-option ${formation === f.value ? 'selected' : ''}`} onClick={() => setFormation(f.value)}>
                <strong>{f.label}</strong>
                <small>{f.hint}</small>
              </button>
            ))}
          </div>
        </div>
        <div className="lineup-status">
          <span className={`chip ${current?.complete ? 'ok' : ''}`}>{current?.complete ? 'Escalação completa' : 'Sem escalação'}</span>
          <strong>{selected.length}/5 titulares</strong>
        </div>
      </div>

      <div className="lineup-list">
        {eligible.length === 0 && <p className="muted">Nenhum jogador disponível. Jogadores doentes não podem ser escalados.</p>}
        {eligible.map((p) => {
          const on = selected.includes(p.id);
          return (
            <button key={p.id} className={`lineup-row ${on ? 'on' : ''}`} onClick={() => toggle(p.id)} disabled={!on && selected.length >= 5}>
              <input type="checkbox" readOnly checked={on} />
              <Avatar player={p} size={32} />
              <strong>{p.name}</strong>
              <PositionTag position={p.position} />
              <ConditionBadge condition={p.condition} />
              <span className="muted">Overall {p.overall}</span>
            </button>
          );
        })}
      </div>

      {error && <p className="form-error">{error}</p>}
      <div className="lineup-actions">
        <button className="btn primary" disabled={busy || selected.length !== 5} onClick={save}>
          {busy ? 'Salvando…' : 'Salvar escalação'}
        </button>
      </div>
    </div>
  );
}

function TransactionsTab({ clubId, version }) {
  const { notify } = useApp();
  const [type, setType] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    api
      .listTransactions(clubId, type || undefined)
      .then(setData)
      .catch((e) => notify('error', 'Falha ao carregar transações', e.message));
  }, [clubId, type, version, notify]);

  return (
    <div>
      <div className="tx-filter">
        {[
          ['', 'Todas'],
          ['COMPRA', 'Compras'],
          ['VENDA', 'Vendas'],
        ].map(([v, l]) => (
          <button key={v} className={`tab ${type === v ? 'active' : ''}`} onClick={() => setType(v)}>
            {l}
          </button>
        ))}
      </div>

      {data && (
        <div className="stat-grid five">
          <div className="stat-card"><div className="stat-top"><span>Gasto</span></div><strong>{fmtMoney(data.summary.total_spent)}</strong></div>
          <div className="stat-card"><div className="stat-top"><span>Recebido</span></div><strong>{fmtMoney(data.summary.total_received)}</strong></div>
          <div className="stat-card"><div className="stat-top"><span>Taxas</span></div><strong>{fmtMoney(data.summary.total_fees)}</strong></div>
          <div className="stat-card"><div className="stat-top"><span>Multas</span></div><strong>{fmtMoney(data.summary.total_penalties)}</strong></div>
          <div className="stat-card"><div className="stat-top"><span>Lucro</span></div><strong>{fmtMoney(data.summary.total_profit)}</strong></div>
        </div>
      )}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Jogador</th>
              <th>Tipo</th>
              <th className="num">Valor</th>
              <th className="num">Taxa</th>
              <th className="num">Multa</th>
              <th className="num">Lucro</th>
              <th className="num">Variação do caixa</th>
            </tr>
          </thead>
          <tbody>
            {data?.data.length === 0 && (
              <tr>
                <td colSpan={8} className="empty">Nenhuma transação.</td>
              </tr>
            )}
            {data?.data.map((t) => (
              <tr key={t.id}>
                <td className="muted">{fmtDateTime(t.created_at)}</td>
                <td><strong>{t.player_name}</strong></td>
                <td><span className={`badge ${t.type === 'COMPRA' ? 'warn' : 'ok'}`}>{t.type === 'COMPRA' ? 'Compra' : 'Venda'}</span></td>
                <td className="num">{fmtMoney(t.value)}</td>
                <td className="num">{fmtMoney(t.fee)}</td>
                <td className="num">{fmtMoney(t.penalty)}</td>
                <td className="num">{t.profit === null ? '—' : fmtMoney(t.profit)}</td>
                <td className={`num ${t.cash_change < 0 ? 'neg' : 'pos'}`}><strong>{fmtMoney(t.cash_change)}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}