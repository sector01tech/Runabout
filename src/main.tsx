import { createRoot } from 'react-dom/client';

// Import polyfills first
import './lib/polyfills.ts';

import App from './App.tsx';
import './index.css';

// Import Inter Variable font
import '@fontsource-variable/inter';

createRoot(document.getElementById("root")!).render(<App />);
