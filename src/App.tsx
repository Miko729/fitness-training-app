import { Navigate, Route, Routes } from "react-router-dom";
import HistoryPage from "./pages/HistoryPage";
import ExerciseLibraryPage from "./pages/ExerciseLibraryPage";
import HomePage from "./pages/HomePage";
import SettingsPage from "./pages/SettingsPage";
import TrainingPage from "./pages/TrainingPage";
import WeeklyPage from "./pages/WeeklyPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/training" element={<TrainingPage />} />
      <Route path="/weekly" element={<WeeklyPage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/exercise-library" element={<ExerciseLibraryPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
