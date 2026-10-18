import { Link, NavLink } from 'react-router-dom';
import { Clock, ListOrdered, Plus, Shield, Swords, Trophy, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function Sidebar() {
  const { clubs, totalPlayers, lastMatch, openCreateClub } = useApp();

  return (
    <aside className="sidebar">
      <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="brand" style={{ cursor: 'pointer' }}>
          <div className="brand-logo">P</div>
          <div>
            <strong>Passe</strong>
            <span className="muted">Gestão da liga</span>
          </div>
        </div>
      </Link>

      <nav>
        <div className="nav-section">Mercado</div>
        <NavLink to="/jogadores" className="nav-item">
          <Users size={18} />
          <span>Jogadores</span>
          <em>{totalPlayers}</em>
        </NavLink>
        <NavLink to="/clubes" end className="nav-item">
          <Shield size={18} />
          <span>Clubes</span>
          <em>{clubs.length}</em>
        </NavLink>

        <div className="nav-section">Liga</div>
        <NavLink to="/partidas" className="nav-item">
          <Swords size={18} />
          <span>Partidas</span>
        </NavLink>
        <NavLink to="/classificacao" className="nav-item">
          <ListOrdered size={18} />
          <span>Classificação</span>
        </NavLink>

        <div className="nav-section with-action">
          <span>Clubes</span>
          <button className="icon-btn" onClick={openCreateClub} aria-label="Novo clube">
            <Plus size={16} />
          </button>
        </div>
        {clubs.map((c) => (
          <NavLink key={c.id} to={`/clubes/${c.id}`} className="nav-item club-item">
            <span className="club-tile">{c.name[0]}</span>
            <span>{c.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="info-row">
          <div className="info-icon">
            <Trophy size={16} />
          </div>
          <div>
            <strong>Liga Fictícia 2026</strong>
            <span className="muted">
              {clubs.length} clubes · {totalPlayers} jogadores
            </span>
          </div>
        </div>
        <div className="info-row">
          <div className="info-icon">
            <Swords size={16} />
          </div>
          <div>
            <strong>Última partida</strong>
            <span className="muted">
              {lastMatch
                ? `${lastMatch.home.club_name} ${lastMatch.home.goals} × ${lastMatch.away.goals} ${lastMatch.away.club_name}`
                : 'Nenhuma partida ainda'}
            </span>
          </div>
        </div>
        <div className="tz">
          <Clock size={14} /> Horário de Brasília (UTC−3)
        </div>
      </div>
    </aside>
  );
}