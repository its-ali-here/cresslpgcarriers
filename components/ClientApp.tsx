'use client';

import { AppProvider } from '@/context/AppContext';
import App from '@/components/App';

export default function ClientApp() {
  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
}
