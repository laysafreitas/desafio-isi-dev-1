import { Link } from 'react-router-dom';
import { Eye, HandCoins, HeartPulse, Pencil, ShoppingCart, Trash2 } from 'lucide-react';
import { Avatar, AgilityBar, ConditionBadge, PositionTag } from './Badges';
import { RowMenu } from './Menu';
import { useApp } from '../context/AppContext';
import { fmtMoney } from '../lib/format';
import { POSITION_LABEL } from '../lib/constants';

export function PlayerTable({ players, actions, empty }) {
  const { clubs } = useApp();

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Jogador</th>
            <th>Posição</th>
            <th>Overall</th>
            <th>Agilidade</th>
            <th>Idade</th>
            <th>Condição</th>
            <th className="num">Valor base</th>
            <th className="num">Valor de mercado</th>
            <th>Clube</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {players.length === 0 && (
            <tr>
              <td colSpan={10} className="empty">
                {empty ?? 'Nenhum jogador encontrado.'}
              </td>
            </tr>
          )}
          {players.map((p) => {
            const club = clubs.find((c) => c.id === p.club_id);
            const items = [
              { label: 'Ver detalhes', icon: <Eye size={16} />, onClick: () => actions.onView(p) },
              { label: 'Editar', icon: <Pencil size={16} />, onClick: () => actions.onEdit(p) },
              { label: 'Alterar condição', icon: <HeartPulse size={16} />, onClick: () => actions.onCondition(p) },
              p.club_id
                ? { label: 'Vender', icon: <HandCoins size={16} />, onClick: () => actions.onSell(p), dividerBefore: true }
                : { label: 'Comprar', icon: <ShoppingCart size={16} />, onClick: () => actions.onBuy(p), dividerBefore: true },
              {
                label: 'Excluir',
                icon: <Trash2 size={16} />,
                danger: true,
                disabled: !!p.club_id,
                dividerBefore: true,
                hint: p.club_id ? 'Só jogadores livres podem ser excluídos.' : 'Disponível porque o jogador está livre.',
                onClick: () => actions.onDelete(p),
              },
            ];
            return (
              <tr key={p.id}>
                <td>
                  <button className="player-cell" onClick={() => actions.onView(p)}>
                    <Avatar player={p} />
                    <div>
                      <strong>{p.name}</strong>
                      <span className="muted">{POSITION_LABEL[p.position]}</span>
                    </div>
                  </button>
                </td>
                <td>
                  <PositionTag position={p.position} />
                </td>
                <td>
                  <strong className="overall">{p.overall}</strong>
                </td>
                <td>
                  <AgilityBar value={p.agility} />
                </td>
                <td>{p.age}</td>
                <td>
                  <ConditionBadge condition={p.condition} />
                </td>
                <td className="num muted">{fmtMoney(p.base_value)}</td>
                <td className="num">
                  <strong>{fmtMoney(p.market_value)}</strong>
                </td>
                <td>
                  {club ? (
                    <span className="club-cell">
                      <span className="tag soft">{club.acronym}</span>
                      <Link to={`/clubes/${club.id}`}>{club.name}</Link>
                    </span>
                  ) : (
                    <span className="club-cell">
                      <span className="chip">Livre</span>
                      <button className="btn sm" onClick={() => actions.onBuy(p)}>
                        <ShoppingCart size={15} /> Comprar
                      </button>
                    </span>
                  )}
                </td>
                <td className="actions">
                  <RowMenu title={p.name} items={items} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}