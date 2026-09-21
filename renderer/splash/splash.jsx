import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import GhostFibers from './vendor/GhostFibers';

// Windows keeps the upstream shader. macOS uses the lighter-weight static
// welcome surface selected by platform.js before the first paint.
if (!document.documentElement.classList.contains('is-mac')) {
  const root = createRoot(document.getElementById('background'));
  flushSync(() => root.render(<GhostFibers />));
  window.addEventListener('pagehide', () => root.unmount(), { once: true });
}
