import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Swords } from 'lucide-react';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';
import { fmtDateTime } from '../lib/format';
import { MatchTacticalPitch } from '../components/MatchTacticalPitch';

export function MatchesPage() {
  const { clubs, version, refresh, notify } = useApp();
  const navigate = useNavigate();

  const [matches, setMatches] = useState([]);
  const [home, setHome] = useState('');
  const [away, setAway] = useState('');
  const [busy, setBusy] = useState(false);

  // Estados da prévia de escalação antes do jogo
  const [homeClubData, setHomeClubData] = useState(null);
  const [awayClubData, setAwayClubData] = useState(null);
  const [homeLineup, setHomeLineup] = useState(null);
  const [awayLineup, setAwayLineup] = useState(null);

  useEffect(() => {
    api.listMatches().then(setMatches).catch((e) => notify('error', 'Falha ao listar partidas', e.message));
  }, [version, notify]);
  useEffect(() => {
    if (!home) {
      setHomeClubData(null);
      setHomeLineup(null);
      return;
    }
    Promise.all([api.getClub(Number(home)), api.getLineup(Number(home))])
      .then(([club, lineup]) => {
        setHomeClubData(club);
        setHomeLineup(lineup);
      })
      .catch(() => undefined);
  }, [home]);

  useEffect(() => {
    if (!away) {
      setAwayClubData(null);
      setAwayLineup(null);
      return;
    }
    Promise.all([api.getClub(Number(away)), api.getLineup(Number(away))])
      .then(([club, lineup]) => {
        setAwayClubData(club);
        setAwayLineup(lineup);
      })
      .catch(() => undefined);
  }, [away]);

  const previewHomeStarters = useMemo(() => {
    if (!homeClubData || !homeLineup?.player_ids) return [];
    return homeClubData.players.filter((p) => homeLineup.player_ids.includes(p.id));
  }, [homeClubData, homeLineup]);

  const previewAwayStarters = useMemo(() => {
    if (!awayClubData || !awayLineup?.player_ids) return [];
    return awayClubData.players.filter((p) => awayLineup.player_ids.includes(p.id));
  }, [awayClubData, awayLineup]);

  async function play() {
    if (!home || !away) return notify('error', 'Escolha os dois clubes');
    if (home === away) return notify('error', 'Os clubes precisam ser diferentes');
    setBusy(true);
    try {
      const m = await api.playMatch(Number(home), Number(away));
      await refresh();
      navigate(`/partidas/${m.id}`);
    } catch (e) {
      notify('error', 'Não foi possível jogar', e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <header className="page-head">
        <div className="page-icon">
          <Swords size={22} />
        </div>
        <div>
          <h1>Partidas</h1>
          <p className="muted">Os dois clubes precisam ter escalação completa para jogar.</p>
        </div>
      </header>

      <section className="card pad">
        <div className="play-form">
          <label className="field">
            <span>Mandante</span>
            <select value={home} onChange={(e) => setHome(e.target.value)}>
              <option value="">Selecione…</option>
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <span className="vs">×</span>
          <label className="field">
            <span>Visitante</span>
            <select value={away} onChange={(e) => setAway(e.target.value)}>
              <option value="">Selecione…</option>
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <button className="btn primary" disabled={busy} onClick={play}>
            <Play size={16} /> {busy ? 'Jogando…' : 'Jogar partida'}
          </button>
        </div>

        {homeClubData && awayClubData && home !== away && (
          <div style={{ marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
            <h4 style={{ textAlign: 'center', marginBottom: '16px' }}>Prévia do Confronto</h4>
            <MatchTacticalPitch
              homeClub={homeClubData}
              awayClub={awayClubData}
              homeLineup={{ formation: homeLineup?.formation || '2-1-1', starters: previewHomeStarters }}
              awayLineup={{ formation: awayLineup?.formation || '2-1-1', starters: previewAwayStarters }}
            />
          </div>
        )}
      </section>

      <section className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Mandante</th>
                <th className="center">Placar</th>
                <th>Visitante</th>
                <th>Resultado</th>
              </tr>
            </thead>
            <tbody>
              {matches.length === 0 && (
                <tr><td colSpan={5} className="empty">Nenhuma partida jogada ainda.</td></tr>
              )}
              {matches.map((m) => (
                <tr key={m.id} className="clickable" onClick={() => navigate(`/partidas/${m.id}`)}>
                  <td className="muted">{fmtDateTime(m.played_at)}</td>
                  <td><strong>{m.home.club_name}</strong> <span className="muted">{m.home.formation}</span></td>
                  <td className="center score">{m.home.goals} × {m.away.goals}</td>
                  <td><strong>{m.away.club_name}</strong> <span className="muted">{m.away.formation}</span></td>
                  <td>
                    <span className={`badge ${m.result === 'EMPATE' ? 'warn' : 'ok'}`}>
                      {m.result === 'EMPATE' ? 'Empate' : m.result === 'MANDANTE' ? 'Vitória do mandante' : 'Vitória do visitante'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}