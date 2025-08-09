// components/TestWebSocketComponent.tsx - Test component for debugging
import React from 'react';
import { useWebSocketFixed } from '../hooks/useWebSocket';

const TestWebSocketComponent: React.FC = () => {
  const {
    isConnected,
    characterData,
    currentSpeaker,
    isAnyCharacterSpeaking,
    queueLength,
    joinSession,
    sendTestMessage,
    clearQueue,
    skipCurrent,
    error
  } = useWebSocketFixed();

  const handleJoinSession = () => {
    joinSession('test-session');
  };

  const handleTestSingle = (characterId: string) => {
    sendTestMessage('test_single_character', {
      characterId,
      text: `This is a test message from ${characterId}. Testing the audio queue system!`,
      emotion: 'neutral'
    });
  };

  const handleTestSequence = () => {
    sendTestMessage('test_sequence');
  };

  const handleTestRapidFire = () => {
    sendTestMessage('test_rapid_fire');
  };

  const handleTestTimingFix = () => {
    sendTestMessage('test_timing_fix');
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'rgba(0,0,0,0.9)',
      color: 'white',
      padding: '20px',
      borderRadius: '10px',
      border: '1px solid #333',
      minWidth: '300px',
      zIndex: 1000,
      fontFamily: 'monospace',
      fontSize: '12px'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#00ff88' }}>🧪 WebSocket Test Panel</h3>
      
      {/* Connection Status */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{
          color: isConnected ? '#00ff88' : '#ff4444',
          fontWeight: 'bold'
        }}>
          Connection: {isConnected ? '✅ CONNECTED' : '❌ DISCONNECTED'}
        </div>
        {error && (
          <div style={{ color: '#ff4444', marginTop: '5px' }}>
            Error: {error}
          </div>
        )}
      </div>

      {/* Audio Queue Status */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ color: '#ffaa00', fontWeight: 'bold' }}>
          🎵 Audio Queue Status:
        </div>
        <div>Speaking: {isAnyCharacterSpeaking ? '✅ YES' : '❌ NO'}</div>
        <div>Current Speaker: {currentSpeaker || 'None'}</div>
        <div>Queue Length: {queueLength}</div>
      </div>

      {/* Character States */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ color: '#00d2ff', fontWeight: 'bold' }}>
          🎭 Character States:
        </div>
        {Object.entries(characterData).map(([id, data]) => (
          <div key={id} style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '3px',
            color: data.isPlaying ? '#00ff88' : '#666'
          }}>
            <span>{id.toUpperCase()}</span>
            <span>{data.isPlaying ? '🎤 SPEAKING' : '😐 IDLE'}</span>
          </div>
        ))}
      </div>

      {/* Control Buttons */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ color: '#ffaa00', fontWeight: 'bold', marginBottom: '10px' }}>
          🎮 Controls:
        </div>
        
        <button
          onClick={handleJoinSession}
          disabled={!isConnected}
          style={{
            background: '#333',
            color: 'white',
            border: '1px solid #555',
            padding: '5px 10px',
            margin: '2px',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          📡 Join Session
        </button>

        <div style={{ marginTop: '10px' }}>
          <div style={{ marginBottom: '5px', color: '#ccc' }}>Single Character Tests:</div>
          {['claude', 'gpt', 'grok'].map(character => (
            <button
              key={character}
              onClick={() => handleTestSingle(character)}
              disabled={!isConnected}
              style={{
                background: '#333',
                color: '#00ff88',
                border: '1px solid #555',
                padding: '3px 8px',
                margin: '1px',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '10px'
              }}
            >
              {character.toUpperCase()}
            </button>
          ))}
        </div>

        <div style={{ marginTop: '10px' }}>
          <div style={{ marginBottom: '5px', color: '#ccc' }}>Sequence Tests:</div>
          <button
            onClick={handleTestSequence}
            disabled={!isConnected}
            style={{
              background: '#333',
              color: '#ffaa00',
              border: '1px solid #555',
              padding: '5px 10px',
              margin: '2px',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '11px',
              width: '100%'
            }}
          >
            🎭 Test Sequence (Proper)
          </button>
          
          <button
            onClick={handleTestRapidFire}
            disabled={!isConnected}
            style={{
              background: '#333',
              color: '#ff4444',
              border: '1px solid #555',
              padding: '5px 10px',
              margin: '2px',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '11px',
              width: '100%'
            }}
          >
            🔥 Rapid Fire (Problematic)
          </button>
          
          <button
            onClick={handleTestTimingFix}
            disabled={!isConnected}
            style={{
              background: '#333',
              color: '#00d2ff',
              border: '1px solid #555',
              padding: '5px 10px',
              margin: '2px',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '11px',
              width: '100%'
            }}
          >
            ✅ Timing Fix (Solution)
          </button>
        </div>

        <div style={{ marginTop: '10px' }}>
          <div style={{ marginBottom: '5px', color: '#ccc' }}>Queue Controls:</div>
          <button
            onClick={skipCurrent}
            disabled={!currentSpeaker}
            style={{
              background: '#333',
              color: '#ffaa00',
              border: '1px solid #555',
              padding: '3px 8px',
              margin: '1px',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '10px'
            }}
          >
            ⏭️ Skip
          </button>
          
          <button
            onClick={clearQueue}
            style={{
              background: '#333',
              color: '#ff4444',
              border: '1px solid #555',
              padding: '3px 8px',
              margin: '1px',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '10px'
            }}
          >
            🧹 Clear
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div style={{ 
        marginTop: '15px', 
        padding: '10px', 
        background: 'rgba(0,255,136,0.1)', 
        border: '1px solid rgba(0,255,136,0.3)',
        borderRadius: '5px'
      }}>
        <div style={{ color: '#00ff88', fontWeight: 'bold', marginBottom: '5px' }}>
          📝 Instructions:
        </div>
        <div style={{ fontSize: '10px', lineHeight: '1.4' }}>
          1. Make sure core server is running<br/>
          2. Click "Join Session" first<br/>
          3. Test individual characters<br/>
          4. Compare "Rapid Fire" vs "Timing Fix"<br/>
          5. Audio should never overlap!
        </div>
      </div>
    </div>
  );
};

export default TestWebSocketComponent;