import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import voiceGuidance from './utils/voiceGuidance';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import Assessment from './pages/Assessment';
import Dashboard from './pages/Dashboard';
import Learn from './pages/Learn';
import LessonPlayerPlaceholder from './pages/LessonPlayerPlaceholder';
import PracticeQuiz from './pages/PracticeQuiz';
import QuizResult from './pages/QuizResult';
import LessonComplete from './pages/LessonComplete';
import PracticeQuizRevision from './pages/PracticeQuizRevision';
import PracticeResult from './pages/PracticeResult';
import Performance from './pages/Performance';
import Achievements from './pages/Achievements';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import VoiceGuidance from './pages/VoiceGuidance';
import FloatingAccessibility from './components/FloatingAccessibility';
import AssistantFloatingControls from './components/AssistantFloatingControls';

const AppContent = () => {
  const navigate = useNavigate();

  useEffect(() => {
    voiceGuidance.setNavigate(navigate);
  }, [navigate]);

  return (
    <>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/assessment" element={<Assessment />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/learn/lesson/:id" element={<LessonPlayerPlaceholder />} />
        <Route path="/learn/lesson/:lessonId/complete" element={<LessonComplete />} />
        <Route path="/learn/:lessonId/quiz" element={<PracticeQuiz />} />
        <Route path="/learn/:lessonId/quiz/result" element={<QuizResult />} />
        <Route path="/practice" element={<PracticeQuizRevision />} />
        <Route path="/practice/result" element={<PracticeResult />} />
        <Route path="/performance" element={<Performance />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/voice" element={<VoiceGuidance />} />
      </Routes>
      <FloatingAccessibility />
      <AssistantFloatingControls />
    </>
  );
};

function App() {
  useEffect(() => {
    voiceGuidance.init();
  }, []);

  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
