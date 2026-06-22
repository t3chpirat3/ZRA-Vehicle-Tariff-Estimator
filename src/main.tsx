import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { inject } from '@vercel/analytics';

// Register the Service Worker to enable offline mode
registerSW({ immediate: true });

// Initialize Vercel Web Analytics
inject();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
