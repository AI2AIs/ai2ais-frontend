import { useEffect, useState } from "react";
import OceanBackground from "./components/OceanBackground";
import './App.css';
import BabyCharacter from "./components/BabyCharacter";
import HealthBar from "./components/HealthBar";
import Subtitle from "./components/Subtitle";
import { useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";
import { MainCharacter } from "./components/MainCharacter";
import { useWebSocket } from "./hooks/useWebSocket";

function App() {
  const claudeLogoTexture = useLoader(TextureLoader, '/logos/claude.png');
  const grokLogoTexture = useLoader(TextureLoader, '/logos/grok.png');
  const chatgptLogoTexture = useLoader(TextureLoader, '/logos/chatgpt.png');
  
  // WebSocket hook
  const { isConnected, characterData, joinSession, requestResponse, error } = useWebSocket();
  
  // Session management
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentSessionId, setCurrentSessionId] = useState<string>('demo-session-123');
  const [autoTrigger, setAutoTrigger] = useState(false);

  // Session'a katıl (component mount'ta)
  useEffect(() => {
    if (isConnected && currentSessionId) {
      joinSession(currentSessionId);
    }
  }, [isConnected, currentSessionId, joinSession]);

  useEffect(() => {
    if (!autoTrigger || !isConnected) return;

    const interval = setInterval(() => {
      const characters = ['claude', 'gpt', 'grok'];
      const randomCharacter = characters[Math.floor(Math.random() * characters.length)];
      requestResponse(currentSessionId, randomCharacter);
    }, 8000); 

    return () => clearInterval(interval);
  }, [autoTrigger, isConnected, currentSessionId, requestResponse]);

  const fallbackLipSyncData = {
    metadata: { duration: 3.0 },
    mouthCues: [
      { start: 0.1, end: 0.3, value: "A" },
      { start: 0.4, end: 0.6, value: "B" },
      { start: 0.7, end: 0.9, value: "C" },
      { start: 1.0, end: 1.2, value: "D" },
      { start: 1.3, end: 1.5, value: "E" },
      { start: 1.6, end: 1.8, value: "F" },
      { start: 1.9, end: 2.1, value: "G" },
      { start: 2.2, end: 2.5, value: "X" },
    ],
  };

  return (
    <>
      {/* Subtitle Overlay */}
      <Subtitle characterData={characterData} />

      {/* Debug UI */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontFamily: 'monospace',
        fontSize: '12px'
      }}>
        <div>🔗 WebSocket: {isConnected ? '✅ Connected' : '❌ Disconnected'}</div>
        <div>📡 Session: {currentSessionId}</div>
        {error && <div style={{color: 'red'}}>❌ Error: {error}</div>}
        
        <div style={{ marginTop: '10px' }}>
          <button 
            onClick={() => setAutoTrigger(!autoTrigger)}
            style={{ 
              background: autoTrigger ? '#ff4444' : '#44ff44',
              color: 'white',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '3px',
              cursor: 'pointer',
              marginRight: '5px'
            }}
          >
            {autoTrigger ? '⏹️ Stop Auto' : '▶️ Start Auto'}
          </button>
          
          <button 
            onClick={() => requestResponse(currentSessionId, 'claude')}
            style={{ 
              background: '#4444ff',
              color: 'white',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '3px',
              cursor: 'pointer',
              marginRight: '5px'
            }}
          >
            🎯 Claude Speak
          </button>
          
          <button 
            onClick={() => requestResponse(currentSessionId)}
            style={{ 
              background: '#ff8844',
              color: 'white',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            🎲 Random Speak
          </button>
        </div>

        {/* Character Status */}
        <div style={{ marginTop: '10px', fontSize: '10px' }}>
          {Object.entries(characterData).map(([id, data]) => (
            <div key={id} style={{ 
              color: data.isPlaying ? '#44ff44' : '#888',
              display: 'flex',
              justifyContent: 'space-between',
              width: '200px'
            }}>
              <span>{id.toUpperCase()}</span>
              <span>{data.isPlaying ? '🎵 Playing' : '💤 Idle'}</span>
              <span>{data.facialExpression}</span>
            </div>
          ))}
          
          {/* BabyCharacter Status */}
          <div style={{ 
            marginTop: '8px', 
            padding: '4px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '3px'
          }}>
            <div style={{ color: '#ffd700', fontSize: '11px' }}>
              👶 BabyCharacter: {Object.values(characterData).some(char => char.isPlaying) ? '🌟 REACTIVE' : '😴 IDLE'}
            </div>
            <div style={{ color: '#aaa', fontSize: '9px' }}>
              Current Speaker: {Object.entries(characterData).find(([id, data]) => data.isPlaying)?.[0] || 'none'}
            </div>
          </div>
        </div>
      </div>

      <OceanBackground>       
        {/* Grok Character */}
        <group position={[-15, 15, 0]} scale={[3, 3, 3]} rotation={[0, 0.15, -0.05]}>
          <MainCharacter 
          facialExpression={characterData.grok?.facialExpression || "mischievous"}
            enableIdleAnimations={!characterData.grok?.isPlaying}
            lipSyncData={characterData.grok?.lipSyncData || (characterData.grok?.isPlaying ? fallbackLipSyncData : undefined)}
            audioUrl={characterData.grok?.audioUrl}
          />
          
          <mesh position={[0, 2.5, 0]} scale={[0.8, 0.8, 0.8]}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial 
              map={grokLogoTexture} 
              transparent 
              alphaTest={0.1}
            />
          </mesh>
          
          <HealthBar 
            currentHealth={75}
            maxHealth={100}
            position={[0, -2, 0]}
            width={2}     
            height={0.2}
          />
        </group>
        
        {/* GPT Character */}
        <group position={[0, 15, 0]} scale={[3, 3, 3]} rotation={[0, 0, 0]}>
          <MainCharacter 
            facialExpression={characterData.gpt?.facialExpression || "happy"}
            enableIdleAnimations={!characterData.gpt?.isPlaying}
            lipSyncData={characterData.gpt?.lipSyncData || (characterData.gpt?.isPlaying ? fallbackLipSyncData : undefined)}
            audioUrl={characterData.gpt?.audioUrl}
          />
          
          <mesh position={[0, 2.5, 0]} scale={[0.8, 0.8, 0.8]}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial 
              map={chatgptLogoTexture} 
              transparent 
              alphaTest={0.1}
            />
          </mesh>
          
          <HealthBar 
            currentHealth={85}
            maxHealth={100}
            position={[0, -2, 0]}
            width={2}     
            height={0.2}
          />
        </group>

        {/* Claude Character */}
        <group position={[15, 15, 0]} scale={[3, 3, 3]} rotation={[0, -0.15, 0.05]}>
          <MainCharacter         
            facialExpression={characterData.claude?.facialExpression || "thinking"}
            enableIdleAnimations={!characterData.claude?.isPlaying}
            lipSyncData={characterData.claude?.lipSyncData || (characterData.claude?.isPlaying ? fallbackLipSyncData : undefined)}
            audioUrl={characterData.claude?.audioUrl}
          />
          
          <mesh position={[0, 2.5, 0]} scale={[0.8, 0.8, 0.8]}>
            <planeGeometry args={[1, 1]} />
             <meshBasicMaterial 
              map={claudeLogoTexture} 
              transparent 
              alphaTest={0.1}
            />
          </mesh>
          
          <HealthBar 
            currentHealth={10}
            maxHealth={100}
            position={[0, -2, 0]}
            width={2}     
            height={0.2}
          />
        </group>

        {/* Baby Character (Reactive to WebSocket Audio) */}
        <mesh position={[0, 8, 10]}>
          <BabyCharacter
            externalAudioData={{
              isAnyCharacterSpeaking: Object.values(characterData).some(char => char.isPlaying),
              currentSpeaker: Object.entries(characterData).find(([id, data]) => data.isPlaying)?.[0],
              audioFrequency: 0, // Could add real frequency analysis here
              audioVolume: 0.5
            }}
          />
        </mesh>
      </OceanBackground>
    </>
  );
}

export default App;