// src/pages/Performance.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import learningProgress, { LESSON_LETTERS } from '../utils/learningProgress';
import './Learn.css';

const Performance = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchPerformanceData = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (!token || !storedUser) { navigate('/login'); return; }
      try { setUser(JSON.parse(storedUser)); } catch (e) { navigate('/login'); return; }

      // Read single source of truth state (synced with backend)
      const state = await learningProgress.loadStateFromBackend();

      // ── Basic Metrics ──
      const masteredLettersList = learningProgress.getMasteredLettersList(state);
      const lessons = Object.entries(state.lessons || {}).map(([id, l]) => ({ id, ...l }));
      const lessonsMasteredCount = lessons.filter(l => l.state === 'MASTERED').length;
      const overallProgress = learningProgress.getOverallProgressPercent(state);

      // ── Practice Analytics ──
      const practiceState = state.practiceState || { sessionsCompleted: 0, lastResult: null };
      const pLast = practiceState.lastResult;
      const practiceSessions = practiceState.sessionsCompleted;
      const practiceAccuracy = pLast ? pLast.percent : null;
      const practiceQuestions = pLast ? pLast.total : 0;

      // ── Overall Accuracy (Adaptive + Practice) ──
      let adaptiveTotal = 0;
      let adaptiveCorrect = 0;
      let adaptiveQuizCount = 0;
      let adaptiveAccuracySum = 0;

      lessons.forEach(l => {
        if (l.lastResult) {
          adaptiveTotal += l.lastResult.total || 0;
          adaptiveCorrect += l.lastResult.score || 0;
          adaptiveAccuracySum += l.lastResult.percent || 0;
          adaptiveQuizCount += 1;
        }
      });

      const averageAdaptiveAccuracy = adaptiveQuizCount > 0 ? Math.round(adaptiveAccuracySum / adaptiveQuizCount) : null;
      const practiceTotalCorrect = pLast ? pLast.score : 0;
      
      const totalQuestions = adaptiveTotal + practiceQuestions;
      const totalCorrect = adaptiveCorrect + practiceTotalCorrect;
      const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

      // ── Chart Data: Learning Journey (Lesson Progress Bars) ──
      const progressData = [];
      ['1', '2', '3', '4'].forEach(id => {
        const lessonLetters = LESSON_LETTERS[id] || [];
        const lessonObj = state.lessons?.[id] || {};
        
        let progressPercent = 0;
        if (lessonObj.state === 'MASTERED') {
          progressPercent = 100;
        } else if (lessonLetters.length > 0) {
          const masteredInLesson = lessonLetters.filter(l => masteredLettersList.includes(l)).length;
          progressPercent = Math.round((masteredInLesson / lessonLetters.length) * 100);
        }
        
        let statusLabel = 'Locked';
        if (lessonObj.state === 'MASTERED') statusLabel = 'Mastered';
        else if (lessonObj.state === 'COMPLETED') statusLabel = 'Content Completed';
        else if (lessonObj.state === 'IN_PROGRESS') statusLabel = 'In Progress';
        else if (id === '1' || state.lessons?.[String(Number(id)-1)]?.state === 'MASTERED') statusLabel = 'Not Started';

        progressData.push({
          name: `Lesson ${id}`,
          progress: progressPercent,
          status: statusLabel,
          state: lessonObj.state
        });
      });

      // ── Alphabet Grid Status ──
      const allLetters = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
      
      const letterToLessonMap = {};
      Object.entries(LESSON_LETTERS).forEach(([lid, letters]) => {
        letters.forEach(l => {
          letterToLessonMap[l] = lid;
        });
      });

      const alphabetGrid = allLetters.map(letter => {
        const streak = state.letterStreaks?.[letter] || 0;
        const lessonId = letterToLessonMap[letter];
        const lessonObj = state.lessons?.[lessonId];
        const lessonState = lessonObj?.state;

        let status = 'locked';
        if (masteredLettersList.includes(letter)) {
          status = 'mastered';
        } else if (streak > 0 || lessonState === 'IN_PROGRESS' || lessonState === 'COMPLETED') {
          status = 'learned';
        }

        return { letter, status };
      });

      setData({
        overallProgress, lessonsMastered: lessonsMasteredCount, overallAccuracy, practiceSessions,
        averageAdaptiveAccuracy, practiceAccuracy,
        progressData, alphabetGrid
      });
    };

    fetchPerformanceData();
  }, [navigate]);

  if (!user || !data) return null;

  return (
    <div className="dashboard-layout">
      <Sidebar activeTab="performance" />
      <div className="dashboard-workspace">
        <header className="dashboard-header">
          <div className="header-left">
            <span className="welcome-title-desc">BrailleWise Analytics</span>
            <h1 className="header-welcome" style={{ fontSize: '26px' }}>Performance Dashboard</h1>
          </div>
          <div className="header-right">
            <span className="header-date" style={{ color: '#34D399', fontWeight: '700' }}>
              Live Sync Active
            </span>
          </div>
        </header>

        <main className="learn-content" style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
            
            {/* 1. SUMMARY CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {[
                { label: 'Overall Progress', value: `${data.overallProgress}%`, color: '#60A5FA', icon: '📊' },
                { label: 'Lessons Mastered', value: data.lessonsMastered, color: '#34D399', icon: '🏆' },
                { label: 'Practice Sessions', value: data.practiceSessions, color: '#F59E0B', icon: '🔄' },
                { label: 'Overall Accuracy', value: `${data.overallAccuracy}%`, color: '#A78BFA', icon: '🎯' }
              ].map((card, i) => (
                <div key={i} className="sidebar-summary-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px', background: `rgba(255,255,255,0.05)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px'
                  }}>
                    {card.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                      {card.label}
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: card.color }}>
                      {card.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="learn-main-grid" style={{ alignItems: 'start' }}>
              
              {/* LEFT COLUMN */}
              <div className="learn-left-column" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* LEARNING JOURNEY */}
                <div className="sidebar-summary-card" style={{ padding: '24px' }}>
                  <h2 className="section-title" style={{ fontSize: '18px', marginBottom: '24px' }}>Learning Journey</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {data.progressData.map((item, index) => {
                      let color = '#64748B';
                      let icon = '🔒';
                      if (item.status === 'Mastered') { color = '#34D399'; icon = '✓'; }
                      else if (item.status === 'Content Completed') { color = '#F59E0B'; icon = '⭐'; }
                      else if (item.status === 'In Progress') { color = '#60A5FA'; icon = '🔄'; }
                      else if (item.status === 'Not Started') { color = '#E2E8F0'; icon = '🔓'; }

                      return (
                        <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '15px', fontWeight: '600', color: color === '#64748B' ? '#94A3B8' : '#FFFFFF' }}>
                              {item.name}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '14px', color, display: 'flex', alignItems: 'center' }}>{icon}</span>
                              <span style={{ fontSize: '13px', color, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                {item.status} ({item.progress}%)
                              </span>
                            </div>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ 
                              width: `${item.progress}%`, height: '100%', background: color, 
                              borderRadius: '4px', transition: 'width 0.5s ease-out' 
                            }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ALPHABET MASTERY */}
                <div className="sidebar-summary-card" style={{ padding: '24px' }}>
                  <h2 className="section-title" style={{ fontSize: '18px', marginBottom: '20px' }}>Alphabet Mastery</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(36px, 1fr))', gap: '8px' }}>
                    {data.alphabetGrid.map(({ letter, status }) => {
                      let bg = 'rgba(255,255,255,0.03)';
                      let border = '1px solid rgba(255,255,255,0.08)';
                      let color = '#64748B';
                      let weight = '500';

                      if (status === 'mastered') {
                        bg = 'rgba(52,211,153,0.15)';
                        border = '1px solid rgba(52,211,153,0.4)';
                        color = '#34D399';
                        weight = '700';
                      } else if (status === 'learned') {
                        bg = 'rgba(96,165,250,0.15)';
                        border = '1px solid rgba(96,165,250,0.4)';
                        color = '#60A5FA';
                        weight = '700';
                      }

                      return (
                        <div key={letter} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          aspectRatio: '1', borderRadius: '8px',
                          background: bg, border: border, color: color,
                          fontSize: '15px', fontWeight: weight
                        }} title={`Letter ${letter}: ${status.charAt(0).toUpperCase() + status.slice(1)}`}>
                          {letter}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '16px', fontSize: '12px', color: '#94A3B8' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#34D399' }}></span> Mastered
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#60A5FA' }}></span> Learned
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#64748B' }}></span> Locked
                    </span>
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN */}
              <div className="learn-right-column" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* QUIZ PERFORMANCE COMPARISON */}
                <div className="sidebar-summary-card" style={{ padding: '24px' }}>
                  <h2 className="section-title" style={{ fontSize: '18px', marginBottom: '24px' }}>Quiz Performance</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Adaptive Quiz */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF' }}>Adaptive Quiz Accuracy</span>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: data.averageAdaptiveAccuracy !== null ? '#A78BFA' : '#64748B' }}>
                          {data.averageAdaptiveAccuracy !== null ? `${data.averageAdaptiveAccuracy}%` : 'N/A'}
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                        {data.averageAdaptiveAccuracy !== null && (
                          <div style={{ 
                            width: `${data.averageAdaptiveAccuracy}%`, height: '100%', background: '#A78BFA', 
                            borderRadius: '4px', transition: 'width 0.5s ease-out' 
                          }}></div>
                        )}
                      </div>
                      {data.averageAdaptiveAccuracy === null && (
                         <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 0 0', fontStyle: 'italic' }}>No Adaptive Quiz completed yet.</p>
                      )}
                    </div>

                    {/* Practice Quiz */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF' }}>Practice Quiz Accuracy</span>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: data.practiceAccuracy !== null ? '#F59E0B' : '#64748B' }}>
                          {data.practiceAccuracy !== null ? `${data.practiceAccuracy}%` : 'N/A'}
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                        {data.practiceAccuracy !== null && (
                          <div style={{ 
                            width: `${data.practiceAccuracy}%`, height: '100%', background: '#F59E0B', 
                            borderRadius: '4px', transition: 'width 0.5s ease-out' 
                          }}></div>
                        )}
                      </div>
                      {data.practiceAccuracy === null && (
                         <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 0 0', fontStyle: 'italic' }}>No Practice Quiz completed yet.</p>
                      )}
                    </div>

                  </div>
                </div>

              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Performance;
