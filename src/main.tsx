import React from 'react';
import ReactDOM from 'react-dom/client';
import { Buffer } from 'buffer';
import { App } from './App';
import './index.css';

if (typeof window !== 'undefined') {
  (window as any).Buffer = (window as any).Buffer || Buffer;
  (window as any).global = (window as any).global || window;
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
