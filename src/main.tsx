import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safely suppress benign ResizeObserver loop notifications common with Monaco Editor & dynamic layout changes
const isResizeObserverError = (msg: unknown) => {
  if (typeof msg === 'string') {
    return (
      msg.includes('ResizeObserver loop completed with undelivered notifications') ||
      msg.includes('ResizeObserver loop limit exceeded') ||
      msg.includes('ResizeObserver')
    );
  }
  return false;
};

window.addEventListener('error', (event) => {
  if (isResizeObserverError(event.message) || isResizeObserverError(event.error?.message)) {
    event.stopImmediatePropagation();
    event.preventDefault();
  }
});

const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  if (
    args.some(
      (arg) =>
        isResizeObserverError(arg) ||
        (arg instanceof Error && isResizeObserverError(arg.message))
    )
  ) {
    return;
  }
  originalConsoleError(...args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

