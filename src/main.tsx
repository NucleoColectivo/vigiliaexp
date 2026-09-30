import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Intercept benign Emscripten / TFLite XNNPACK informative logs that get routed to console.error
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const msg = args.map(a => (typeof a === 'string' ? a : (a?.message || ''))).join(' ');
    if (msg.includes('XNNPACK') || msg.includes('TensorFlow Lite') || msg.includes('Created TensorFlow Lite')) {
      console.info(...args);
      return;
    }
    originalConsoleError.apply(console, args);
  };

  const originalConsoleWarn = console.warn;
  console.warn = (...args: any[]) => {
    const msg = args.map(a => (typeof a === 'string' ? a : (a?.message || ''))).join(' ');
    if (msg.includes('XNNPACK') || msg.includes('TensorFlow Lite') || msg.includes('Created TensorFlow Lite')) {
      console.info(...args);
      return;
    }
    originalConsoleWarn.apply(console, args);
  };

  window.addEventListener('error', (event) => {
    if (event.message && (event.message.includes('XNNPACK') || event.message.includes('TensorFlow Lite'))) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
