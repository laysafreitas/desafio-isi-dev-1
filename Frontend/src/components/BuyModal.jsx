import { useMemo, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Modal } from './Modal';
import { Avatar } from './Badges';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';
import { addDaysISO, fmtMoney } from '../lib/format';
import { POSITION_LABEL } from '../lib/constants';

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

export function BuyModal({ player, onClose }) {
  const { clubs, refresh, notify } = useApp();
  const [clubId, setClubId] = useState(clubs[0] ? String(clubs[0].id) : '');
  const [until, setUntil] = useState(addDaysISO(365));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const club = clubs.find((c) => String(c.id) === clubId);
  const calc = useMemo(() => {
    const fee = player.market_value > 30 ? round2(player.market_value * 0.05) : 0;
    const total = round2(player.market_value + fee);
    const limit = club ? round2(club.cash * 0.5) : 0;
    return { fee, total, limit, ok: club ? total <= limit : false };
  }, [player, club]);

  async function submit() {
    if (!club) return setError('Escolha um clube.');
    if (!until) return setError('Informe até quando vale a fidelidade.');
    if (new Date(until).getTime() <= Date.now()) return setError('A data de fidelidade deve ser futura.');
    setBusy(true);
    setError('');
    try {
      // Fim do dia no horário de Brasília, enviado como "AAAA-MM-DD HH:MM:SS" (UTC)
      const loyalty = new Date(`${until}T23:59:59-03:00`).toISOString().slice(0, 19).replace('T', ' ');
      const r = await api.buyPlayer(player.id, club.id, loyalty);
      notify('success', 'Contratação concluída', `${r.player_name} agora é do ${club.name}. Caixa: ${fmtMoney(r.club_cash)}.`);
      await refresh();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title="Comprar jogador"
      description="O custo total (valor de mercado + taxa) não pode passar de 50% do caixa do clube."
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn primary" disabled={busy || !club} onClick={submit}>
            <ShoppingCart size={16} /> {busy ? 'Comprando…' : 'Confirmar compra'}
          </button>
        </>
      }
    >
      <div className="player-card">
        <Avatar player={player} />
        <div>
          <strong>{player.name}</strong>
          <span className="muted">
            {player.position} · {POSITION_LABEL[player.position]} · {player.age} anos
          </span>
        </div>
        <strong>{fmtMoney(player.market_value)}</strong>
      </div>

      <label className="field">
        <span>Clube</span>
        <select value={clubId} onChange={(e) => setClubId(e.target.value)}>
          {clubs.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} — caixa {fmtMoney(c.cash)}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Fidelidade até</span>
        <input type="date" value={until} onChange={(e) => setUntil(e.target.value)} />
        <small className="muted">Vender antes dessa data gera multa rescisória.</small>
      </label>

      <dl className="summary">
        <div>
          <dt>Valor de mercado</dt>
          <dd>{fmtMoney(player.market_value)}</dd>
        </div>
        <div>
          <dt>Taxa (5% acima de 30,00)</dt>
          <dd>{fmtMoney(calc.fee)}</dd>
        </div>
        <div className="total">
          <dt>Custo total</dt>
          <dd>{fmtMoney(calc.total)}</dd>
        </div>
        <div>
          <dt>Limite (50% do caixa)</dt>
          <dd className={calc.ok ? '' : 'neg'}>{fmtMoney(calc.limit)}</dd>
        </div>
      </dl>
      {club && !calc.ok && <p className="form-error">O custo total excede 50% do caixa do clube.</p>}
      {error && <p className="form-error">{error}</p>}
    </Modal>
  );
}