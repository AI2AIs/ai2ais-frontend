// hooks/useWebSocket.ts

import { useState, useEffect, useRef, useCallback } from 'react';
import type { LipSyncData } from '@/types/character';

interface WebSocketMessage {
  type: 'new_message' | 'session_update' | 'audio_ready' | 'error';
  sessionId: string;
  data: {
    message?: {
      characterId: string;
      text: string;
      audioBase64?: string;
      audioUrl?: string;
      lipSync?: LipSyncData;
      facialExpression: string;
      duration?: number;
    };
  };
  timestamp: number;
}

interface CharacterAudioData {
  characterId: string;
  audioUrl?: string;
  audioBase64?: string;
  lipSyncData?: LipSyncData;
  facialExpression: string;
  isPlaying: boolean;
  text?: string; 
  duration?: number;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  characterData: Record<string, CharacterAudioData>;
  joinSession: (sessionId: string) => void;
  requestResponse: (sessionId: string, characterId?: string) => void;
  error: string | null;
  audioPermissionGranted: boolean;
  requestAudioPermission: () => Promise<void>;
}

export const useWebSocket = (wsUrl: string = import.meta.env.VITE_BACKEND_WSS!): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioPermissionGranted, setAudioPermissionGranted] = useState(false);
  const [characterData, setCharacterData] = useState<Record<string, CharacterAudioData>>({
    claude: { characterId: 'claude', isPlaying: false, facialExpression: 'thinking' },
    gpt: { characterId: 'gpt', isPlaying: false, facialExpression: 'happy' },
    grok: { characterId: 'grok', isPlaying: false, facialExpression: 'mischievous' }
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>(null);
  const audioObjectUrls = useRef<Set<string>>(new Set());
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Mobile context
  const audioContextRef = useRef<AudioContext | null>(null);
  const isMobileRef = useRef(false);

  // Mobil Detect
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor;
      const isMobileUA = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth <= 768;
      
      isMobileRef.current = isMobileUA || (isTouchDevice && isSmallScreen);
      console.log('Mobile detection:', isMobileRef.current);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Audio permission ve context initialization
  const requestAudioPermission = useCallback(async () => {
    try {
      console.log('Requesting audio permission for mobile...');
      
      // Audio context
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error('AudioContext not supported');
      }

      audioContextRef.current = new AudioContextClass();
      
      // Suspended state
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
        console.log('✅ AudioContext resumed');
      }

      // Test audio playback
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      gainNode.gain.value = 0.01; // Slightly audible
      oscillator.frequency.value = 440; // A4 note
      
      oscillator.start();
      oscillator.stop(audioContextRef.current.currentTime + 0.1); // 100ms
      
      setAudioPermissionGranted(true);
      console.log('Audio permission granted and tested');
      
    } catch (err) {
      console.error('Audio permission failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Audio permission denied';
      setError(`Audio permission denied. Please enable audio and refresh. (${errorMessage})`);
    }
  }, []);

  const playAudioWithMobileSupport = useCallback(async (audioUrl: string, characterId: string): Promise<HTMLAudioElement | null> => {
    try {
      console.log(`Playing audio for ${characterId} (Mobile: ${isMobileRef.current})`);

      if (isMobileRef.current && audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
        console.log('🔄 Resumed audio context for mobile');
      }

      const audio = new Audio();
      
      if (isMobileRef.current) {
        audio.preload = 'auto';
        audio.volume = 1.0;
        // iOS volume lock bypass
        audio.muted = false;
        // TypeScript explicit casting
        (audio as any).playsInline = true;
        (audio as any).webkitPlaysInline = true; // Old iOS support
      } else {
        audio.preload = 'metadata';
        audio.volume = 0.8;
      }

      // CORS
      audio.crossOrigin = 'anonymous';
      audio.src = audioUrl;

      
      return new Promise((resolve, reject) => {
        const loadTimeout = setTimeout(() => {
          reject(new Error('Audio loading timeout'));
        }, 10000); 

        audio.addEventListener('canplaythrough', async () => {
          clearTimeout(loadTimeout);
          
          try {
            
            if (isMobileRef.current) {
              if (/iPhone|iPad|iPod|Mac OS X/i.test(navigator.userAgent)) {
                audio.currentTime = 0;
                audio.volume = 1.0;
              }
              
              if (/Android/i.test(navigator.userAgent)) {
                audio.volume = 1.0;
              }
            }

            console.log(`Audio loaded for ${characterId}, attempting play...`);
            await audio.play();
            console.log(`Audio playing for ${characterId}`);
            resolve(audio);
            
          } catch (playError) {
            console.error(`Audio play failed for ${characterId}:`, playError);
            
            if (isMobileRef.current) {
              try {
                console.log('Retrying audio play on mobile...');
                await new Promise(resolve => setTimeout(resolve, 100));
                await audio.play();
                console.log(`Audio retry successful for ${characterId}`);
                resolve(audio);
              } catch (retryError) {
                console.error(`Audio retry failed for ${characterId}:`, retryError);
                const retryErrorMessage = retryError instanceof Error ? retryError.message : 'Audio retry failed';
                reject(new Error(`Audio retry failed: ${retryErrorMessage}`));
              }
            } else {
              reject(playError);
            }
          }
        }, { once: true });

        audio.addEventListener('error', (e) => {
          clearTimeout(loadTimeout);
          console.error(`Audio loading failed for ${characterId}:`, e);
          reject(new Error(`Audio loading failed: ${audio.error?.message}`));
        }, { once: true });

        audio.load();
      });

    } catch (err) {
      console.error(`Audio setup failed for ${characterId}:`, err);
      return null;
    }
  }, []);

  const connect = useCallback(() => {
    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (err) {
          console.error('WebSocket message parse error:', err);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      wsRef.current.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError('WebSocket connection failed');
      };

    } catch (err) {
      console.error('WebSocket connect error:', err);
      setError('Failed to connect to WebSocket');
    }
  }, [wsUrl]);

  const handleWebSocketMessage = useCallback(async (message: WebSocketMessage) => {
    if (message.type === 'new_message' && message.data.message) {
      const { characterId, lipSync, facialExpression, audioBase64, audioUrl, duration, text } = message.data.message;
      
      console.log('Received message for:', characterId);
      
      if (isMobileRef.current && !audioPermissionGranted) {
        console.warn('⚠️ Audio permission not granted on mobile, requesting...');
        await requestAudioPermission();
      }
    
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current = null;
      }
      
      let finalAudioUrl = audioUrl;
      if (audioBase64 && !audioUrl) {
        const audioBlob = base64ToBlob(audioBase64, 'audio/wav');
        finalAudioUrl = URL.createObjectURL(audioBlob);
        audioObjectUrls.current.add(finalAudioUrl);
      }

      setCharacterData(prev => {
        const updated = { ...prev };
        
        Object.keys(updated).forEach(id => {
          updated[id] = { ...updated[id], isPlaying: false, text: undefined };
        });
        
        updated[characterId] = {
          characterId,
          audioUrl: finalAudioUrl,
          audioBase64,
          lipSyncData: lipSync,
          facialExpression: facialExpression || 'neutral',
          isPlaying: true,
          text: text, 
          duration: duration 
        };
        
        return updated;
      });

      if (finalAudioUrl) {
        try {
          const audio = await playAudioWithMobileSupport(finalAudioUrl, characterId);
          
          if (audio) {
            currentAudioRef.current = audio;
            
            audio.onended = () => {
              console.log(`🔇 Audio ended for ${characterId}`);
              setCharacterData(prev => ({
                ...prev,
                [characterId]: { ...prev[characterId], isPlaying: false, text: undefined }
              }));
              currentAudioRef.current = null;
            };

            if (isMobileRef.current) {
              audio.onpause = () => {
                console.log(`⏸️ Audio paused for ${characterId}`);
              };
              
              audio.onplay = () => {
                console.log(`▶️ Audio resumed for ${characterId}`);
              };
            }
          }
        } catch (audioError) {
          console.error('Audio play failed:', audioError);
          const errorMessage = audioError instanceof Error ? audioError.message : 'Audio playback failed';
          setError(`Audio playback failed: ${errorMessage}`);
          
          
          setCharacterData(prev => ({
            ...prev,
            [characterId]: { ...prev[characterId], isPlaying: false, text: undefined }
          }));
        }
      }
    }
  }, [audioPermissionGranted, requestAudioPermission, playAudioWithMobileSupport]);

  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  const joinSession = useCallback((sessionId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'join_session',
        data: { sessionId },
        timestamp: Date.now()
      }));
      console.log('Joined session:', sessionId);
    }
  }, []);

  const requestResponse = useCallback((sessionId: string, characterId?: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'request_response',
        data: { sessionId, characterId },
        timestamp: Date.now()
      }));
      console.log('Requested response for:', characterId);
    }
  }, []);

  useEffect(() => {
    if (isMobileRef.current && !audioPermissionGranted) {
      const handleFirstTouch = () => {
        requestAudioPermission();
        document.removeEventListener('touchstart', handleFirstTouch);
        document.removeEventListener('click', handleFirstTouch);
      };

      document.addEventListener('touchstart', handleFirstTouch, { once: true });
      document.addEventListener('click', handleFirstTouch, { once: true });

      return () => {
        document.removeEventListener('touchstart', handleFirstTouch);
        document.removeEventListener('click', handleFirstTouch);
      };
    }
  }, [audioPermissionGranted, requestAudioPermission]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      
      audioObjectUrls.current.forEach(url => URL.revokeObjectURL(url));
      audioObjectUrls.current.clear();
      
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    isConnected,
    characterData,
    joinSession,
    requestResponse,
    error,
    audioPermissionGranted,
    requestAudioPermission
  };
};