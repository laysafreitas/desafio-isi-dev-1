import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Shield } from 'lucide-react';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';
import { fmtMoney } from '../lib/format';
import { Dropdown } from '../components/Menu';

const SORTS = [
  { value: 'name', label: 'Nome' },
  { value: 'net_worth_desc', label: 'Maior patrimônio' },
  { value: 'net_worth_asc', label: 'Menor patrimônio' },
];

export function ClubsPage() {
  const { version, openCreateClub, notify } = useApp();
  const [clubs, setClubs] = useState([]);
  const [sort, setSort] = useState('name');

  useEffect(() => {
    api.listClubs(sort).then(setClubs).catch((e) => notify('error', 'Falha ao listar clubes', e.message));
  }, [sort, version, notify]);

  return (
    <div className="page">
      <header className="page-head">
        <div className="page-icon">
          <Shield size={22} />
        </div>
        <div>
          <h1>Clubes</h1>
          <p className="muted">Caixa, valor do elenco e patrimônio de cada clube da liga.</p>
        </div>
        <button className="btn primary" onClick={openCreateClub}>
          <Plus size={16} /> Novo clube
        </button>
      </header>

      <div className="toolbar">
        <Dropdown label="Ordenar" value={sort} onChange={setSort} options={SORTS} />
      </div>

      <div className="club-grid">
        {clubs.map((c) => (
          <Link key={c.id} to={`/clubes/${c.id}`} className="club-card">
            <div className="club-card-head">
              <span className="tag soft">{c.acronym}</span>
              <strong>{c.name}</strong>
            </div>
            <dl>
              <div>
                <dt>Caixa</dt>
                <dd>{fmtMoney(c.cash)}</dd>
              </div>
              <div>
                <dt>Elenco</dt>
                <dd>{fmtMoney(c.squad_value)}</dd>
              </div>
              <div>
                <dt>Patrimônio</dt>
                <dd className="strong">{fmtMoney(c.net_worth)}</dd>
              </div>
            </dl>
          </Link>
        ))}
        {clubs.length === 0 && <p className="muted">Nenhum clube cadastrado ainda.</p>}
      </div>
    </div>
  );
}