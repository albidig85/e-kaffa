import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Registrasi Service Worker PWA dengan pembaruan otomatis
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(<App />);
