// Subtitle.tsx - BASIT ÇÖZÜM

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
  
  const typewriterRef = useRef<NodeJS.Timeout | null>(null);

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

  // ✅ BASIT FIX: Sadece konuşan karakteri bul
  useEffect(() => {
    const speaking = Object.entries(characterData).find(([, data]) => data.isPlaying && data.text);
    
    if (speaking) {
      const [characterId, data] = speaking;
      
      // Yeni text geldi
      if (data.text !== currentText) {
        setCurrentText(data.text);
        setCurrentCharacter(characterId);
        setDisplayedText('');
        
        // Typewriter başlat
        if (typewriterRef.current) {
          clearInterval(typewriterRef.current);
        }
        
        // ✅ SENKRON FIX: Audio süresine göre typewriter hızı
        const audioDuration = (data.duration || 3) * 1000; // ms
        const textLength = data.text!.length;
        const typingTime = audioDuration * 0.8; // Audio'nun %80'i için yazı
        const charDelay = Math.max(30, typingTime / textLength); // Min 30ms
        
        console.log(`📝 Typewriter: ${textLength} chars in ${typingTime}ms = ${charDelay}ms per char`);
        
        let charIndex = 0;
        typewriterRef.current = setInterval(() => {
          if (charIndex < data.text!.length) {
            setDisplayedText(data.text!.substring(0, charIndex + 1));
            charIndex++;
          } else {
            clearInterval(typewriterRef.current!);
          }
        }, charDelay);
      }
    } else {
      // Kimse konuşmuyor - temizle
      setCurrentText('');
      setCurrentCharacter('');
      setDisplayedText('');
      if (typewriterRef.current) {
        clearInterval(typewriterRef.current);
      }
    }
  }, [characterData, currentText]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (typewriterRef.current) {
        clearInterval(typewriterRef.current);
      }
    };
  }, []);

  if (!currentText || !displayedText) {
    return null;
  }

  const characterColor = characterColors[currentCharacter as keyof typeof characterColors] || '#FFFFFF';
  const characterName = characterNames[currentCharacter as keyof typeof characterNames] || currentCharacter;

  return (
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
  );
};

export default Subtitle;