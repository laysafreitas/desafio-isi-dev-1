import { useNavigate } from 'react-router-dom';
import { Users, Shield, ShoppingCart, ArrowLeftRight, History, Trophy, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext'; // Importa o context para pegar os dados reais
import '../styles/HomePage.css';

export function HomePage() {
  const navigate = useNavigate();
  const { clubs, totalPlayers, matches } = useApp(); 

  const freePlayers = clubs ? totalPlayers - clubs.reduce((acc, c) => acc + (c.players_count || c.players?.length || 0), 0) : 0;
  const totalMatches = matches ? matches.length : 0; 

  return (
    <div className="home-container">
      <div className="home-league-badge">
        <span className="league-dot"></span>
        <span>Liga Fictícia 2026</span>
        <span className="separator">·</span>
        <span className="league-leader">clubes ativos: {clubs.length}</span>
      </div>

      <div className="home-hero">
        <div className="home-logo-icon">P</div>
        <h1>Gestão da liga, do mercado à classificação</h1>
        <p>
          Cadastre jogadores, monte os clubes e negocie com contrato de fidelidade. Depois, escale os titulares e jogue partidas com placar calculado pelos atributos.
        </p>

        <button className="home-start-btn" onClick={() => navigate('/jogadores')}>
          Iniciar <ArrowRight size={18} />
        </button>
        <div className="home-shortcut-hint">
          ou tecle <kbd>Enter</kbd>
        </div>
      </div>

      <div className="home-stats-bar">
        <span>👥 <strong>{totalPlayers}</strong> jogadores</span>
        <span>·</span>
        <span>🛡️ <strong>{Math.max(0, freePlayers)}</strong> livres</span>
        <span>·</span>
        <span>🛡️ <strong>{clubs.length}</strong> clubes</span>
        <span>·</span>
        <span>⚔️ <strong>{totalMatches}</strong> partidas</span>
        <span>·</span>
        <span><CheckCircle2 size={14} className="inline-icon" /> Não precisa de login</span>
      </div>

      <div className="home-grid">
        <div className="home-card">
          <div className="home-card-header"><Users size={22} /> <span className="card-num">01</span></div>
          <h4>Jogadores</h4>
          <p>Nascem livres e Apto; o valor de mercado vem da condição, agilidade e idade.</p>
        </div>

        <div className="home-card">
          <div className="home-card-header"><Shield size={22} /> <span className="card-num">02</span></div>
          <h4>Clubes</h4>
          <p>Começam com 300,00 em caixa e sem jogadores.</p>
        </div>

        <div className="home-card">
          <div className="home-card-header"><ShoppingCart size={22} /> <span className="card-num">03</span></div>
          <h4>Compra</h4>
          <p>Valor + taxa, até 50% do caixa, com contrato de fidelidade.</p>
        </div>

        <div className="home-card">
          <div className="home-card-header"><ArrowLeftRight size={22} /> <span className="card-num">04</span></div>
          <h4>Venda</h4>
          <p>Multa antes do fim da fidelidade e comissão sobre o lucro.</p>
        </div>

        <div className="home-card">
          <div className="home-card-header"><History size={22} /> <span className="card-num">05</span></div>
          <h4>Histórico</h4>
          <p>Toda compra e venda fica registrada, com totais e CSV.</p>
        </div>

        <div className="home-card">
          <div className="home-card-header"><Trophy size={22} /> <span className="card-num">06</span></div>
          <h4>Liga</h4>
          <p>Escale 5 titulares e jogue partidas que entram na classificação.</p>
        </div>
      </div>

      <div className="home-footer">
        Liga Fictícia 2026 · Horário de Brasília (UTC-3)
      </div>
    </div>
  );
}