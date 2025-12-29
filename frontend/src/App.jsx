// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminPage from './AdminPage.jsx';
import ParticipantPage from './ParticipantPage.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/join" element={<ParticipantPage />} />
        <Route path="/" element={
          <div style={{ padding: '20px' }}>
            <h1>Reaction Order</h1>
            <p><a href="/admin">Админка</a> | <a href="/join">Участник</a></p>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;