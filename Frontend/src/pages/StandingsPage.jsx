import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ListOrdered } from 'lucide-react';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';

export function StandingsPage() {
  const { version, notify } = useApp();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api.standings().then(setRows).catch((e) => notify('error', 'Falha ao carregar a classificação', e.message));
  }, [version, notify]);

  return (
    <div className="page">
      <header className="page-head">
        <div className="page-icon">
          <ListOrdered size={22} />
        </div>
        <div>
          <h1>Classificação</h1>
          <p className="muted">Pontos, saldo de gols, gols marcados e ordem alfabética, nessa ordem de desempate.</p>
        </div>
      </header>

      <section className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Clube</th>
                <th className="num">J</th>
                <th className="num">V</th>
                <th className="num">E</th>
                <th className="num">D</th>
                <th className="num">GP</th>
                <th className="num">GC</th>
                <th className="num">SG</th>
                <th className="num">Pts</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={10} className="empty">Sem clubes cadastrados.</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.club_id}>
                  <td><strong>{r.position}</strong></td>
                  <td><Link to={`/clubes/${r.club_id}`}>{r.club_name}</Link></td>
                  <td className="num">{r.played}</td>
                  <td className="num">{r.wins}</td>
                  <td className="num">{r.draws}</td>
                  <td className="num">{r.losses}</td>
                  <td className="num">{r.goals_for}</td>
                  <td className="num">{r.goals_against}</td>
                  <td className="num">{r.goal_difference}</td>
                  <td className="num"><strong>{r.points}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}