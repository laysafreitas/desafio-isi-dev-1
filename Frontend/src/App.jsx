import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { PlayersPage } from './pages/PlayersPage';
import { ClubsPage } from './pages/ClubsPage';
import { ClubDetailPage } from './pages/ClubDetailPage';
import { MatchesPage } from './pages/MatchesPage';
import { StandingsPage } from './pages/StandingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <div className="layout">
          <Sidebar />
          <main className="main">
            <Routes>
              <Route path="/" element={<Navigate to="/jogadores" replace />} />
              <Route path="/jogadores" element={<PlayersPage />} />
              <Route path="/clubes" element={<ClubsPage />} />
              <Route path="/clubes/:id" element={<ClubDetailPage />} />
              <Route path="/partidas" element={<MatchesPage />} />
              <Route path="/classificacao" element={<StandingsPage />} />
              <Route path="*" element={<Navigate to="/jogadores" replace />} />
            </Routes>
          </main>
        </div>
      </AppProvider>
    </BrowserRouter>
  );
}