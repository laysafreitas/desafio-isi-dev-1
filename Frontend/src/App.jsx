import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { HomePage } from './pages/HomePage';
import { PlayersPage } from './pages/PlayersPage';
import { ClubsPage } from './pages/ClubsPage';
import { ClubDetailPage } from './pages/ClubDetailPage';
import { MatchesPage } from './pages/MatchesPage';
import { StandingsPage } from './pages/StandingsPage';
import { MatchDetailPage } from './pages/MatchDetailPage';

function AppLayout() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className={isHomePage ? 'layout-home' : 'layout'}>
      {!isHomePage && <Sidebar />}
      <main className={isHomePage ? 'main-home' : 'main'}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/jogadores" element={<PlayersPage />} />
          <Route path="/clubes" element={<ClubsPage />} />
          <Route path="/clubes/:id" element={<ClubDetailPage />} />
          <Route path="/partidas" element={<MatchesPage />} />
          <Route path="/partidas/:id" element={<MatchDetailPage />} />
          <Route path="/classificacao" element={<StandingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppLayout />
      </AppProvider>
    </BrowserRouter>
  );
}