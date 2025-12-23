import { AuthScreen } from './AuthScreen';
import { Dashboard } from './Dashboard';
import { useAuth } from '../auth/auth-context';

export const AppShell = () => {
  const { tokens } = useAuth();

  if (!tokens?.accessToken) {
    return <AuthScreen />;
  }

  return <Dashboard />;
};
