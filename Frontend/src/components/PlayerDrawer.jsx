import { useEffect, useState } from 'react';
import { BarChart3, Coins, HandCoins, HeartPulse, Pencil, ShoppingCart, Tag, TrendingUp, X } from 'lucide-react';
import { Drawer } from './Modal';
import { Avatar, AttributeBar, ConditionBadge, PositionTag } from './Badges';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';
import { fmtMoney } from '../lib/format';

export function PlayerDrawer({ playerId, onClose, onEdit, onCondition, onBuy, onSell }) {
  const { clubs, version } = useApp();
  const [player, setPlayer] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    api
      .getPlayer(playerId)
      .then((p) => alive && setPlayer(p))
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [playerId, version]);

  const club = clubs.find((c) => c.id === player?.club_id);

  return (
    <Drawer onClose={onClose}>
      <button className="icon-btn drawer-close" onClick={onClose} aria-label="Fechar">
        <X size={18} />
      </button>
      {error && <p className="form-error">{error}</p>}
      {!player && !error && <p className="muted">Carregando…</p>}
      {player && (
        <>
          <header className="drawer-head">
            <Avatar player={player} size={48} />
            <div>
              <h2>{player.name}</h2>
              <div className="tag-row">
                <PositionTag position={player.position} />
                <ConditionBadge condition={player.condition} />
                <span className="chip">{club ? club.name : 'Livre'}</span>
              </div>
            </div>
          </header>

          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-top">
                <span>Valor de mercado</span>
                <Coins size={16} />
              </div>
              <strong>{fmtMoney(player.market_value)}</strong>
              <small className="muted">Calculado automaticamente</small>
            </div>
            <div className="stat-card">
              <div className="stat-top">
                <span>Valor base</span>
                <Tag size={16} />
              </div>
              <strong>{fmtMoney(player.base_value)}</strong>
              <small className="muted">Calculado no cadastro</small>
            </div>
            <div className="stat-card">
              <div className="stat-top">
                <span>Overall</span>
                <BarChart3 size={16} />
              </div>
              <strong>{player.overall}</strong>
              <small className="muted">Calculado pela posição</small>
            </div>
            <div className="stat-card">
              <div className="stat-top">
                <span>Potencial</span>
                <TrendingUp size={16} />
              </div>
              <strong>{player.potential}</strong>
              <small className="muted">Informado no cadastro</small>
            </div>
          </div>

          <div className="drawer-section-head">
            <h3>Indicadores técnicos</h3>
            <span className="muted">Escala de 1 a 99</span>
          </div>
          <div className="attr-list">
            <AttributeBar label="Velocidade" value={player.pace} potential={player.potential} />
            <AttributeBar label="Finalização" value={player.shooting} potential={player.potential} />
            <AttributeBar label="Passe" value={player.passing} potential={player.potential} />
            <AttributeBar label="Drible" value={player.dribbling} potential={player.potential} />
            <AttributeBar label="Defesa" value={player.defending} potential={player.potential} />
            <AttributeBar label="Físico" value={player.physical} potential={player.potential} />
          </div>
          <div className="legend">
            <span>
              <i className="sw strong" /> Valor do atributo
            </span>
            <span>
              <i className="sw soft" /> Até o potencial ({player.potential}), que nenhum atributo passa
            </span>
          </div>

          <dl className="kv">
            <div>
              <dt>Idade</dt>
              <dd>{player.age} anos</dd>
            </div>
            <div>
              <dt>Agilidade</dt>
              <dd>{player.agility}</dd>
            </div>
            <div>
              <dt>Clube</dt>
              <dd>{club ? club.name : 'Livre'}</dd>
            </div>
          </dl>

          <footer className="drawer-footer">
            <button className="btn" onClick={() => onEdit(player)}>
              <Pencil size={16} /> Editar
            </button>
            <button className="btn" onClick={() => onCondition(player)}>
              <HeartPulse size={16} /> Alterar condição
            </button>
            <span className="spacer" />
            {player.club_id ? (
              <button className="btn primary" onClick={() => onSell(player)}>
                <HandCoins size={16} /> Vender
              </button>
            ) : (
              <button className="btn primary" onClick={() => onBuy(player)}>
                <ShoppingCart size={16} /> Comprar
              </button>
            )}
          </footer>
        </>
      )}
    </Drawer>
  );
}