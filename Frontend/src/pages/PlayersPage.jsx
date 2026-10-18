import { useCallback, useEffect, useState } from 'react';
import { ArrowUpDown, Banknote, HeartPulse, Plus, Search, Shield, Shirt, User } from 'lucide-react';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';
import { useDebounce } from '../lib/hooks';
import { CONDITION_LABEL, POSITIONS, POSITION_LABEL } from '../lib/constants';
import { Dropdown, RangeFilter } from '../components/Menu';
import { PlayerTable } from '../components/PlayerTable';
import { Pagination } from '../components/Pagination';
import { PlayerDrawer } from '../components/PlayerDrawer';
import { PlayerFormModal } from '../components/PlayerFormModal';
import { ConditionModal } from '../components/ConditionModal';
import { DeleteModal } from '../components/DeleteModal';
import { BuyModal } from '../components/BuyModal';
import { SellModal } from '../components/SellModal';

const LIMIT = 10;

const SORTS = [
  { value: 'name', label: 'Nome' },
  { value: 'value_desc', label: 'Maior valor de mercado' },
  { value: 'value_asc', label: 'Menor valor de mercado' },
  { value: 'age_desc', label: 'Maior idade' },
  { value: 'age_asc', label: 'Menor idade' },
  { value: 'position', label: 'Posição (GOL a ATA)' },
];

