import React, { createContext, useState, useEffect } from 'react';

export const LearningContext = createContext();

export const LearningProvider = ({ children }) => {
  const [lessonStatus, setLessonStatus] = useState(() => {
    const saved = localStorage.getItem('lessonStatus');
    return saved ? JSON.parse(saved) : {};
  });
  const [xp, setXp] = useState(() => Number(localStorage.getItem('xp') || 0));
  const [badges, setBadges] = useState(() => JSON.parse(localStorage.getItem('badges') || '[]'));

  useEffect(() => {
    localStorage.setItem('lessonStatus', JSON.stringify(lessonStatus));
  }, [lessonStatus]);

  useEffect(() => {
    localStorage.setItem('xp', xp);
  }, [xp]);

  useEffect(() => {
    localStorage.setItem('badges', JSON.stringify(badges));
  }, [badges]);

  const unlockLesson = (lessonId) => {
    setLessonStatus(prev => ({
      ...prev,
      [lessonId]: { ...(prev[lessonId] || {}), unlocked: true },
    }));
  };

  const completeLesson = (lessonId, quizScore) => {
    const passed = quizScore >= 80;
    const earned = 50 + (passed ? 50 : 0) + (quizScore === 100 ? 20 : 0);
    setXp(prev => prev + earned);
    setLessonStatus(prev => ({
      ...prev,
      [lessonId]: { ...(prev[lessonId] || {}), completed: true, passed, xpEarned: earned },
    }));
    if (passed) {
      unlockLesson(String(Number(lessonId) + 1));
    }
    if (passed && quizScore === 100) {
      setBadges(b => [...b, 'Perfect Quiz']);
    }
  };

  return (
    <LearningContext.Provider value={{ lessonStatus, xp, badges, unlockLesson, completeLesson }}>
      {children}
    </LearningContext.Provider>
  );
};
