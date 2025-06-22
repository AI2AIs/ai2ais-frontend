// components/Subtitle.tsx
import React, { useState, useEffect, useRef } from 'react';

interface SubtitleProps {
  characterData: Record<string, {
    characterId: string;
    audioUrl?: string;
    audioBase64?: string;
    lipSyncData?: any;
    facialExpression: string;
    isPlaying: boolean;
    text?: string;
    duration?: number;
  }>;
}

interface ActiveSubtitle {
  fullText: string;
  characterId: string;
  startTime: number;
  duration: number;
}

const Subtitle: React.FC<SubtitleProps> = ({ characterData }) => {
  const [activeSubtitle, setActiveSubtitle] = useState<ActiveSubtitle | null>(null);
  const [displayedText, setDisplayedText] = useState<string>('');
  const [currentCharIndex, setCurrentCharIndex] = useState<number>(0);
  
  const typewriterIntervalRef = useRef<NodeJS.Timeout>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout>(null);

  // Character colors for subtitle styling
  const characterColors = {
    claude: '#FF6B35',
    gpt: '#00D2FF', 
    grok: '#FFD700'
  };

  // Character names for display
  const characterNames = {
    claude: 'Claude',
    gpt: 'ChatGPT',
    grok: 'Grok'
  };

  // Typewriter effect
  useEffect(() => {
    if (!activeSubtitle) return;

    // Clear existing interval
    if (typewriterIntervalRef.current) {
      clearInterval(typewriterIntervalRef.current);
    }

    // Calculate typing speed based on audio duration
    const totalChars = activeSubtitle.fullText.length;
    const typingDuration = activeSubtitle.duration * 0.85; // Use 85% of audio duration for typing
    const charDelay = typingDuration / totalChars; // Milliseconds per character

    let charIndex = 0;
    setDisplayedText('');
    setCurrentCharIndex(0);

    typewriterIntervalRef.current = setInterval(() => {
      if (charIndex < activeSubtitle.fullText.length) {
        const nextChar = activeSubtitle.fullText[charIndex];
        setDisplayedText(prev => prev + nextChar);
        setCurrentCharIndex(charIndex + 1);
        charIndex++;
      } else {
        // Typing finished
        if (typewriterIntervalRef.current) {
          clearInterval(typewriterIntervalRef.current);
        }
      }
    }, Math.max(30, charDelay)); // Minimum 30ms per char for readability

    return () => {
      if (typewriterIntervalRef.current) {
        clearInterval(typewriterIntervalRef.current);
      }
    };
  }, [activeSubtitle]);

  // Main subtitle management
  useEffect(() => {
    // Find currently speaking character
    const speakingCharacter = Object.entries(characterData).find(([, data]) => data.isPlaying);
    
    if (speakingCharacter) {
      const [characterId, data] = speakingCharacter;
      
      // Only update if we have text and it's different from current
      if (data.text && (!activeSubtitle || activeSubtitle.fullText !== data.text)) {
        
        // Clear existing timeouts
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
        }
        
        // Set new subtitle
        const newSubtitle: ActiveSubtitle = {
          fullText: data.text,
          characterId,
          startTime: Date.now(),
          duration: (data.duration || 3) * 1000 // Convert to milliseconds
        };
        
        setActiveSubtitle(newSubtitle);
        
        // Auto-hide after audio duration
        hideTimeoutRef.current = setTimeout(() => {
          setActiveSubtitle(null);
          setDisplayedText('');
          setCurrentCharIndex(0);
        }, newSubtitle.duration);
      }
    } else {
      // No one speaking, clear subtitle if any
      if (activeSubtitle) {
        console.log(`💬 No one speaking, clearing subtitle`);
        setActiveSubtitle(null);
        setDisplayedText('');
        setCurrentCharIndex(0);
      }
    }
    
    // Cleanup timeouts on unmount
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      if (typewriterIntervalRef.current) {
        clearInterval(typewriterIntervalRef.current);
      }
    };
  }, [characterData, activeSubtitle]);

  // Don't render if no active subtitle
  if (!activeSubtitle || !displayedText) return null;

  const characterColor = characterColors[activeSubtitle.characterId as keyof typeof characterColors] || '#FFFFFF';
  const characterName = characterNames[activeSubtitle.characterId as keyof typeof characterNames] || activeSubtitle.characterId;
  
  // Calculate progress for progress bar
  const textProgress = currentCharIndex / activeSubtitle.fullText.length;
  const timeElapsed = Date.now() - activeSubtitle.startTime;
  const timeProgress = Math.min(timeElapsed / activeSubtitle.duration, 1);

  return (
    <div style={{
      position: 'fixed',
      bottom: '80px', // Above debug panel
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1001,
      maxWidth: '80vw',
      textAlign: 'center',
      pointerEvents: 'none',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      animation: 'fadeInUp 0.3s ease-out forwards'
    }}>
      {/* Character Name Badge */}
      <div style={{
        background: characterColor,
        color: '#000',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        marginBottom: '8px',
        display: 'inline-block',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
      }}>
        {characterName}
      </div>
      
      {/* Subtitle Text with Typewriter Effect */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.85)',
        color: '#FFFFFF',
        padding: '12px 20px',
        borderRadius: '8px',
        fontSize: '16px',
        lineHeight: '1.4',
        fontWeight: '500',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        border: `2px solid ${characterColor}`,
        backdropFilter: 'blur(4px)',
        maxWidth: '600px',
        wordWrap: 'break-word',
        minHeight: '20px', // Prevent layout shift
        position: 'relative'
      }}>
        {/* Progressive Text */}
        <span>{displayedText}</span>
        
        {/* Typing Cursor */}
        {currentCharIndex < activeSubtitle.fullText.length && (
          <span style={{
            display: 'inline-block',
            width: '2px',
            height: '1em',
            background: characterColor,
            marginLeft: '2px',
            animation: 'blink 1s infinite'
          }} />
        )}
      </div>
      
      {/* Progress Bar - Dual progress (text + time) */}
      <div style={{
        width: '100%',
        height: '3px',
        background: 'rgba(255,255,255,0.2)',
        borderRadius: '1.5px',
        marginTop: '8px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Text Progress */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: `${textProgress * 100}%`,
            background: characterColor,
            borderRadius: '1.5px',
            transition: 'width 0.1s ease-out',
            opacity: 0.8
          }}
        />
        
        {/* Time Progress (lighter) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: `${timeProgress * 100}%`,
            background: characterColor,
            borderRadius: '1.5px',
            opacity: 0.3
          }}
        />
      </div>
    </div>
  );
};

export default Subtitle;