const money = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtMoney = (n) => money.format(Number(n ?? 0));

export function initials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

const AVATARS = [
  ['#f1f1f3', '#52525b'],
  ['#fde7f1', '#be185d'],
  ['#d9f7f3', '#0f766e'],
  ['#ede9fe', '#6d28d9'],
  ['#e0f2fe', '#0369a1'],
  ['#fef3c7', '#b45309'],
];

export function avatarColors(id) {
  const [bg, fg] = AVATARS[Math.abs(id) % AVATARS.length];
  return { bg, fg };
}

export function agilityTone(v) {
  if (v <= 30) return 'low';
  if (v >= 80) return 'high';
  return 'mid';
}

export function fmtDateTime(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function fmtDate(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

export function normalizePlayer(r) {
  const pick = (a, b) => (r[a] !== undefined ? r[a] : r[b]);
  return {
    id: r.id,
    name: pick('name', 'nome'),
    position: pick('position', 'posicao'),
    agility: Number(pick('agility', 'agilidade')),
    age: Number(pick('age', 'idade')),
    condition: pick('condition', 'condicao'),
    base_value: Number(r.base_value ?? r.valor_base ?? 0),
    market_value: Number(r.market_value ?? 0),
    pace: Number(pick('pace', 'velocidade')),
    shooting: Number(pick('shooting', 'finalizacao')),
    passing: Number(pick('passing', 'passe')),
    dribbling: Number(pick('dribbling', 'drible')),
    defending: Number(pick('defending', 'defesa')),
    physical: Number(pick('physical', 'fisico')),
    potential: Number(pick('potential', 'potencial')),
    overall: Number(r.overall ?? 0),
    club_id: r.club_id !== undefined ? r.club_id : r.clube_id ?? null,
    contract: r.contract ?? null,
  };
}

export function addDaysISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}