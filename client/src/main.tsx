// Client entry point for OneCut Studio
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from '../../app/renderer/App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
