import React from 'react';
import '../styles/MatchTacticalPitch.css';

export function MatchTacticalPitch({ homeClub, awayClub, homeLineup, awayLineup }) {
  const getHomeCoords = (formation, index) => {
    if (index === 0) return { left: '8%', top: '50%' }; 

    if (formation === '2-1-1') {
      if (index === 1) return { left: '22%', top: '30%' }; 
      if (index === 2) return { left: '22%', top: '70%' }; 
      if (index === 3) return { left: '34%', top: '50%' }; 
      if (index === 4) return { left: '44%', top: '50%' }; 
    } else if (formation === '3-1') {
      if (index === 1) return { left: '22%', top: '20%' };
      if (index === 2) return { left: '22%', top: '50%' };
      if (index === 3) return { left: '22%', top: '80%' };
      if (index === 4) return { left: '40%', top: '50%' };
    } else if (formation === '2-2') {
      if (index === 1) return { left: '22%', top: '30%' };
      if (index === 2) return { left: '22%', top: '70%' };
      if (index === 3) return { left: '40%', top: '35%' };
      if (index === 4) return { left: '40%', top: '65%' };
    } else if (formation === '1-2-1') {
      if (index === 1) return { left: '18%', top: '50%' };
      if (index === 2) return { left: '30%', top: '30%' };
      if (index === 3) return { left: '30%', top: '70%' };
      if (index === 4) return { left: '42%', top: '50%' };
    }
    return { left: `${10 + index * 8}%`, top: '50%' };
  };

  const getAwayCoords = (formation, index) => {
    if (index === 0) return { left: '92%', top: '50%' };

    if (formation === '2-1-1') {
      if (index === 1) return { left: '78%', top: '30%' };
      if (index === 2) return { left: '78%', top: '70%' };
      if (index === 3) return { left: '66%', top: '50%' };
      if (index === 4) return { left: '56%', top: '50%' };
    } else if (formation === '3-1') {
      if (index === 1) return { left: '78%', top: '20%' };
      if (index === 2) return { left: '78%', top: '50%' };
      if (index === 3) return { left: '78%', top: '80%' };
      if (index === 4) return { left: '60%', top: '50%' };
    } else if (formation === '2-2') {
      if (index === 1) return { left: '78%', top: '30%' };
      if (index === 2) return { left: '78%', top: '70%' };
      if (index === 3) return { left: '60%', top: '35%' };
      if (index === 4) return { left: '60%', top: '65%' };
    } else if (formation === '1-2-1') {
      if (index === 1) return { left: '82%', top: '50%' };
      if (index === 2) return { left: '70%', top: '30%' };
      if (index === 3) return { left: '70%', top: '70%' };
      if (index === 4) return { left: '58%', top: '50%' };
    }
    return { left: `${90 - index * 8}%`, top: '50%' };
  };

  const homeStarters = homeLineup?.starters || [];
  const awayStarters = awayLineup?.starters || [];

  return (
    <div className="match-pitch-wrapper horizontal">
      <div className="match-pitch-head">
        <span className="team-tag home">{homeClub?.name} ({homeLineup?.formation || '2-1-1'})</span>
        <span className="vs-badge">VS</span>
        <span className="team-tag away">{awayClub?.name} ({awayLineup?.formation || '2-1-1'})</span>
      </div>

      <div className="match-pitch-container horizontal">
        <div className="match-pitch-field horizontal">
          <div className="pitch-line center-line-vert"></div>
          <div className="pitch-circle center-circle"></div>
          <div className="pitch-area goal-left"></div>
          <div className="pitch-area goal-right"></div>

          {homeStarters.map((p, idx) => {
            const coords = getHomeCoords(homeLineup?.formation || '2-1-1', idx);
            const isMal = p.condition === 'MAL_CONDICIONADO';
            return (
              <div key={`home-${p.id || idx}`} className="match-player-node home" style={{ top: coords.top, left: coords.left }}>
                <div className={`match-avatar home ${isMal ? 'warn' : ''}`}>
                  {p.name ? p.name.charAt(0) : 'H'}
                </div>
                <div className="match-info">
                  <span className="p-name">{p.name ? p.name.split(' ')[0] : 'Titular'}</span>
                  <span className="p-pos">{p.position}</span>
                </div>
                {isMal && <span className="warn-icon">⚠️</span>}
              </div>
            );
          })}

          {awayStarters.map((p, idx) => {
            const coords = getAwayCoords(awayLineup?.formation || '2-1-1', idx);
            const isMal = p.condition === 'MAL_CONDICIONADO';
            return (
              <div key={`away-${p.id || idx}`} className="match-player-node away" style={{ top: coords.top, left: coords.left }}>
                <div className={`match-avatar away ${isMal ? 'warn' : ''}`}>
                  {p.name ? p.name.charAt(0) : 'A'}
                </div>
                <div className="match-info">
                  <span className="p-name">{p.name ? p.name.split(' ')[0] : 'Titular'}</span>
                  <span className="p-pos">{p.position}</span>
                </div>
                {isMal && <span className="warn-icon">⚠️</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}