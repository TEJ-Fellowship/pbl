import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Landingpage from "./pages/Landingpage";
import ChatPage from "./pages/ChatPage";
import SearchPage from "./pages/SearchPage";
import HelpCenter from "./pages/HelpCenter";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import TemplateGallery from "./pages/TemplateGallery";
import AutomationWorkflow from "./pages/AutomationWorkflow";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landingpage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/help-center" element={<HelpCenter />} />
        <Route path="/analytics" element={<AnalyticsDashboard />} />
        <Route path="/templates" element={<TemplateGallery />} />
        <Route path="/automation" element={<AutomationWorkflow />} />
      </Routes>
    </Router>
  );
}

export default App;
