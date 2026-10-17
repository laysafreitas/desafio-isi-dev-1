import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { Avatar } from './Badges';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';
import { fmtDate, fmtMoney } from '../lib/format';
import { POSITION_LABEL } from '../lib/constants';

export function SellModal({ player, onClose }) {
  const { clubs, refresh, notify } = useApp();
  const [contract, setContract] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const club = clubs.find((c) => c.id === player.club_id);

  useEffect(() => {
    if (!player.club_id) return;
    api
      .getClub(player.club_id)
      .then((c) => setContract(c.players.find((p) => p.id === player.id)?.contract ?? null))
      .catch(() => undefined);
  }, [player]);

  const penaltyEst =
    contract && contract.remaining_days > 0 ? Math.min(10, (player.market_value * contract.penalty_rate) / 100) : 0;

  async function submit() {
    setBusy(true);
    setError('');
    try {
      const r = await api.sellPlayer(player.id);
      notify(
        'success',
        'Venda concluída',
        `${r.player_name} voltou a ser livre. Entrada no caixa: ${fmtMoney(r.cash_change)} (multa ${fmtMoney(r.penalty)}, taxa ${fmtMoney(r.fee)}).`,
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
      title="Vender jogador"
      description={`${player.name} volta a ser jogador livre e o valor entra no caixa do ${club?.name ?? 'clube'}.`}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn primary" disabled={busy} onClick={submit}>
            {busy ? 'Vendendo…' : 'Confirmar venda'}
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

      {contract ? (
        <dl className="summary">
          <div>
            <dt>Comprado por</dt>
            <dd>{fmtMoney(contract.purchase_value)}</dd>
          </div>
          <div>
            <dt>Fidelidade até</dt>
            <dd>{fmtDate(contract.loyalty_until)}</dd>
          </div>
          <div>
            <dt>Dias restantes</dt>
            <dd>{contract.remaining_days}</dd>
          </div>
          <div>
            <dt>Multa rescisória estimada ({contract.penalty_rate}%, teto 10,00)</dt>
            <dd className={penaltyEst > 0 ? 'neg' : ''}>{fmtMoney(penaltyEst)}</dd>
          </div>
        </dl>
      ) : (
        <p className="muted">Valores finais de multa e comissão são calculados pelo servidor ao confirmar.</p>
      )}
      {error && <p className="form-error">{error}</p>}
    </Modal>
  );
}