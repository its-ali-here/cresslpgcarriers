import { AppProvider } from '@/context/AppContext';
import App from '@/components/App';

export default function Home() {
  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
}
