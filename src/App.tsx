import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import MeasurePage from "./pages/MeasurePage";
import ResultsPage from "./pages/ResultsPage";
import MeasurementList from './Pages/MeasurementList';
import EditMeasurementPage from './pages/EditMeasurementPage';
import CustomMeasurePage from './Pages/CustomMeasurePage';
import { useLicence } from './licence/useLicence';


const App = () => {
  const { licence, erreur } = useLicence();

  if (erreur) {
    return <div style={{ color: 'red', padding: 20 }}>❌ {erreur}</div>;
  }

  if (!licence) {
    return <div style={{ color: '#fff', padding: 20 }}>Chargement de la licence...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/measure" element={<MeasurePage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/measures" element={<MeasurementList />} />
        <Route path="/modifier/:id" element={<EditMeasurementPage />} />
        <Route path="/edit/:id" element={<EditMeasurementPage />} />
        <Route path="/custom" element={<CustomMeasurePage />} />
      </Routes>
    </Router>
  );
};

export default App;
