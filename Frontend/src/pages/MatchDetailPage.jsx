import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';
import { fmtDateTime } from '../lib/format';
import { MatchTacticalPitch } from '../components/MatchTacticalPitch';

const ATTR_LABEL = {
  finalizacao: 'Finalização',
  passe: 'Passe',
  drible: 'Drible',
  defesa: 'Defesa',
};

export function MatchDetailPage() {
  const { id } = useParams();
  const matchId = Number(id);
  const { notify } = useApp();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getMatch(matchId)
      .then(setDetail)
      .catch((e) => notify('error', 'Falha ao carregar detalhes da partida', e.message))
      .finally(() => setLoading(false));
  }, [matchId, notify]);

  const detailPitchData = useMemo(() => {
    if (!detail || !detail.duels) return null;

    const homeStartersMap = new Map();
    const awayStartersMap = new Map();

    detail.duels.forEach((d) => {
      if (d.attacker.club_id === detail.home.club_id) {
        if (!homeStartersMap.has(d.attacker.player_id)) {
          homeStartersMap.set(d.attacker.player_id, {
            id: d.attacker.player_id,
            name: d.attacker.player_name,
            position: d.attacker.position,
            condition: d.attacker.condition,
          });
        }
      } else {
        if (!awayStartersMap.has(d.attacker.player_id)) {
          awayStartersMap.set(d.attacker.player_id, {
            id: d.attacker.player_id,
            name: d.attacker.player_name,
            position: d.attacker.position,
            condition: d.attacker.condition,
          });
        }
      }

      if (d.defender.club_id === detail.home.club_id) {
        if (!homeStartersMap.has(d.defender.player_id)) {
          homeStartersMap.set(d.defender.player_id, {
            id: d.defender.player_id,
            name: d.defender.player_name,
            position: d.defender.position,
            condition: d.defender.condition,
          });
        }
      } else {
        if (!awayStartersMap.has(d.defender.player_id)) {
          awayStartersMap.set(d.defender.player_id, {
            id: d.defender.player_id,
            name: d.defender.player_name,
            position: d.defender.position,
            condition: d.defender.condition,
          });
        }
      }
    });

    return {
      homeClub: { name: detail.home.club_name },
      awayClub: { name: detail.away.club_name },
      homeLineup: { formation: detail.home.formation, starters: Array.from(homeStartersMap.values()) },
      awayLineup: { formation: detail.away.formation, starters: Array.from(awayStartersMap.values()) },
    };
  }, [detail]);

  if (loading) return <div className="page muted">Carregando detalhes da partida…</div>;
  if (!detail) {
    return (
      <div className="page">
        <p>Partida não encontrada.</p>
        <Link to="/partidas" className="back"><ArrowLeft size={16} /> Voltar para partidas</Link>
      </div>
    );
  }

  return (
    <div className="page">
      <Link to="/partidas" className="back">
        <ArrowLeft size={16} /> Voltar para Partidas
      </Link>

      <header className="page-head score-header" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <p className="muted" style={{ marginBottom: '8px' }}>{fmtDateTime(detail.played_at)}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '28px', fontWeight: 'bold' }}>
          <span>{detail.home.club_name}</span>
          <span style={{ background: '#1e293b', color: '#fff', padding: '6px 18px', borderRadius: '12px', fontSize: '32px' }}>
            {detail.home.goals} × {detail.away.goals}
          </span>
          <span>{detail.away.club_name}</span>
        </div>
        <div style={{ marginTop: '12px' }}>
          <span className={`badge ${detail.result === 'EMPATE' ? 'warn' : 'ok'}`}>
            {detail.result === 'EMPATE' ? 'Empate' : detail.result === 'MANDANTE' ? `Vitória do ${detail.home.club_name}` : `Vitória do ${detail.away.club_name}`}
          </span>
        </div>
      </header>

      <section className="card pad" style={{ marginTop: '20px' }}>
        <h3 style={{ marginBottom: '16px' }}>Resumo dos Duelos</h3>
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
      </section>

      {detailPitchData && (
        <section className="card pad" style={{ marginTop: '20px' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '16px' }}>Disposição Tática das Equipes</h3>
          <MatchTacticalPitch
            homeClub={detailPitchData.homeClub}
            awayClub={detailPitchData.awayClub}
            homeLineup={detailPitchData.homeLineup}
            awayLineup={detailPitchData.awayLineup}
          />
        </section>
      )}
    </div>
  );
}