// src/components/session/SessionCard.tsx

import React from 'react';
import type { AutoSession } from '@/types/session';

interface SessionCardProps {
  session: AutoSession;
  isActive?: boolean;
  onJoin: () => void;
}

const SessionCard: React.FC<SessionCardProps> = ({ 
  session, 
  isActive = false, 
  onJoin 
}) => {
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just started';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return '#00ff88';
      case 'starting': return '#ffaa00';
      case 'ending': return '#ff4400';
      case 'ended': return '#666666';
      default: return '#888888';
    }
  };

  const getEnergyColor = (energy: number): string => {
    if (energy > 70) return '#00ff88';
    if (energy > 40) return '#ffaa00';
    if (energy > 20) return '#ff6600';
    return '#ff0044';
  };

  return (
    <div 
      className={`session-card ${isActive ? 'active' : ''}`}
      style={{
        background: isActive 
          ? 'linear-gradient(135deg, rgba(0,255,136,0.1) 0%, rgba(0,210,255,0.1) 100%)'
          : 'rgba(255,255,255,0.05)',
        border: isActive 
          ? '2px solid #00ff88'
          : '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '16px',
        margin: '8px 0',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        backdropFilter: 'blur(10px)',
        position: 'relative',
        overflow: 'hidden'
      }}
      onClick={onJoin}
    >
      {/* Live indicator */}
      {session.isLive && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: '#ff0044',
            color: 'white',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '10px',
            fontWeight: '600',
            animation: 'pulse 2s infinite'
          }}
        >
          LIVE
        </div>
      )}

      {/* Session Header */}
      <div style={{ marginBottom: '12px' }}>
        <h3 
          style={{
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: '600',
            margin: '0 0 4px 0',
            lineHeight: '1.3',
            paddingRight: session.isLive ? '60px' : '0'
          }}
        >
          {session.topic}
        </h3>
        
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px',
            color: '#888888'
          }}
        >
          <span>Session {session.id.split('-').pop()}</span>
          <span>•</span>
          <span>{formatTimeAgo(session.createdAt)}</span>
          <span>•</span>
          <span 
            style={{ 
              color: getStatusColor(session.status),
              fontWeight: '500'
            }}
          >
            {session.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Participants */}
      <div style={{ marginBottom: '12px' }}>
        <div 
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}
        >
          {session.participants.map((participant, index) => (
            <React.Fragment key={participant}>
              <span 
                style={{
                  color: participant === 'claude' ? '#FF6B35' :
                        participant === 'gpt' ? '#00D2FF' :
                        participant === 'grok' ? '#FFD700' : '#ffffff',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                {participant.toUpperCase()}
              </span>
              {index < session.participants.length - 1 && (
                <span style={{ color: '#666666', fontSize: '10px' }}>vs</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Energy Levels */}
      <div style={{ marginBottom: '12px' }}>
        <div 
          style={{
            display: 'flex',
            gap: '6px',
            alignItems: 'center'
          }}
        >
          {Object.entries(session.energyLevels || {}).map(([character, energy]) => (
            <div key={character} style={{ flex: 1 }}>
              <div 
                style={{
                  fontSize: '9px',
                  color: '#888888',
                  marginBottom: '2px',
                  textTransform: 'uppercase'
                }}
              >
                {character}
              </div>
              <div 
                style={{
                  height: '4px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}
              >
                <div 
                  style={{
                    height: '100%',
                    width: `${energy}%`,
                    background: getEnergyColor(energy),
                    borderRadius: '2px',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress & Stats */}
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '10px',
          color: '#666666'
        }}
      >
        <span>
          Round {session.currentRound}/{session.maxRounds}
        </span>
        
        {session.viewerCount !== undefined && (
          <span>
            👥 {session.viewerCount} viewers
          </span>
        )}
        
        <span>
          {Math.round(session.estimatedDuration / 60)}min
        </span>
      </div>

      {/* Join Button Overlay */}
      {!isActive && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
            transition: 'opacity 0.3s ease',
            color: '#ffffff',
            fontWeight: '600',
            fontSize: '12px'
          }}
          className="join-overlay"
        >
          Join Debate
        </div>
      )}

      {/* CSS for hover effect */}
      <style jsx>{`
        .session-card:hover .join-overlay {
          opacity: 1;
        }
        
        .session-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default SessionCard;