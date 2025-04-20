
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Route, Switch } from 'wouter';
import App from './App';
import './index.css';

// Add the QRCode library to the document
const qrcodeScript = document.createElement('script');
qrcodeScript.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.0/build/qrcode.min.js';
qrcodeScript.async = true;
document.head.appendChild(qrcodeScript);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
