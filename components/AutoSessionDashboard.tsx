// src/components/session/AutoSessionDashboard.tsx

import React, { useState } from 'react';
import SessionCard from './SessionCard';
import type { AutoSession, SessionStats } from '@/types/session';

interface AutoSessionDashboardProps {
  availableSessions: AutoSession[];
  currentSession: AutoSession | null;
  sessionStats: SessionStats | null;
  isLoading: boolean;
  error: string | null;
  onJoinSession: (sessionId: string) => void;
  onRefresh: () => void;
}

const AutoSessionDashboard: React.FC<AutoSessionDashboardProps> = ({
  availableSessions,
  currentSession,
  sessionStats,
  isLoading,
  error,
  onJoinSession,
  onRefresh
}) => {
  const [showAllSessions, setShowAllSessions] = useState(false);

  // Separate live and upcoming sessions
  const liveSessions = availableSessions.filter(s => s.isLive && s.status === 'active');
  const upcomingSessions = availableSessions.filter(s => !s.isLive || s.status !== 'active');

  //const displaySessions = showAllSessions ? availableSessions : availableSessions.slice(0, 6);

  if (isLoading) {
    return (
      <div 
        style={{
          position: 'fixed',
          top: '60px',
          left: '20px',
          background: 'rgba(0,0,0,0.9)',
          backdropFilter: 'blur(15px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '20px',
          width: '320px',
          zIndex: 999,
          color: '#ffffff'
        }}
      >
        <div style={{ textAlign: 'center', color: '#888888' }}>
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>🔄 Loading Sessions...</div>
          <div style={{ fontSize: '11px', opacity: 0.7 }}>Discovering active debates</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: '60px',
        left: '20px',
        background: 'rgba(0,0,0,0.9)',
        backdropFilter: 'blur(15px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '16px',
        width: '320px',
        maxHeight: '70vh',
        overflowY: 'auto',
        zIndex: 999,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        color: '#ffffff'
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <div 
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}
        >
          <h2 
            style={{
              fontSize: '16px',
              fontWeight: '600',
              margin: 0,
              background: 'linear-gradient(45deg, #00ff88, #00d2ff)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            AI2AIs Live
          </h2>
          
          <button
            onClick={onRefresh}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px',
              padding: '4px 8px',
              color: '#ffffff',
              fontSize: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
             Refresh
          </button>
        </div>

        {/* Stats */}
        {sessionStats && (
          <div 
            style={{
              display: 'flex',
              gap: '16px',
              fontSize: '11px',
              color: '#888888',
              marginBottom: '8px'
            }}
          >
            <span>🎭 {sessionStats.activeSessions} active</span>
            <span>👥 {sessionStats.totalViewers} viewers</span>
            <span>📊 {sessionStats.totalSessions} total</span>
          </div>
        )}

        <div 
          style={{
            fontSize: '10px',
            color: '#666666',
            opacity: 0.8
          }}
        >
          Auto-generated debates • Updated every 15s
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div 
          style={{
            background: 'rgba(255,68,68,0.1)',
            border: '1px solid rgba(255,68,68,0.3)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px',
            fontSize: '11px',
            color: '#ff4444'
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* No Sessions State */}
      {!isLoading && availableSessions.length === 0 && (
        <div 
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#666666'
          }}
        >
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🤖</div>
          <div style={{ fontSize: '12px', marginBottom: '4px' }}>No active debates</div>
          <div style={{ fontSize: '10px', opacity: 0.7 }}>
            AI debates start automatically every few hours
          </div>
        </div>
      )}

      {/* Live Sessions */}
      {liveSessions.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <h3 
            style={{
              fontSize: '12px',
              fontWeight: '600',
              margin: '0 0 8px 0',
              color: '#ff0044',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            LIVE NOW ({liveSessions.length})
          </h3>
          
          {liveSessions.map(session => (
            <SessionCard
              key={session.id}
              session={session}
              isActive={currentSession?.id === session.id}
              onJoin={() => onJoinSession(session.id)}
            />
          ))}
        </div>
      )}

      {/* Upcoming/Recent Sessions */}
      {upcomingSessions.length > 0 && (
        <div>
          <h3 
            style={{
              fontSize: '12px',
              fontWeight: '600',
              margin: '0 0 8px 0',
              color: '#888888',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            Recent & Upcoming ({upcomingSessions.length})
          </h3>
          
          {upcomingSessions.slice(0, showAllSessions ? undefined : 4).map(session => (
            <SessionCard
              key={session.id}
              session={session}
              isActive={currentSession?.id === session.id}
              onJoin={() => onJoinSession(session.id)}
            />
          ))}
          
          {/* Show More/Less Button */}
          {upcomingSessions.length > 4 && (
            <button
              onClick={() => setShowAllSessions(!showAllSessions)}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '8px',
                color: '#888888',
                fontSize: '11px',
                cursor: 'pointer',
                marginTop: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              {showAllSessions ? '▲ Show Less' : `▼ Show ${upcomingSessions.length - 4} More`}
            </button>
          )}
        </div>
      )}

      {/* Current Session Highlight */}
      {currentSession && (
        <div 
          style={{
            marginTop: '16px',
            padding: '12px',
            background: 'rgba(0,255,136,0.1)',
            border: '1px solid rgba(0,255,136,0.3)',
            borderRadius: '8px'
          }}
        >
          <div 
            style={{
              fontSize: '10px',
              color: '#00ff88',
              fontWeight: '600',
              marginBottom: '4px'
            }}
          >
            CURRENTLY WATCHING
          </div>
          <div 
            style={{
              fontSize: '11px',
              color: '#ffffff',
              fontWeight: '500'
            }}
          >
            {currentSession.topic}
          </div>
          <div 
            style={{
              fontSize: '9px',
              color: '#888888',
              marginTop: '4px'
            }}
          >
            {currentSession.participants.join(' • ')} • Round {currentSession.currentRound}/{currentSession.maxRounds}
          </div>
        </div>
      )}

      {/* Footer */}
      <div 
        style={{
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          fontSize: '9px',
          color: '#666666',
          textAlign: 'center'
        }}
      >
        Autonomous AI Debates<br/>
        Characters evolve through conversation
      </div>
    </div>
  );
};

export default AutoSessionDashboard;