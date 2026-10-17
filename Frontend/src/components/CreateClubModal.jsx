import { useState } from 'react';
import { Modal } from './Modal';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';
import { fmtMoney } from '../lib/format';

export function CreateClubModal({ onClose }) {
  const { refresh, notify } = useApp();
  const [name, setName] = useState('');
  const [acronym, setAcronym] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setError('');
    const n = name.trim().replace(/\s+/g, ' ');
    const a = acronym.trim().toUpperCase();
    if (n.length < 3 || n.length > 60) return setError('O nome deve ter de 3 a 60 caracteres.');
    if (!/^[A-Z]{3}$/.test(a)) return setError('A sigla deve ter exatamente 3 letras.');
    setBusy(true);
    try {
      const club = await api.createClub(n, a);
      notify('success', 'Clube criado', `${club.name} começa com caixa de ${fmtMoney(club.cash)}.`);
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
      title="Novo clube"
      description="Cada clube começa com 300,00 em caixa. A liga aceita até 20 clubes."
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn primary" disabled={busy} onClick={submit}>
            {busy ? 'Salvando…' : 'Criar clube'}
          </button>
        </>
      }
    >
      <label className="field">
        <span>Nome</span>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoFocus />
      </label>
      <label className="field">
        <span>Sigla</span>
        <input value={acronym} onChange={(e) => setAcronym(e.target.value.toUpperCase())} maxLength={3} placeholder="AGU" />
        <small className="muted">3 letras, única na liga.</small>
      </label>
      {error && <p className="form-error">{error}</p>}
    </Modal>
  );
}