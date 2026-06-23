import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import WorkspacePage from './pages/WorkspacePage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/app" element={<WorkspacePage />} />
      <Route path="/app/:sessionId" element={<WorkspacePage />} />
    </Routes>
  );
}

