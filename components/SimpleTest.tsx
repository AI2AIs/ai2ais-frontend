import React, { useState, useEffect, useRef } from 'react';

interface AudioData {
  characterId: string;
  text: string;
  audioBase64: string;
  duration: number;
  facialExpression: string;
  lipSync: any;
}

const SimpleTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<string>('Bağlanıyor...');
  const [responses, setResponses] = useState<string[]>([]);
  const [currentAudio, setCurrentAudio] = useState<AudioData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Step 1: WebSocket bağlantısı
  useEffect(() => {
    console.log('🔗 WebSocket bağlantısı kuruluyor...');
    
    const websocket = new WebSocket('ws://localhost:3002/ws/test-session');
    
    websocket.onopen = () => {
      console.log('✅ WebSocket bağlandı');
      setConnectionStatus('✅ Bağlandı');
      setWs(websocket);
      
      // Oturum katıl
      websocket.send(JSON.stringify({
        type: 'join_session',
        session_id: 'test-session'
      }));
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 Mesaj geldi:', data);
        
        if (data.type === 'new_message' && data.data?.message) {
          const message = data.data.message;
          
          // Detaylı mesaj analizi
          console.log('🔍 Mesaj detayları:');
          console.log('  Text:', message.text);
          console.log('  Audio var mı:', !!message.audioBase64);
          console.log('  Lip-sync var mı:', !!message.lipSync);
          console.log('  Facial expression:', message.facialExpression);
          console.log('  Duration:', message.duration);
          
          const audioStatus = message.audioBase64 ? '🎵' : '❌';
          const lipSyncStatus = message.lipSync ? '👄' : '❌';
          
          const newResponse = `${message.characterId}: ${message.text.substring(0, 50)}... [${audioStatus}Audio ${lipSyncStatus}LipSync]`;
          setResponses(prev => [...prev.slice(-4), newResponse]);
          
          // YENI: Audio data'yı sakla
          if (message.audioBase64 && message.text) {
            console.log('💾 Audio data kaydediliyor...');
            setCurrentAudio({
              characterId: message.characterId,
              text: message.text,
              audioBase64: message.audioBase64,
              duration: message.duration || 5,
              facialExpression: message.facialExpression || 'neutral',
              lipSync: message.lipSync
            });
          }
        }
      } catch (error) {
        console.error('❌ Mesaj parse hatası:', error);
      }
    };

    websocket.onclose = () => {
      console.log('🔌 WebSocket kapandı');
      setConnectionStatus('❌ Bağlantı kesildi');
    };

    websocket.onerror = (error) => {
      console.error('❌ WebSocket hatası:', error);
      setConnectionStatus('❌ Hata');
    };

    return () => {
      websocket.close();
    };
  }, []);

  // YENI: Audio çalma fonksiyonu
  const playAudio = () => {
    if (!currentAudio) {
      console.log('❌ Çalacak audio yok');
      return;
    }

    try {
      console.log('🎵 Audio çalınıyor...', currentAudio.characterId);
      
      // Base64'ü blob'a çevir
      const audioBlob = base64ToBlob(currentAudio.audioBase64, 'audio/wav');
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Audio element oluştur ve çal
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      audioRef.current = new Audio(audioUrl);
      audioRef.current.play();
      setIsPlaying(true);
      
      // Audio bitince temizle
      audioRef.current.onended = () => {
        console.log('🎵 Audio bitti');
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      
    } catch (error) {
      console.error('❌ Audio çalma hatası:', error);
      setIsPlaying(false);
    }
  };

  // Base64 to Blob helper
  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  // AI karakterine konuşma talebi gönder
  const requestAIResponse = (characterId: string) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.log('❌ WebSocket bağlı değil');
      return;
    }

    console.log(`🎤 ${characterId} karakterine konuşma talebi gönderiliyor...`);
    
    ws.send(JSON.stringify({
      type: 'request_response',
      characterId: characterId
    }));
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'rgba(0,0,0,0.9)',
      border: '2px solid #00ff88',
      borderRadius: '10px',
      padding: '20px',
      color: 'white',
      fontSize: '14px',
      zIndex: 1000,
      minWidth: '350px',
      maxHeight: '500px',
      overflowY: 'auto'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#00ff88' }}>
        🧪 Core Test Paneli
      </h3>
      
      {/* Bağlantı Durumu */}
      <div style={{ marginBottom: '15px' }}>
        <strong>Bağlantı: </strong>{connectionStatus}
      </div>

      {/* Test Butonları */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ marginBottom: '10px', color: '#ffaa00' }}>
          <strong>AI Karakterlerini Test Et:</strong>
        </div>
        
        <button 
          onClick={() => requestAIResponse('claude')}
          style={{
            background: '#FF6B35',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '5px',
            color: 'white',
            margin: '0 5px 5px 0',
            cursor: 'pointer'
          }}
        >
          🤖 Claude Konuş
        </button>
        
        <button 
          onClick={() => requestAIResponse('gpt')}
          style={{
            background: '#00D2FF',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '5px',
            color: 'white',
            margin: '0 5px 5px 0',
            cursor: 'pointer'
          }}
        >
          🤖 GPT Konuş
        </button>
        
        <button 
          onClick={() => requestAIResponse('grok')}
          style={{
            background: '#FFD700',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '5px',
            color: 'black',
            margin: '0 5px 5px 0',
            cursor: 'pointer'
          }}
        >
          🤖 Grok Konuş
        </button>
      </div>

      {/* YENI: Audio Player */}
      {currentAudio && (
        <div style={{ 
          marginBottom: '15px', 
          padding: '10px', 
          background: 'rgba(255,255,255,0.1)', 
          borderRadius: '5px' 
        }}>
          <div style={{ marginBottom: '8px', color: '#ffaa00' }}>
            <strong>Son Audio:</strong>
          </div>
          
          <div style={{ fontSize: '12px', marginBottom: '8px' }}>
            <strong>{currentAudio.characterId.toUpperCase()}</strong> - {currentAudio.duration}s
          </div>
          
          <div style={{ fontSize: '11px', marginBottom: '8px', color: '#ccc' }}>
            "{currentAudio.text.substring(0, 100)}..."
          </div>
          
          <button
            onClick={playAudio}
            disabled={isPlaying}
            style={{
              background: isPlaying ? '#666' : '#00ff88',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '3px',
              color: 'black',
              cursor: isPlaying ? 'not-allowed' : 'pointer',
              fontSize: '12px'
            }}
          >
            {isPlaying ? '🎵 Çalıyor...' : '▶️ Ses Çal'}
          </button>
        </div>
      )}

      {/* Yanıtlar */}
      <div>
        <div style={{ marginBottom: '10px', color: '#ffaa00' }}>
          <strong>AI Yanıtları:</strong>
        </div>
        
        {responses.length === 0 ? (
          <div style={{ color: '#888', fontStyle: 'italic' }}>
            Henüz yanıt yok. Bir butona tıkla!
          </div>
        ) : (
          <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
            {responses.map((response, index) => (
              <div key={index} style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '5px 8px',
                margin: '3px 0',
                borderRadius: '3px',
                fontSize: '12px'
              }}>
                {response}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleTest;