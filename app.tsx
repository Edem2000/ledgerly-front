import ReactDOM from 'react-dom/client';
import './style.scss';
import { AuthProvider } from './src/auth/auth-context';
import { AppShell } from './src/screens/AppShell';

const rootEl = document.getElementById('root');
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(
    <AuthProvider>
      <AppShell />
    </AuthProvider>,
  );
}
