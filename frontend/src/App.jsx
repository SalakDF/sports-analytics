import { Routes, Route } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import HomePage from "./pages/HomePage";
import MatchesPage from "./pages/MatchesPage";
import MatchDetailsPage from "./pages/MatchDetailsPage";
import TeamsPage from "./pages/TeamsPage";
import TeamDetailsPage from "./pages/TeamDetailsPage";
import StandingsPage from "./pages/StandingsPage";
import FavoritesPage from "./pages/FavoritesPage";
import AuthPage from "./pages/AuthPage";
import NotFoundPage from "./pages/NotFoundPage";
import ExternalMatchesPage from "./pages/ExternalMatchesPage";
import ExternalStandingsPage from "./pages/ExternalStandingsPage";
import ExternalTeamMatchesPage from "./pages/ExternalTeamMatchesPage";
import ImportedMatchesPage from "./pages/ImportedMatchesPage";
import ExternalTeamMappingsPage from "./pages/ExternalTeamMappingsPage";
import ExternalCompetitionMappingsPage from "./pages/ExternalCompetitionMappingsPage";
import ExternalSyncPage from "./pages/ExternalSyncPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="matches" element={<MatchesPage />} />
        <Route path="matches/:id" element={<MatchDetailsPage />} />
        <Route path="teams" element={<TeamsPage />} />
        <Route path="teams/:id" element={<TeamDetailsPage />} />
        <Route path="standings" element={<StandingsPage />} />
        <Route path="external-matches" element={<ExternalMatchesPage />} />
        <Route path="external-standings" element={<ExternalStandingsPage />} />
        <Route path="external-teams/:teamId/matches" element={<ExternalTeamMatchesPage />} />
        <Route path="imported-matches" element={<ImportedMatchesPage />} />
        <Route path="external-team-mappings" element={<ExternalTeamMappingsPage />} />
        <Route path="external-competition-mappings" element={<ExternalCompetitionMappingsPage />} />
        <Route path="external-sync" element={<ExternalSyncPage />} />
        <Route
          path="favorites"
          element={
            <ProtectedRoute>
              <FavoritesPage />
            </ProtectedRoute>
          }
        />
        <Route path="auth" element={<AuthPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}