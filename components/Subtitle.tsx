// Subtitle.tsx
import React, { useState, useEffect, useRef } from 'react';

interface SubtitleProps {
  characterData: Record<string, {
    characterId: string;
    audioUrl?: string;
    isPlaying: boolean;
    text?: string;
    duration?: number;
  }>;
}

const Subtitle: React.FC<SubtitleProps> = ({ characterData }) => {
  const [currentText, setCurrentText] = useState<string>('');
  const [currentCharacter, setCurrentCharacter] = useState<string>('');
  const [displayedText, setDisplayedText] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);
  
  const typewriterRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Character colors
  const characterColors = {
    claude: '#FF6B35',
    gpt: '#00D2FF', 
    grok: '#FFD700'
  };

  const characterNames = {
    claude: 'Claude',
    gpt: 'ChatGPT',
    grok: 'Grok'
  };

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor;
      const isMobileUA = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth <= 768;
      
      setIsMobile(isMobileUA || (isTouchDevice && isSmallScreen));
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  
  useEffect(() => {
    const speaking = Object.entries(characterData).find(([, data]) => data.isPlaying && data.text);
    
    if (speaking) {
      const [characterId, data] = speaking;
      
      if (data.text && data.text !== currentText) {
        setCurrentText(data.text);
        setCurrentCharacter(characterId);
        setDisplayedText('');
        
        // clear previous timers
        if (typewriterRef.current) {
          clearInterval(typewriterRef.current);
        }
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
        }
        
        // Typewriter effect
        const audioDuration = (data.duration || 3) * 1000;
        const textLength = data.text.length;
        const typingTime = isMobile ? audioDuration * 0.6 : audioDuration * 0.8; // Adjusted for mobile
        const charDelay = Math.max(isMobile ? 20 : 30, typingTime / textLength);
        
              
        let charIndex = 0;
        typewriterRef.current = setInterval(() => {
          if (charIndex < data.text!.length) {
            setDisplayedText(data.text!.substring(0, charIndex + 1));
            charIndex++;
          } else {
            clearInterval(typewriterRef.current!);
            
            // Hidden timeout for mobile
            if (isMobile) {
              hideTimeoutRef.current = setTimeout(() => {
                setCurrentText('');
                setCurrentCharacter('');
                setDisplayedText('');
              }, 2000);
            }
          }
        }, charDelay);
      }
    } else {
      // If no character is speaking, reset the state
      if (!isMobile) {
        setCurrentText('');
        setCurrentCharacter('');
        setDisplayedText('');
      }
      
      // Clear any existing typewriter effect
      if (typewriterRef.current) {
        clearInterval(typewriterRef.current);
      }
    }
  }, [characterData, currentText, isMobile]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (typewriterRef.current) {
        clearInterval(typewriterRef.current);
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  if (!currentText || !displayedText) {
    return null;
  }

  const characterColor = characterColors[currentCharacter as keyof typeof characterColors] || '#FFFFFF';
  const characterName = characterNames[currentCharacter as keyof typeof characterNames] || currentCharacter;

  // Render the subtitle component
  return (
    <>
      {/* Desktop Subtitle */}
      {!isMobile && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1001,
          maxWidth: '80vw',
          textAlign: 'center',
          pointerEvents: 'none'
        }}>
          {/* Character Name */}
          <div style={{
            background: characterColor,
            color: '#000',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600',
            marginBottom: '8px',
            display: 'inline-block'
          }}>
            {characterName}
          </div>
          
          {/* Subtitle Text */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.85)',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            border: `2px solid ${characterColor}`,
            maxWidth: '600px'
          }}>
            {displayedText}
            {displayedText.length < currentText.length && (
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
        </div>
      )}

      {/* Mobile Subtitle */}
      {isMobile && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '10px',
          right: '10px',
          zIndex: 1001,
          textAlign: 'center',
          pointerEvents: 'none'
        }}>
          {/* Compact Mobile Layout */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.9)',
            color: '#FFFFFF',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            border: `1px solid ${characterColor}`,
            backdropFilter: 'blur(10px)',
            maxHeight: '60px',
            overflow: 'hidden'
          }}>
            {/* Character name inline */}
            <span style={{
              color: characterColor,
              fontWeight: '600',
              marginRight: '6px',
              fontSize: '12px'
            }}>
              {characterName}:
            </span>
            
            {/* Text with ellipsis if too long */}
            <span style={{
              fontSize: '13px',
              lineHeight: '1.2'
            }}>
              {displayedText.length > 60 ? displayedText.substring(0, 57) + '...' : displayedText}
            </span>
            
            {displayedText.length < currentText.length && (
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
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </>
  );
};

export default Subtitle;