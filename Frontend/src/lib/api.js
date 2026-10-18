import { normalizePlayer } from './format';

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333/api/v1';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, init = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    });
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor. Verifique se o backend está rodando.', 0);
  }

  if (res.status === 204) return undefined;

  let body = null;
  try {
    body = await res.json();
  } catch {
    /* sem corpo JSON */
  }

  if (!res.ok) {
    throw new ApiError(body?.message ?? `Erro ${res.status}`, res.status);
  }
  return body;
}

const qs = (params) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
};

export const api = {
  async listPlayers(q = {}) {
    const r = await request(`/players${qs(q)}`);
    return { data: r.data.map(normalizePlayer), meta: r.meta };
  },
  async getPlayer(id) {
    return normalizePlayer(await request(`/players/${id}`));
  },
  async createPlayer(input) {
    return normalizePlayer(await request('/players', { method: 'POST', body: JSON.stringify(input) }));
  },
  async updatePlayer(id, input) {
    return normalizePlayer(await request(`/players/${id}`, { method: 'PUT', body: JSON.stringify(input) }));
  },
  async changeCondition(id, condition) {
    return normalizePlayer(
      await request(`/players/${id}/condition`, { method: 'PATCH', body: JSON.stringify({ condition }) }),
    );
  },
  deletePlayer(id) {
    return request(`/players/${id}`, { method: 'DELETE' });
  },

  
  buyPlayer(id, club_id, loyalty_until) {
    return request(`/players/${id}/buy`, {
      method: 'POST',
      body: JSON.stringify({ club_id, loyalty_until }),
    });
  },
  sellPlayer(id) {
    return request(`/players/${id}/sell`, { method: 'POST', body: JSON.stringify({}) });
  },

  listClubs(sort) {
    return request(`/clubs${qs({ sort })}`);
  },
  createClub(name, acronym) {
    return request('/clubs', { method: 'POST', body: JSON.stringify({ name, acronym }) });
  },
  async getClub(id) {
    const r = await request(`/clubs/${id}`);
    return { ...r, players: r.players.map(normalizePlayer) };
  },
  listTransactions(clubId, type) {
    return request(`/clubs/${clubId}/transactions${qs({ type })}`);
  },

  
  async getLineup(clubId) {
    const r = await request(`/clubs/${clubId}/lineup`);
    return {
      club_id: r.club_id,
      formation: r.formation ?? null,
      complete: !!r.complete,
      player_ids: (r.players ?? []).map((p) => p.id),
    };
  },
  setLineup(clubId, formation, player_ids) {
    return request(`/clubs/${clubId}/lineup`, { method: 'PUT', body: JSON.stringify({ formation, player_ids }) });
  },

  listMatches(club_id) {
    return request(`/matches${qs({ club_id })}`);
  },
  getMatch(id) {
    return request(`/matches/${id}`);
  },
  playMatch(home_club_id, away_club_id) {
    return request('/matches', { method: 'POST', body: JSON.stringify({ home_club_id, away_club_id }) });
  },
  standings() {
    return request('/standings');
  },
};