export function PlayersPage() {
  const { clubs, version, notify } = useApp();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [position, setPosition] = useState('');
  const [condition, setCondition] = useState('');
  const [clubId, setClubId] = useState('');
  const [age, setAge] = useState({ min: '', max: '' });
  const [value, setValue] = useState({ min: '', max: '' });
  const [sort, setSort] = useState('name');
  const [tab, setTab] = useState('all'); 
  const [page, setPage] = useState(1);

  const [result, setResult] = useState(null);
  const [counts, setCounts] = useState({ all: 0, free: 0, clubs: 0 });
  const [loading, setLoading] = useState(true);

  const [drawerId, setDrawerId] = useState(null);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, position, condition, clubId, age, value, sort, tab]);

  const load = useCallback(async () => {
    setLoading(true);
    const q = {
      search: debouncedSearch.trim(),
      position,
      condition,
      club_id: clubId,
      min_age: age.min,
      max_age: age.max,
      min_value: value.min,
      max_value: value.max,
      sort,
      page,
      limit: LIMIT,
    };
    if (tab === 'free') q.free = 'true';
    if (tab === 'clubs') q.free = 'false';
    try {
      setResult(await api.listPlayers(q));
    } catch (e) {
      notify('error', 'Não foi possível listar os jogadores', e.message);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, position, condition, clubId, age, value, sort, tab, page, notify]);

  useEffect(() => {
    load();
  }, [load, version]);

  useEffect(() => {
    Promise.all([
      api.listPlayers({ limit: 1 }),
      api.listPlayers({ limit: 1, free: 'true' }),
      api.listPlayers({ limit: 1, free: 'false' }),
    ])
      .then(([a, f, c]) => setCounts({ all: a.meta.total_items, free: f.meta.total_items, clubs: c.meta.total_items }))
      .catch(() => undefined);
  }, [version]);

  const hasFilters = !!(search || position || condition || clubId || age.min || age.max || value.min || value.max);
  const clearFilters = () => {
    setSearch('');
    setPosition('');
    setCondition('');
    setClubId('');
    setAge({ min: '', max: '' });
    setValue({ min: '', max: '' });
  };

  const actions = {
    onView: (p) => setDrawerId(p.id),
    onEdit: (p) => setModal({ kind: 'edit', player: p }),
    onCondition: (p) => setModal({ kind: 'condition', player: p }),
    onBuy: (p) => setModal({ kind: 'buy', player: p }),
    onSell: (p) => setModal({ kind: 'sell', player: p }),
    onDelete: (p) => setModal({ kind: 'delete', player: p }),
  };

  return (
    <div className="page">
      <header className="page-head">
        <div className="page-icon">
          <User size={22} />
        </div>
        <div>
          <h1>Jogadores</h1>
          <p className="muted">Cadastre jogadores, acompanhe os indicadores e compre os que estão livres.</p>
        </div>
        <button className="btn primary" onClick={() => setModal({ kind: 'create' })}>
          <Plus size={16} /> Novo jogador
        </button>
      </header>

      <section className="filters">
        <div className="search">
          <Search size={16} />
          <input placeholder="Buscar por nome" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Dropdown
          label="Posição"
          icon={<Shirt size={16} />}
          value={position}
          onChange={setPosition}
          options={[{ value: '', label: 'Todas as posições' }, ...POSITIONS.map((p) => ({ value: p, label: `${p} · ${POSITION_LABEL[p]}` }))]}
        />
        <Dropdown
          label="Condição"
          icon={<HeartPulse size={16} />}
          value={condition}
          onChange={setCondition}
          options={[
            { value: '', label: 'Todas as condições' },
            ...Object.keys(CONDITION_LABEL).map((c) => ({ value: c, label: CONDITION_LABEL[c] })),
          ]}
        />
        <Dropdown
          label="Clube"
          icon={<Shield size={16} />}
          value={clubId}
          onChange={setClubId}
          options={[{ value: '', label: 'Todos os clubes' }, ...clubs.map((c) => ({ value: String(c.id), label: c.name }))]}
        />
        <RangeFilter label="Idade" icon={<User size={16} />} min={age.min} max={age.max} onChange={(min, max) => setAge({ min, max })} />
        <RangeFilter
          label="Valor de mercado"
          icon={<Banknote size={16} />}
          min={value.min}
          max={value.max}
          step={0.01}
          onChange={(min, max) => setValue({ min, max })}
        />
        {hasFilters && (
          <button className="link-btn" onClick={clearFilters}>
            Limpar filtros
          </button>
        )}
      </section>

      <section className={`card ${loading ? 'loading' : ''}`}>
        <div className="card-head">
          <div className="tabs">
            {[
              ['all', 'Todos', counts.all],
              ['free', 'Livres', counts.free],
              ['clubs', 'Em clubes', counts.clubs],
            ].map(([k, label, n]) => (
              <button key={k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>
                {label} <span>{n}</span>
              </button>
            ))}
          </div>
          <Dropdown label="Ordenar" icon={<ArrowUpDown size={16} />} value={sort} onChange={setSort} options={SORTS} />
        </div>

        <PlayerTable
          players={result?.data ?? []}
          actions={actions}
          empty={hasFilters ? 'Nenhum jogador com esses filtros.' : 'Nenhum jogador cadastrado ainda.'}
        />

        <Pagination
          page={result?.meta.page ?? 1}
          totalPages={Math.max(1, result?.meta.total_pages ?? 1)}
          totalItems={result?.meta.total_items ?? 0}
          limit={LIMIT}
          onChange={setPage}
        />
      </section>

      {drawerId !== null && (
        <PlayerDrawer
          playerId={drawerId}
          onClose={() => setDrawerId(null)}
          onEdit={(p) => setModal({ kind: 'edit', player: p })}
          onCondition={(p) => setModal({ kind: 'condition', player: p })}
          onBuy={(p) => setModal({ kind: 'buy', player: p })}
          onSell={(p) => setModal({ kind: 'sell', player: p })}
        />
      )}

      {modal?.kind === 'create' && <PlayerFormModal onClose={() => setModal(null)} />}
      {modal?.kind === 'edit' && <PlayerFormModal player={modal.player} onClose={() => setModal(null)} />}
      {modal?.kind === 'condition' && <ConditionModal player={modal.player} onClose={() => setModal(null)} />}
      {modal?.kind === 'buy' && <BuyModal player={modal.player} onClose={() => setModal(null)} />}
      {modal?.kind === 'sell' && <SellModal player={modal.player} onClose={() => setModal(null)} />}
      {modal?.kind === 'delete' && (
        <DeleteModal
          player={modal.player}
          onClose={() => setModal(null)}
          onDeleted={() => drawerId === modal.player.id && setDrawerId(null)}
        />
      )}
    </div>
  );
}