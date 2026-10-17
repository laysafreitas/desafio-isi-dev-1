import { useState } from 'react';
import { Lock, User } from 'lucide-react';
import { Modal } from './Modal';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';
import { POSITIONS, POSITION_LABEL } from '../lib/constants';
import { fmtMoney } from '../lib/format';

const ATTRS = [
  { key: 'pace', label: 'Velocidade' },
  { key: 'shooting', label: 'Finalização' },
  { key: 'passing', label: 'Passe' },
  { key: 'dribbling', label: 'Drible' },
  { key: 'defending', label: 'Defesa' },
  { key: 'physical', label: 'Físico' },
];

/** Se "player" for informado, o modal funciona em modo edição. */
export function PlayerFormModal({ player, onClose, onSaved }) {
  const { refresh, notify } = useApp();
  const editing = !!player;
  const locked = !!player?.club_id; // jogador com clube não muda de posição

  const [name, setName] = useState(player?.name ?? '');
  const [position, setPosition] = useState(player?.position ?? 'MEI');
  const [age, setAge] = useState(player ? String(player.age) : '');
  const [agility, setAgility] = useState(player ? String(player.agility) : '');
  const [attrs, setAttrs] = useState({
    pace: '', shooting: '', passing: '', dribbling: '', defending: '', physical: '', potential: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const num = (s) => (s.trim() === '' ? NaN : Number(s));

  function validate() {
    const n = name.trim().replace(/\s+/g, ' ');
    if (n.length < 3 || n.length > 100) return 'O nome deve ter de 3 a 100 caracteres.';
    if (n.split(' ').length < 2) return 'Informe pelo menos duas palavras no nome.';
    if (/\d/.test(n)) return 'O nome não pode conter números.';

    const a = num(age);
    const ag = num(agility);
    if (!Number.isInteger(a) || a < 16 || a > 45) return 'A idade deve ser um inteiro de 16 a 45.';
    if (player && a < player.age) return `A idade não pode diminuir (atual: ${player.age}).`;
    if (!Number.isInteger(ag) || ag < 1 || ag > 100) return 'A agilidade deve ser um inteiro de 1 a 100.';
    if (a >= 35 && ag > 85) return 'Com 35 anos ou mais, a agilidade máxima é 85.';

    if (!editing) {
      const vals = ATTRS.map((x) => num(attrs[x.key]));
      if (vals.some((v) => !Number.isInteger(v) || v < 1 || v > 99)) return 'Cada indicador deve ser um inteiro de 1 a 99.';
      const sum = vals.reduce((s, v) => s + v, 0);
      if (sum > 480) return `A soma dos indicadores não pode passar de 480 (atual: ${sum}).`;
      const pot = num(attrs.potential);
      if (!Number.isInteger(pot) || pot < 1 || pot > 99) return 'O potencial deve ser um inteiro de 1 a 99.';
      const max = Math.max(...vals);
      if (pot < max) return `O potencial não pode ser menor que o maior indicador (${max}).`;
      if (a >= 33 && pot !== max) return 'Com 33 anos ou mais, o potencial deve ser igual ao maior indicador.';
    }
    return null;
  }

  async function submit() {
    const err = validate();
    if (err) return setError(err);
    setError('');
    setBusy(true);
    try {
      const cleanName = name.trim().replace(/\s+/g, ' ');
      let saved;
      if (editing) {
        saved = await api.updatePlayer(player.id, {
          name: cleanName,
          position,
          age: Number(age),
          agility: Number(agility),
        });
        notify('success', 'Jogador atualizado', `${saved.name} foi salvo. Valor de mercado: ${fmtMoney(saved.market_value)}.`);
      } else {
        saved = await api.createPlayer({
          name: cleanName,
          position,
          age: Number(age),
          agility: Number(agility),
          pace: Number(attrs.pace),
          shooting: Number(attrs.shooting),
          passing: Number(attrs.passing),
          dribbling: Number(attrs.dribbling),
          defending: Number(attrs.defending),
          physical: Number(attrs.physical),
          potential: Number(attrs.potential),
        });
        notify('success', 'Jogador cadastrado', `${saved.name} entrou como jogador livre.`);
      }
      await refresh();
      onSaved?.(saved);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={editing ? 'Editar jogador' : 'Novo jogador'}
      description={
        editing
          ? 'Edite nome, posição, idade e agilidade. Os demais dados não mudam.'
          : 'Valor base, overall e valor de mercado são calculados automaticamente no cadastro.'
      }
      onClose={onClose}
      width={editing ? 520 : 600}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn primary" onClick={submit} disabled={busy}>
            {busy ? 'Salvando…' : editing ? 'Salvar alterações' : 'Cadastrar jogador'}
          </button>
        </>
      }
    >
      <label className="field">
        <span>Nome</span>
        <div className="input-icon">
          <User size={16} />
          <input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        <small className="muted">De 3 a 100 caracteres, com pelo menos duas palavras e sem números.</small>
      </label>

      <div className="field">
        <span>Posição</span>
        <div className="pos-grid">
          {POSITIONS.map((p) => {
            const disabled = locked && p !== player?.position;
            return (
              <button
                key={p}
                type="button"
                disabled={disabled}
                className={`pos-option ${position === p ? 'selected' : ''}`}
                onClick={() => setPosition(p)}
              >
                <strong>{p}</strong>
                <small>{POSITION_LABEL[p]}</small>
              </button>
            );
          })}
        </div>
        {locked && <small className="muted">Jogador com clube não muda de posição: as outras posições ficam desabilitadas.</small>}
      </div>

      <div className="grid-2">
        <label className="field">
          <span>Idade</span>
          <input type="number" value={age} onChange={(e) => setAge(e.target.value)} />
          <small className="muted">De 16 a 45{player ? `, sem diminuir (atual: ${player.age})` : ''}.</small>
        </label>
        <label className="field">
          <span>Agilidade</span>
          <input type="number" value={agility} onChange={(e) => setAgility(e.target.value)} />
          <small className="muted">De 1 a 100 (até 85 com 35 anos ou mais).</small>
        </label>
      </div>

      {!editing && (
        <>
          <div className="section-label">Indicadores técnicos (1 a 99, soma máxima 480)</div>
          <div className="grid-3">
            {ATTRS.map((a) => (
              <label className="field" key={a.key}>
                <span>{a.label}</span>
                <input
                  type="number"
                  value={attrs[a.key]}
                  onChange={(e) => setAttrs({ ...attrs, [a.key]: e.target.value })}
                />
              </label>
            ))}
            <label className="field">
              <span>Potencial</span>
              <input type="number" value={attrs.potential} onChange={(e) => setAttrs({ ...attrs, potential: e.target.value })} />
            </label>
          </div>
        </>
      )}

      {editing && (
        <div className="note">
          <Lock size={14} /> Não mudam depois do cadastro: valor base ({fmtMoney(player.base_value)}), indicadores e potencial.
        </div>
      )}

      {error && <p className="form-error">{error}</p>}
    </Modal>
  );
}