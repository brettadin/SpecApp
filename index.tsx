import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

let rootElement = document.getElementById('root');
if (!rootElement) {
  // If the HTML is missing the root element, create it to avoid a silent blank page
  console.warn('`#root` element not found in DOM — creating one automatically.');
  rootElement = document.createElement('div');
  rootElement.id = 'root';
  document.body.appendChild(rootElement);
}

const root = ReactDOM.createRoot(rootElement as HTMLElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Global error handler for the renderer to capture unhandled exceptions and report via console
window.addEventListener('error', (ev) => {
  console.error('Uncaught error in renderer:', ev.error || ev.message, ev.error?.stack || '');
});

window.addEventListener('unhandledrejection', (ev) => {
  console.error('Unhandled promise rejection in renderer:', ev.reason);
});