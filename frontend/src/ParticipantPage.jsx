// frontend/src/ParticipantPage.jsx
import React, { useState, useEffect } from 'react';

const ParticipantPage = () => {
  const [name, setName] = useState('');
  const [status, setStatus] = useState('input'); // 'input', 'waiting', 'clicked'
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [ws]);

  const joinRound = () => {
    if (!name.trim()) return;

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const backendHost = import.meta.env.DEV ? 'localhost:8080' : window.location.host;
    const wsUrl = `${protocol}://${backendHost}/ws/participant`;

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
    };

    socket.onerror = (error) => {
      console.error('WebSocket error (participant):', error);
      alert('Не удалось подключиться к серверу. Запущен ли бэкенд на порту 8080?');
      setStatus('input');
      setIsConnected(false);
    };

    socket.onclose = () => {
      setIsConnected(false);
      if (status !== 'input') {
        setStatus('input');
      }
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
        <p>Ждите начала нового раунда...</p>
        <button
          onClick={() => setStatus('waiting')}
          style={{ marginTop: '20px', fontSize: '14px' }}
        >
          Вернуться к кнопке
        </button>
      </div>
    );
  }

  if (status === 'waiting') {
    return (
      <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'sans-serif' }}>
        {!isConnected && (
          <p style={{ color: 'red', marginBottom: '10px' }}>
            Соединение потеряно. Перезагрузите страницу.
          </p>
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
      <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
        После входа появится большая кнопка. Нажмите её, когда будете готовы!
      </p>
    </div>
  );
};

export default ParticipantPage;