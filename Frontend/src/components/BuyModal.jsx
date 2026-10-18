import { useMemo, useState } from 'react';
import { ShoppingCart, CheckCircle2 } from 'lucide-react';
import { Modal } from './Modal';
import { Avatar } from './Badges';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';
import { fmtMoney, fmtDateTime } from '../lib/format';
import { POSITION_LABEL } from '../lib/constants';

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

export function BuyModal({ player, onClose }) {
  const { clubs, refresh, notify } = useApp();
  const [clubId, setClubId] = useState(clubs[0] ? String(clubs[0].id) : '');
  // Define o valor padrão no formato AAAA-MM-DDTHH:mm (datetime-local)
  const [loyaltyDateTime, setLoyaltyDateTime] = useState('2027-11-12T15:00');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null); 

  const club = clubs.find((c) => String(c.id) === clubId);

  const calc = useMemo(() => {
    const fee = player.market_value > 30 ? round2(player.market_value * 0.05) : 0;
    const total = round2(player.market_value + fee);
    const limit = club ? round2(club.cash * 0.5) : 0;
    return { fee, total, limit, ok: club ? total <= limit : false };
  }, [player, club]);

  async function submit() {
    if (!club) return setError('Escolha um clube.');
    if (!loyaltyDateTime) return setError('Informe a data e horário de fidelidade.');
    
    const selectedTime = new Date(loyaltyDateTime).getTime();
    if (isNaN(selectedTime) || selectedTime <= Date.now()) {
      return setError('A data de fidelidade deve ser futura.');
    }

    setBusy(true);
    setError('');

    try {
      const loyalty = new Date(loyaltyDateTime).toISOString().slice(0, 19).replace('T', ' ');
      
      const res = await api.buyPlayer(player.id, club.id, loyalty);
      
      setReceipt({
        playerName: player.name,
        clubName: club.name,
        value: player.market_value,
        fee: calc.fee,
        totalCost: calc.total,
        newCash: res.club_cash ?? (club.cash - calc.total),
        loyaltyUntil: loyaltyDateTime,
      });

      notify('success', 'Contratação concluída', `${player.name} agora é do ${club.name}.`);
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (receipt) {
    return (
      <Modal
        title=""
        onClose={onClose}
        footer={
          <button className="btn primary full-width" onClick={onClose}>
            Fechar
          </button>
        }
      >
        <div className="receipt-container" style={{ textAlign: 'center', padding: '8px 0' }}>
          <div style={{ color: '#16a34a', display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
            <CheckCircle2 size={48} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 4px 0' }}>Compra concluída</h2>
          <p className="muted" style={{ fontSize: '14px', marginBottom: '20px' }}>
            {receipt.playerName} agora é do <strong>{receipt.clubName}</strong>.
          </p>

          <dl className="summary" style={{ textAlign: 'left', background: '#f9fafb', padding: '16px', borderRadius: '12px' }}>
            <div>
              <dt>Valor</dt>
              <dd>{fmtMoney(receipt.value)}</dd>
            </div>
            <div>
              <dt>Taxa</dt>
              <dd>{fmtMoney(receipt.fee)}</dd>
            </div>
            <div className="total" style={{ borderTop: '1px solid #e5e7eb', paddingTop: '8px' }}>
              <dt>Custo total</dt>
              <dd>{fmtMoney(receipt.totalCost)}</dd>
            </div>
            <div>
              <dt>Fim da fidelidade</dt>
              <dd>{fmtDateTime(receipt.loyaltyUntil)}</dd>
            </div>
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '8px' }}>
              <dt style={{ color: '#2563eb', fontWeight: 'bold' }}>Novo caixa do {receipt.clubName}</dt>
              <dd style={{ color: '#2563eb', fontWeight: 'bold' }}>{fmtMoney(receipt.newCash)}</dd>
            </div>
          </dl>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title="Comprar jogador"
      description="Escolha o clube comprador e até quando vai a fidelidade do contrato."
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn primary" disabled={busy || !club || !calc.ok} onClick={submit}>
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
        <span>Clube comprador</span>
        <select value={clubId} onChange={(e) => setClubId(e.target.value)}>
          {clubs.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} — caixa {fmtMoney(c.cash)}
            </option>
          ))}
        </select>
        <small className="muted">Caixa atual: {fmtMoney(club?.cash || 0)}. Custo até 50% do caixa.</small>
      </label>

      <label className="field">
        <span>Fim da fidelidade</span>
        <input
          type="datetime-local"
          value={loyaltyDateTime}
          onChange={(e) => setLoyaltyDateTime(e.target.value)}
        />
        <small className="muted">Depois do momento da compra e até 1.095 dias. Horário de Brasília (-03:00).</small>
      </label>

      <dl className="summary">
        <div>
          <dt>Valor de mercado</dt>
          <dd>{fmtMoney(player.market_value)}</dd>
        </div>
        <div>
          <dt>Taxa (5% se acima de 30,00)</dt>
          <dd>{fmtMoney(calc.fee)}</dd>
        </div>
        <div className="total">
          <dt>Custo total</dt>
          <dd>{fmtMoney(calc.total)}</dd>
        </div>
      </dl>

      {club && !calc.ok && (
        <p className="form-error">O custo total ({fmtMoney(calc.total)}) excede 50% do caixa do clube ({fmtMoney(calc.limit)}).</p>
      )}
      {error && <p className="form-error">{error}</p>}
    </Modal>
  );
}