// frontend/src/ParticipantPage.jsx
import React, { useState, useEffect } from 'react';

const ParticipantPage = () => {
  const [name, setName] = useState('');
  const [status, setStatus] = useState('input');
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    return () => {
      if (ws) ws.close();
    };
  }, [ws]);

  const joinRound = () => {
    if (!name.trim()) return;

    const wsUrl = import.meta.env.VITE_BACKEND_HOST.replace('http', 'ws') + '/ws/participant';

    const socket = new WebSocket(wsUrl);
    setWs(socket);

    socket.onopen = () => {
      socket.send(JSON.stringify({ name: name.trim() }));
      setStatus('waiting');
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.event === 'registered') {
        setStatus('clicked');
      }
      if (data.event === 'round_reset') {
        setStatus('waiting');
      }
      if (data.event === 'score_update') {
        setScore(data.score);
      }
    };

    socket.onerror = () => {
      alert('Ошибка подключения к серверу');
      setStatus('input');
      setIsConnected(false);
    };

    socket.onclose = () => {
      setIsConnected(false);
      if (status !== 'input') setStatus('input');
    };
  };

  const handleClick = () => {
    if (ws && isConnected) {
      ws.send(JSON.stringify({ action: 'click' }));
    }
  };

  if (status === 'clicked') {
    return (
      <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'sans-serif' }}>
        <h2>✅ Засчитано!</h2>
        <h3>Ваш счёт: 💰 {score}</h3>
        <p>Ждите начала нового раунда...</p>
      </div>
    );
  }

  if (status === 'waiting') {
    return (
      <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'sans-serif' }}>
        {isConnected && (
          <div style={{ marginBottom: '15px', fontSize: '16px', color: '#1976d2' }}>
            💰 Ваш счёт: {score}
          </div>
        )}
        {!isConnected && (
          <p style={{ color: 'red', marginBottom: '10px' }}>Соединение потеряно</p>
        )}
        <h2>Готовы?</h2>
        <button
          onClick={handleClick}
          disabled={!isConnected}
          style={{
            fontSize: '24px',
            padding: '15px 30px',
            backgroundColor: isConnected ? '#4CAF50' : '#cccccc',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isConnected ? 'pointer' : 'not-allowed'
          }}
        >
          🖱️ НАЖМИТЕ ЗДЕСЬ
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2>Участник</h2>
      <input
        placeholder="Ваше имя"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{
          display: 'block',
          width: '100%',
          marginBottom: '10px',
          padding: '8px',
          fontSize: '16px'
        }}
      />
      <button
        onClick={joinRound}
        disabled={!name.trim()}
        style={{
          width: '100%',
          padding: '10px',
          fontSize: '16px',
          backgroundColor: name.trim() ? '#2196F3' : '#cccccc',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: name.trim() ? 'pointer' : 'not-allowed'
        }}
      >
        Войти в раунд
      </button>
    </div>
  );
};

export default ParticipantPage;