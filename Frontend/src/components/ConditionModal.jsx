import { useState } from 'react';
import { Lock } from 'lucide-react';
import { Modal } from './Modal';
import { Avatar, ConditionBadge } from './Badges';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';
import { CONDITION_LABEL, POSITION_LABEL } from '../lib/constants';
import { fmtMoney } from '../lib/format';

const OPTIONS = [
  { value: 'APTO', desc: 'Sem desconto por condição.' },
  { value: 'MAL_CONDICIONADO', desc: 'Desconto de 15%. Agilidade de 80 a 100 corta pela metade; de 1 a 30 soma 10 pontos.' },
  { value: 'DOENTE', desc: 'Desconto de 30%, com o mesmo ajuste de agilidade.' },
];

export function ConditionModal({ player, onClose }) {
  const { refresh, notify } = useApp();
  const [selected, setSelected] = useState(player.condition);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const blocked = (c) => player.condition === 'DOENTE' && c === 'APTO';

  async function submit() {
    if (selected === player.condition) return onClose();
    setBusy(true);
    setError('');
    try {
      const updated = await api.changeCondition(player.id, selected);
      notify(
        'success',
        'Condição alterada',
        `${updated.name} agora está ${CONDITION_LABEL[updated.condition]}. Valor de mercado: ${fmtMoney(updated.market_value)}.`,
      );
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
      title="Alterar condição física"
      description="A condição muda o desconto do valor de mercado, recalculado ao salvar."
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn primary" disabled={busy} onClick={submit}>
            {busy ? 'Salvando…' : 'Salvar condição'}
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
        <ConditionBadge condition={player.condition} />
      </div>

      <div className="radio-list">
        {OPTIONS.map((o) => {
          const disabled = blocked(o.value);
          return (
            <label key={o.value} className={`radio-card ${selected === o.value ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}>
              <input type="radio" name="cond" disabled={disabled} checked={selected === o.value} onChange={() => setSelected(o.value)} />
              <div>
                <strong>
                  {CONDITION_LABEL[o.value]}
                  {player.condition === o.value && <span className="chip">Atual</span>}
                </strong>
                <p className="muted">{o.desc}</p>
                {disabled && (
                  <p className="muted lock-hint">
                    <Lock size={12} /> De Doente não passa direto para Apto.
                  </p>
                )}
              </div>
            </label>
          );
        })}
      </div>
      {player.club_id && selected === 'DOENTE' && (
        <p className="muted">Ao ficar doente, o jogador sai automaticamente da escalação do clube.</p>
      )}
      {error && <p className="form-error">{error}</p>}
    </Modal>
  );
}