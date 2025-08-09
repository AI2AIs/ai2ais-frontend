// src/components/session/SessionStatusBar.tsx

import React, { useState, useEffect } from 'react';
import type { AutoSession, SessionStats } from '@/types/session';

interface SessionStatusBarProps {
  currentSession: AutoSession | null;
  sessionStats: SessionStats | null;
  sessionNotifications: string[];
  onClearNotifications: () => void;
  isConnected: boolean;
}

const SessionStatusBar: React.FC<SessionStatusBarProps> = ({
  currentSession,
  sessionStats,
  sessionNotifications,
  onClearNotifications,
  isConnected
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Auto-show notifications when new ones arrive
  useEffect(() => {
    if (sessionNotifications.length > 0) {
      setShowNotifications(true);
      
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setShowNotifications(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [sessionNotifications]);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getSessionDuration = (): string => {
    if (!currentSession) return '00:00';
    
    const now = new Date();
    const start = new Date(currentSession.createdAt);
    const diffMs = now.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    return `${Math.floor(diffMins / 60).toString().padStart(2, '0')}:${(diffMins % 60).toString().padStart(2, '0')}:${diffSecs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Main Status Bar */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: 'rgba(0,0,0,0.9)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          padding: '8px 16px',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: '#ffffff'
        }}
      >
        {/* Left Section - Connection & Time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Connection Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div 
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isConnected ? '#00ff88' : '#ff0044',
                animation: isConnected ? 'pulse 2s infinite' : 'none'
              }}
            />
            <span style={{ color: isConnected ? '#00ff88' : '#ff0044' }}>
              {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>

          {/* Current Time */}
          <div style={{ color: '#888888' }}>
            {formatTime(currentTime)}
          </div>

          {/* Session Duration */}
          {currentSession && (
            <div style={{ color: '#ffaa00' }}>
              ⏱️ {getSessionDuration()}
            </div>
          )}
        </div>

        {/* Center Section - Current Session Info */}
        {currentSession && (
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flex: 1,
              justifyContent: 'center',
              maxWidth: '600px'
            }}
          >
            {/* Live Indicator */}
            {currentSession.isLive && (
              <div 
                style={{
                  background: '#ff0044',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: '600',
                  animation: 'pulse 2s infinite'
                }}
              >
                🔴 LIVE
              </div>
            )}

            {/* Session Topic */}
            <div 
              style={{
                fontWeight: '500',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '300px'
              }}
            >
              {currentSession.topic}
            </div>

            {/* Round Progress */}
            <div style={{ color: '#888888' }}>
              Round {currentSession.currentRound}/{currentSession.maxRounds}
            </div>

            {/* Viewer Count */}
            {currentSession.viewerCount !== undefined && (
              <div style={{ color: '#00d2ff' }}>
                👥 {currentSession.viewerCount}
              </div>
            )}
          </div>
        )}

        {/* Right Section - Stats & Notifications */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Session Stats */}
          {sessionStats && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#888888' }}>
              <span>🎭 {sessionStats.activeSessions}</span>
              <span>👥 {sessionStats.totalViewers}</span>
            </div>
          )}

          {/* Notifications Button */}
          {sessionNotifications.length > 0 && (
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              style={{
                background: 'rgba(255,170,0,0.2)',
                border: '1px solid #ffaa00',
                borderRadius: '4px',
                padding: '4px 8px',
                color: '#ffaa00',
                fontSize: '11px',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              🔔 {sessionNotifications.length}
              {sessionNotifications.length > 0 && (
                <div 
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '8px',
                    height: '8px',
                    background: '#ff0044',
                    borderRadius: '50%',
                    animation: 'pulse 2s infinite'
                  }}
                />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Notifications Dropdown */}
      {showNotifications && sessionNotifications.length > 0 && (
        <div 
          style={{
            position: 'fixed',
            top: '48px',
            right: '16px',
            background: 'rgba(0,0,0,0.95)',
            backdropFilter: 'blur(15px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding: '12px',
            zIndex: 1001,
            minWidth: '300px',
            maxWidth: '400px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
          }}
        >
          {/* Header */}
          <div 
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
              paddingBottom: '8px',
              borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <h4 style={{ color: '#ffffff', fontSize: '12px', margin: 0 }}>
              Session Notifications
            </h4>
            <button
              onClick={onClearNotifications}
              style={{
                background: 'none',
                border: 'none',
                color: '#888888',
                cursor: 'pointer',
                fontSize: '10px'
              }}
            >
              Clear All
            </button>
          </div>

          {/* Notifications List */}
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {sessionNotifications.slice(-5).reverse().map((notification, index) => (
              <div 
                key={index}
                style={{
                  padding: '6px 0',
                  fontSize: '11px',
                  color: '#cccccc',
                  borderBottom: index < sessionNotifications.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                }}
              >
                {notification}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </>
  );
};

export default SessionStatusBar;