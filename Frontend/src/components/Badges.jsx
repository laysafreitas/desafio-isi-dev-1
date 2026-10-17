import { CONDITION_LABEL } from '../lib/constants';
import { agilityTone, avatarColors, initials } from '../lib/format';

export function ConditionBadge({ condition }) {
  const cls = condition === 'APTO' ? 'ok' : condition === 'MAL_CONDICIONADO' ? 'warn' : 'bad';
  return (
    <span className={`badge ${cls}`}>
      <i className="dot" />
      {CONDITION_LABEL[condition]}
    </span>
  );
}

export function PositionTag({ position }) {
  return <span className="tag">{position}</span>;
}

export function Avatar({ player, size = 36 }) {
  const { bg, fg } = avatarColors(player.id);
  return (
    <div className="avatar" style={{ width: size, height: size, background: bg, color: fg, fontSize: size * 0.34 }}>
      {initials(player.name)}
    </div>
  );
}

export function AgilityBar({ value }) {
  return (
    <div className="agility">
      <span>{value}</span>
      <div className="agility-track">
        <div className={`agility-fill ${agilityTone(value)}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  );
}

export function AttributeBar({ label, value, potential }) {
  return (
    <div className="attr-row">
      <span>{label}</span>
      <div className="attr-track">
        <div className="attr-potential" style={{ width: `${(potential / 99) * 100}%` }} />
        <div className="attr-value" style={{ width: `${(value / 99) * 100}%` }} />
      </div>
      <strong>{value}</strong>
    </div>
  );
}