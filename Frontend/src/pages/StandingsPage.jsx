import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ListOrdered, Plus, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';
import { fmtDateTime } from '../lib/format';

export function StandingsPage() {
  const { version, notify } = useApp();
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.standings(),
      api.listMatches ? api.listMatches() : Promise.resolve([]),
    ])
      .then(([standingsData, matchesData]) => {
        setRows(standingsData || []);
        const sortedMatches = Array.isArray(matchesData)
          ? [...matchesData].sort((a, b) => new Date(b.played_at) - new Date(a.played_at)).slice(0, 2)
          : [];
        setRecentMatches(sortedMatches);
      })
      .catch((e) => notify('error', 'Falha ao carregar a classificação', e.message))
      .finally(() => setLoading(false));
  }, [version, notify]);

  return (
    <div className="page">
      <header className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="page-icon">
            <ListOrdered size={22} />
          </div>
          <div>
            <h1>Classificação</h1>
            <p className="muted">Todos os clubes, com 3 pontos por vitória e 1 por empate.</p>
          </div>
        </div>
        <button className="btn primary" onClick={() => navigate('/partidas')}>
          <Plus size={16} /> Nova partida
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start', marginTop: '20px' }}>
        
        <section className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '50px', textAlign: 'center' }}>#</th>
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
                {loading && (
                  <tr><td colSpan={10} className="empty">Carregando classificação…</td></tr>
                )}
                {!loading && rows.length === 0 && (
                  <tr><td colSpan={10} className="empty">Sem clubes cadastrados.</td></tr>
                )}
                {!loading && rows.map((r, index) => {
                  const isLeader = index === 0;
                  // Formatação amigável do saldo de gols (+2, 0, -1)
                  const formattedSG = r.goal_difference > 0 ? `+${r.goal_difference}` : r.goal_difference;

                  return (
                    <tr key={r.club_id || index}>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '26px',
                          height: '26px',
                          borderRadius: '6px',
                          fontWeight: 'bold',
                          fontSize: '13px',
                          backgroundColor: isLeader ? '#2563eb' : '#f1f5f9',
                          color: isLeader ? '#ffffff' : '#475569'
                        }}>
                          {r.position || index + 1}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{
                            padding: '2px 6px',
                            background: '#f1f5f9',
                            color: '#475569',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase'
                          }}>
                            {r.acronym || (r.club_name ? r.club_name.substring(0, 3) : 'CLU')}
                          </span>
                          <Link to={`/clubes/${r.club_id}`} style={{ fontWeight: '600', color: '#0f172a', textDecoration: 'none' }}>
                            {r.club_name}
                          </Link>
                        </div>
                      </td>

                      <td className="num">{r.played}</td>
                      <td className="num">{r.wins}</td>
                      <td className="num">{r.draws}</td>
                      <td className="num">{r.losses}</td>
                      <td className="num">{r.goals_for}</td>
                      <td className="num">{r.goals_against}</td>
                      <td className="num">{formattedSG}</td>
                      <td className="num"><strong>{r.points}</strong></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9', color: '#94a3b8', fontSize: '12px' }}>
            J: jogos · V: vitórias · E: empates · D: derrotas · GP: gols marcados · GC: gols sofridos · SG: saldo de gols · Pts: pontos
          </div>
        </section>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <section className="card pad" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>Últimas partidas</h3>
            <p className="muted" style={{ fontSize: '13px', marginBottom: '16px' }}>Da mais recente para a mais antiga.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {recentMatches.length === 0 ? (
                <p className="muted" style={{ fontSize: '13px' }}>Nenhuma partida jogada ainda.</p>
              ) : (
                recentMatches.map((m) => (
                  <div key={m.id} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>
                      {fmtDateTime(m.played_at)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '14px', fontWeight: '500' }}>
                      <span>{m.home?.club_name || m.home_club_name}</span>
                      <span style={{ background: '#f8fafc', padding: '2px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px', border: '1px solid #e2e8f0' }}>
                        {m.home?.goals ?? m.home_goals} × {m.away?.goals ?? m.away_goals}
                      </span>
                      <span>{m.away?.club_name || m.away_club_name}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <Link to="/partidas" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '16px', color: '#2563eb', fontWeight: '600', fontSize: '13px', textDecoration: 'none' }}>
              Ver todas as partidas <ArrowRight size={14} />
            </Link>
          </section>

          <section className="card pad" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>Ordem da tabela</h3>
            <p className="muted" style={{ fontSize: '13px', marginBottom: '16px' }}>Critérios de classificação, nesta ordem.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                'Mais pontos',
                'Maior saldo de gols',
                'Mais gols marcados',
                'Nome do clube, de A a Z',
              ].map((criterio, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#334155', fontWeight: '500' }}>
                  <span style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: '#f1f5f9',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}>
                    {idx + 1}
                  </span>
                  <span>{criterio}</span>
                </div>
              ))}
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}