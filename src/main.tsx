import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Initialize theme from localStorage
const theme = localStorage.getItem('theme') || 'default';
if (theme !== 'default') {
  document.documentElement.setAttribute('data-theme', theme);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
