import { useEffect, useState } from 'react';
import { Play, Swords } from 'lucide-react';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';
import { fmtDateTime } from '../lib/format';
import { Modal } from '../components/Modal';

const ATTR_LABEL = {
  finalizacao: 'Finalização',
  passe: 'Passe',
  drible: 'Drible',
  defesa: 'Defesa',
};

export function MatchesPage() {
  const { clubs, version, refresh, notify } = useApp();
  const [matches, setMatches] = useState([]);
  const [home, setHome] = useState('');
  const [away, setAway] = useState('');
  const [busy, setBusy] = useState(false);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    api.listMatches().then(setMatches).catch((e) => notify('error', 'Falha ao listar partidas', e.message));
  }, [version, notify]);

  async function play() {
    if (!home || !away) return notify('error', 'Escolha os dois clubes');
    if (home === away) return notify('error', 'Os clubes precisam ser diferentes');
    setBusy(true);
    try {
      const m = await api.playMatch(Number(home), Number(away));
      notify('success', 'Partida jogada', `${m.home.club_name} ${m.home.goals} × ${m.away.goals} ${m.away.club_name}`);
      await refresh();
      setDetail(m);
    } catch (e) {
      notify('error', 'Não foi possível jogar', e.message);
    } finally {
      setBusy(false);
    }
  }

  async function open(id) {
    try {
      setDetail(await api.getMatch(id));
    } catch (e) {
      notify('error', 'Falha ao abrir a partida', e.message);
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
                <tr key={m.id} className="clickable" onClick={() => open(m.id)}>
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

      {detail && (
        <Modal
          title={`${detail.home.club_name} ${detail.home.goals} × ${detail.away.goals} ${detail.away.club_name}`}
          description={`${fmtDateTime(detail.played_at)} · ${detail.home.formation} vs ${detail.away.formation}`}
          onClose={() => setDetail(null)}
          width={680}
          footer={<button className="btn" onClick={() => setDetail(null)}>Fechar</button>}
        >
          <div className="duels">
            {(detail.duels ?? []).map((d) => (
              <div key={d.order} className={`duel ${d.goal ? 'goal' : ''}`}>
                <span className="duel-n">{d.order}</span>
                <div>
                  <strong>{d.attacker.player_name}</strong>
                  <small className="muted">
                    {d.attacker.position} · {ATTR_LABEL[d.attacker.attribute] ?? d.attacker.attribute}
                  </small>
                </div>
                <div className="duel-vals">
                  <b>{d.attacker.value}</b> <span className="muted">×</span> <b>{d.defender.value}</b>
                </div>
                <div className="right">
                  <strong>{d.defender.player_name}</strong>
                  <small className="muted">
                    {d.defender.position} · {ATTR_LABEL[d.defender.attribute] ?? d.defender.attribute}
                  </small>
                </div>
                <span className={`badge ${d.goal ? 'ok' : 'bad'}`}>{d.goal ? 'Gol' : 'Defendeu'}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}