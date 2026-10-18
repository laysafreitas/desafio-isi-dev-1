import React from 'react';
import '../styles/TacticalPitch.css';

export function TacticalPitch({ formation = '2-1-1', starters = [], reserves = [] }) {
  const getCoordinates = (form, index) => {
    if (index === 0) return { top: '80%', left: '50%' };


    if (form === '2-1-1') {
      if (index === 1) return { top: '58%', left: '30%' };
      if (index === 2) return { top: '58%', left: '70%' };
      if (index === 3) return { top: '38%', left: '50%' };
      if (index === 4) return { top: '18%', left: '50%' };
    } else if (form === '3-1') {
      if (index === 1) return { top: '58%', left: '20%' };
      if (index === 2) return { top: '58%', left: '50%' };
      if (index === 3) return { top: '58%', left: '80%' };
      if (index === 4) return { top: '25%', left: '50%' };
    } else if (form === '2-2') {
      if (index === 1) return { top: '58%', left: '30%' };
      if (index === 2) return { top: '58%', left: '70%' };
      if (index === 3) return { top: '25%', left: '35%' };
      if (index === 4) return { top: '25%', left: '65%' };
    } else if (form === '1-2-1') {
      if (index === 1) return { top: '65%', left: '50%' };
      if (index === 2) return { top: '45%', left: '30%' };
      if (index === 3) return { top: '45%', left: '70%' };
      if (index === 4) return { top: '20%', left: '50%' };
    }

    return { top: `${20 + index * 15}%`, left: '50%' };
  };

  return (
    <div className="tactical-pitch-wrapper">
      <div className="tactical-pitch-container">
        <div className="pitch-field">
          <div className="pitch-center-line"></div>
          <div className="pitch-center-circle"></div>
          <div className="pitch-penalty-area-top"></div>
          <div className="pitch-penalty-area-bottom"></div>

          {starters.map((player, index) => {
            const coords = getCoordinates(formation, index);
            const isMalCondicionado = player.condition === 'MAL_CONDICIONADO';

            return (
              <div
                key={player.id || index}
                className="pitch-player-node"
                style={{ top: coords.top, left: coords.left }}
                title={`${player.name} (${player.position}) - ${player.condition}`}
              >
                <div className={`pitch-avatar ${isMalCondicionado ? 'warning-glow' : ''}`}>
                  {player.name ? player.name.charAt(0) : 'P'}
                </div>
                <div className="pitch-player-info">
                  <span className="pitch-player-name">{player.name ? player.name.split(' ')[0] : 'Jogador'}</span>
                  <span className="pitch-player-pos">{player.position}</span>
                </div>
                {isMalCondicionado && (
                  <span className="pitch-warning-badge" title="Mal-condicionado: -15% de eficácia">
                    ⚠️
                  </span>
                )}
              </div>
            );
          })}

          {starters.length === 0 && (
            <div className="pitch-empty-msg">Nenhum titular escalado no momento</div>
          )}
        </div>
      </div>

      <div className="bench-container">
        <div className="bench-header">
          <strong>Banco de Reservas</strong>
          <span className="bench-count">({reserves.length})</span>
        </div>
        <div className="bench-list">
          {reserves.length === 0 ? (
            <p className="bench-empty">Nenhum jogador no banco</p>
          ) : (
            reserves.map((player) => (
              <div key={player.id} className="bench-player-card">
                <div className="bench-avatar">{player.name ? player.name.charAt(0) : 'R'}</div>
                <div className="bench-player-details">
                  <span className="bench-name">{player.name}</span>
                  <span className="bench-pos">{player.position} · OVR {player.overall}</span>
                </div>
                {player.condition === 'MAL_CONDICIONADO' && <span className="bench-badge warn">⚠️</span>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}