import AppLayout from "./layout/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AdminPage from "./pages/AdminPage";
import VotingPage from "./pages/VotingPage";
import ResultsPage from "./pages/ResultsPage";
import { VotingAppProvider } from "./hooks/VotingAppContext";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <VotingAppProvider>
        <AppLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/voting" element={<VotingPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AppLayout>
      </VotingAppProvider>
    </BrowserRouter>
  );
}

