// hooks/useAudioQueue.ts - Audio queue system to prevent overlap
import { useState, useRef, useCallback, useEffect } from 'react';

interface AudioQueueItem {
  id: string;
  characterId: string;
  text: string;
  audioUrl?: string;
  audioBase64?: string;
  lipSyncData?: any;
  facialExpression: string;
  duration: number;
  timestamp: number;
}

interface ActiveAudio {
  item: AudioQueueItem;
  startTime: number;
  audioElement: HTMLAudioElement;
}

interface UseAudioQueueReturn {
  isAnyCharacterSpeaking: boolean;
  currentSpeaker: string | null;
  queueLength: number;
  activeAudio: ActiveAudio | null;
  addToQueue: (item: AudioQueueItem) => void;
  clearQueue: () => void;
  skipCurrent: () => void;
}

export const useAudioQueue = (): UseAudioQueueReturn => {
  const [queue, setQueue] = useState<AudioQueueItem[]>([]);
  const [activeAudio, setActiveAudio] = useState<ActiveAudio | null>(null);
  const [isAnyCharacterSpeaking, setIsAnyCharacterSpeaking] = useState(false);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioObjectUrls = useRef<Set<string>>(new Set());

  // Helper function to convert base64 to blob URL
  const base64ToBlob = useCallback((base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }, []);

  // Create audio URL from base64 or return existing URL
  const createAudioUrl = useCallback((item: AudioQueueItem): string => {
    if (item.audioUrl) {
      return item.audioUrl;
    }
    
    if (item.audioBase64) {
      const audioBlob = base64ToBlob(item.audioBase64, 'audio/wav');
      const audioUrl = URL.createObjectURL(audioBlob);
      audioObjectUrls.current.add(audioUrl);
      return audioUrl;
    }
    
    throw new Error('No audio data provided');
  }, [base64ToBlob]);

  // Play next item in queue
  const playNextItem = useCallback(async () => {
    if (queue.length === 0 || activeAudio) {
      return;
    }

    console.log('Audio Queue: Playing next item');
    
    const nextItem = queue[0];
    setQueue(prev => prev.slice(1)); // Remove first item

    try {
      // Create audio element
      const audioUrl = createAudioUrl(nextItem);
      const audioElement = new Audio(audioUrl);
      
      // Set up audio element
      audioElement.preload = 'auto';
      
      // Wait for audio to load
      await new Promise<void>((resolve, reject) => {
        audioElement.addEventListener('canplaythrough', () => resolve(), { once: true });
        audioElement.addEventListener('error', reject, { once: true });
        audioElement.load();
      });

      console.log(`Starting playback: ${nextItem.characterId}`);
      console.log(`Text: ${nextItem.text}`);
      console.log(`Duration: ${nextItem.duration}s`);

      // Start playback
      await audioElement.play();
      
      const activeAudioItem: ActiveAudio = {
        item: nextItem,
        startTime: Date.now(),
        audioElement
      };
      
      setActiveAudio(activeAudioItem);
      setIsAnyCharacterSpeaking(true);

      // Schedule cleanup after duration
      timeoutRef.current = setTimeout(() => {
        console.log(`🔇 Ending playback: ${nextItem.characterId}`);
        
        // Clean up audio
        audioElement.pause();
        audioElement.src = '';
        
        // Clean up state
        setActiveAudio(null);
        setIsAnyCharacterSpeaking(false);
        
        // Clear timeout ref
        timeoutRef.current = null;
        
        // Play next item after 500ms gap
        setTimeout(() => {
          playNextItem();
        }, 500);
        
      }, nextItem.duration * 1000);

    } catch (error) {
      console.error(`Audio playback failed for ${nextItem.characterId}:`, error);
      
      // Clean up and try next
      setActiveAudio(null);
      setIsAnyCharacterSpeaking(false);
      
      setTimeout(() => {
        playNextItem();
      }, 1000);
    }
  }, [queue, activeAudio, createAudioUrl]);

  // Add item to queue
  const addToQueue = useCallback((item: AudioQueueItem) => {
    console.log(`Audio Queue: Adding ${item.characterId} to queue`);
    console.log(`Text: ${item.text}`);
    console.log(`Duration: ${item.duration}s`);
    
    setQueue(prev => {
      const newQueue = [...prev, item];
      console.log(`📊 Queue length: ${newQueue.length}`);
      return newQueue;
    });
  }, []);

  // Clear queue
  const clearQueue = useCallback(() => {
    console.log('Audio Queue: Clearing queue');
    
    // Stop current audio
    if (activeAudio) {
      activeAudio.audioElement.pause();
      activeAudio.audioElement.src = '';
    }
    
    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Clear state
    setQueue([]);
    setActiveAudio(null);
    setIsAnyCharacterSpeaking(false);
  }, [activeAudio]);

  // Skip current audio
  const skipCurrent = useCallback(() => {
    if (!activeAudio) return;
    
    console.log(`Audio Queue: Skipping ${activeAudio.item.characterId}`);
    
    // Stop current audio
    activeAudio.audioElement.pause();
    activeAudio.audioElement.src = '';
    
    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Clear state
    setActiveAudio(null);
    setIsAnyCharacterSpeaking(false);
    
    // Play next after short delay
    setTimeout(() => {
      playNextItem();
    }, 200);
  }, [activeAudio, playNextItem]);

  // Auto-play when queue has items and nothing is playing
  useEffect(() => {
    if (queue.length > 0 && !activeAudio) {
      console.log('Audio Queue: Auto-playing next item');
      playNextItem();
    }
  }, [queue.length, activeAudio, playNextItem]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Clean up audio
      if (activeAudio) {
        activeAudio.audioElement.pause();
        activeAudio.audioElement.src = '';
      }
      
      // Clean up object URLs
      audioObjectUrls.current.forEach(url => URL.revokeObjectURL(url));
      audioObjectUrls.current.clear();
    };
  }, []);

  return {
    isAnyCharacterSpeaking,
    currentSpeaker: activeAudio?.item.characterId || null,
    queueLength: queue.length,
    activeAudio,
    addToQueue,
    clearQueue,
    skipCurrent
  };
};