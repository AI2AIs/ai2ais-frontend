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
}

export const useWebSocket = (wsUrl: string = import.meta.env.VITE_BACKEND_WSS!): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [characterData, setCharacterData] = useState<Record<string, CharacterAudioData>>({
    claude: { characterId: 'claude', isPlaying: false, facialExpression: 'thinking' },
    gpt: { characterId: 'gpt', isPlaying: false, facialExpression: 'happy' },
    grok: { characterId: 'grok', isPlaying: false, facialExpression: 'mischievous' }
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>(null);
  const audioObjectUrls = useRef<Set<string>>(new Set());
  
  
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

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

const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
  if (message.type === 'new_message' && message.data.message) {
    const { characterId, lipSync, facialExpression, audioBase64, audioUrl, duration, text } = message.data.message;
    
    console.log(message.data.message)
  
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

    // Audio çal
    if (finalAudioUrl) {
      const audio = new Audio(finalAudioUrl);
      currentAudioRef.current = audio;
      
      audio.play().catch(err => console.log('Audio play failed:', err));
      
      audio.onended = () => {
        setCharacterData(prev => ({
          ...prev,
          [characterId]: { ...prev[characterId], isPlaying: false, text: undefined }
        }));
        currentAudioRef.current = null;
      };
    }
  }
}, []);

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
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
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
    error
  };
};