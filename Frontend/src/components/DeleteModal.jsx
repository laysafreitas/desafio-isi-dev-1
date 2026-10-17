import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Modal } from './Modal';
import { Avatar } from './Badges';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';
import { POSITION_LABEL } from '../lib/constants';

export function DeleteModal({ player, onClose, onDeleted }) {
  const { refresh, notify } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function confirm() {
    setBusy(true);
    setError('');
    try {
      await api.deletePlayer(player.id);
      notify('success', 'Jogador excluído', `${player.name} saiu da lista. Transações e partidas antigas dele continuam gravadas.`);
      await refresh();
      onDeleted?.();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={`Excluir ${player.name}?`}
      description="O jogador sai da lista e da busca, mas as transações e as partidas antigas dele continuam como foram gravadas."
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn danger" disabled={busy} onClick={confirm}>
            <Trash2 size={16} /> {busy ? 'Excluindo…' : 'Excluir jogador'}
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
        <span className="chip">Livre</span>
      </div>
      {error && <p className="form-error">{error}</p>}
    </Modal>
  );
}