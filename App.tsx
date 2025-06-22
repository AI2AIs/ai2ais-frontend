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

      <OceanBackground>       
        {/* Grok Character */}
        <group position={[-15, 15, 0]} scale={[3, 3, 3]} rotation={[0, 0.15, -0.05]}>
          <MainCharacter 
          facialExpression={characterData.grok?.facialExpression}
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
            facialExpression={characterData.gpt?.facialExpression}
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
            facialExpression={characterData.claude?.facialExpression}
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