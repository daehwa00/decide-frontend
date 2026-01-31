
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import LandingPage from '@/pages/LandingPage';
import IssueIntakePage from '@/pages/IssueIntakePage';
import AnalysisPage from '@/pages/AnalysisPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/issues/new" element={<IssueIntakePage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
