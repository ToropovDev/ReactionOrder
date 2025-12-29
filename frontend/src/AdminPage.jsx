// frontend/src/AdminPage.jsx
import React, { useState, useEffect } from 'react';

const AdminPage = () => {
  const [participants, setParticipants] = useState([]);
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Определяем URL WebSocket в зависимости от режима
    const wsUrl = import.meta.env.VITE_BACKEND_HOST.replace('http', 'ws') + '/ws/admin';

    const socket = new WebSocket(wsUrl);
    setWs(socket);

    socket.onopen = () => setIsConnected(true);
    socket.onerror = () => setIsConnected(false);
    socket.onclose = () => setIsConnected(false);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.event === 'update') {
        setParticipants(data.participants);
      }
    };

    return () => socket.close();
  }, []);

  const clearRound = () => {
    if (ws && isConnected) {
      ws.send(JSON.stringify({ action: 'clear_round' }));
    }
  };

  const awardPoints = (clientId, points) => {
    if (ws && isConnected) {
      ws.send(JSON.stringify({
        action: 'award_points',
        client_id: clientId,
        points: points
      }));
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1>Админка: Порядок нажатий</h1>

      {!isConnected && (
        <p style={{ color: 'red' }}>❌ Нет подключения к серверу</p>
      )}

      <h2>Текущий раунд ({participants.length} участников):</h2>
      {participants.length === 0 ? (
        <p>Пока никто не нажал</p>
      ) : (
        <ol>
          {participants.map((p, i) => (
            <li key={p.client_id || i} style={{ marginBottom: '15px' }}>
              <strong>{p.name}</strong> —{' '}
              {new Date(p.timestamp * 1000).toISOString().slice(11, 23)}
              <br />
              <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>
                💰 Счёт: {p.score}
              </span>
              <div style={{ marginTop: '5px' }}>
                {[200, 400, 600, 800].map(points => (
                  <button
                    key={points}
                    onClick={() => awardPoints(p.client_id, points)}
                    style={{
                      marginLeft: '5px',
                      padding: '2px 6px',
                      fontSize: '12px',
                      backgroundColor: '#1976d2',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    +{points}
                  </button>
                ))}
              </div>
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