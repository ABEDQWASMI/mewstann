import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Disable WebSocket connection attempts during development
if (process.env.NODE_ENV === 'development') {
  window.addEventListener('error', (e) => {
    if (e.message === 'WebSocket connection failed') {
      e.stopImmediatePropagation();
    }
  });
}
