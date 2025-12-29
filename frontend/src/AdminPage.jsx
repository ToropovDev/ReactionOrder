// frontend/src/AdminPage.jsx
import React, { useState, useEffect } from 'react';

const AdminPage = () => {
  const [participants, setParticipants] = useState([]);
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Определяем URL WebSocket в зависимости от режима
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const backendHost = import.meta.env.VITE_BACKEND_HOST || 'http://localhost:8080';
    const wsUrl = `${protocol}://${backendHost}/ws/admin`;

    const socket = new WebSocket(wsUrl);
    setWs(socket);

    socket.onopen = () => {
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.event === 'update') {
        setParticipants(data.participants);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error (admin):', error);
      setIsConnected(false);
    };

    socket.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      socket.close();
    };
  }, []);

  const clearRound = () => {
    if (ws && isConnected) {
      ws.send(JSON.stringify({ action: 'clear_round' }));
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1>Админка: Порядок нажатий</h1>

      {!isConnected && (
        <p style={{ color: 'red' }}>
          ❌ Нет подключения к серверу. Убедитесь, что бэкенд запущен на порту 8080.
        </p>
      )}

      <p>
        <strong>Ссылка для участников:</strong>{' '}
        <code>
          {import.meta.env.DEV
            ? `http://localhost:3000/join`
            : `${window.location.origin}/join`}
        </code>
      </p>

      <h2>Текущий раунд ({participants.length} участников):</h2>
      {participants.length === 0 ? (
        <p>Пока никто не нажал</p>
      ) : (
        <ol>
          {participants.map((p, i) => (
            <li key={i}>
              <strong>{p.name}</strong> —{' '}
              {new Date(p.timestamp * 1000).toISOString().slice(11, 23)}
            </li>
          ))}
        </ol>
      )}

      <button
        onClick={clearRound}
        disabled={!isConnected}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: isConnected ? '#4CAF50' : '#cccccc',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isConnected ? 'pointer' : 'not-allowed'
        }}
      >
        🔄 Начать новый раунд
      </button>
    </div>
  );
};

export default AdminPage;