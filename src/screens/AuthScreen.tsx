import { useMemo, useState } from 'react';
import type { Language } from '../api/types';
import { API_BASE_URL } from '../config';
import { useAuth } from '../auth/auth-context';

const languages: { label: string; value: Language }[] = [
  { label: 'English', value: 'en' },
  { label: 'Русский', value: 'ru' },
  { label: 'Oʻzbekcha', value: 'uz' },
];

const roles = [
  { label: 'User', value: 'user' },
  { label: 'Admin', value: 'admin' },
  { label: 'Operator', value: 'operator' },
  { label: 'Super Admin', value: 'superadmin' },
];

export const AuthScreen = () => {
  const { login, register, isLoading, error, clearError } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [notice, setNotice] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'user',
    language: 'en' as Language,
  });

  const handleLoginChange = (field: keyof typeof loginForm) => (event: React.ChangeEvent<HTMLInputElement>) => {
    clearError();
    setNotice(null);
    setLoginForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleRegisterChange = (field: keyof typeof registerForm) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    clearError();
    setNotice(null);
    setRegisterForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const canSubmitLogin = useMemo(() => loginForm.email && loginForm.password, [loginForm]);
  const canSubmitRegister = useMemo(
    () =>
      registerForm.firstName &&
      registerForm.lastName &&
      registerForm.email &&
      registerForm.phone &&
      registerForm.password,
    [registerForm],
  );

  const submitLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmitLogin) return;
    await login({ email: loginForm.email, password: loginForm.password });
  };

  const submitRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmitRegister) return;
    const success = await register({
      firstName: registerForm.firstName,
      lastName: registerForm.lastName,
      email: registerForm.email,
      phone: registerForm.phone,
      password: registerForm.password,
      role: registerForm.role,
      language: registerForm.language,
    });
    if (success) {
      setMode('login');
      setNotice('Account created. Please sign in with your credentials.');
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <header className="auth-header">
          <div>
            <h2>Ledgerly</h2>
            <p className="muted">Secure access to your personal finance workspace.</p>
          </div>
          <span className="badge ok">API {API_BASE_URL ? 'Connected' : 'Missing base URL'}</span>
        </header>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === 'login' ? 'active' : ''}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'active' : ''}
            onClick={() => setMode('register')}
          >
            Register
          </button>
        </div>

        {error && <div className="auth-alert">{error}</div>}
        {notice && <div className="auth-alert success">{notice}</div>}

        {mode === 'login' ? (
          <form className="auth-form" onSubmit={submitLogin}>
            <label>
              Email
              <input type="email" value={loginForm.email} onChange={handleLoginChange('email')} required />
            </label>
            <label>
              Password
              <input
                type="password"
                value={loginForm.password}
                onChange={handleLoginChange('password')}
                required
              />
            </label>
            <button type="submit" className="primary" disabled={!canSubmitLogin || isLoading}>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={submitRegister}>
            <div className="auth-grid">
              <label>
                First name
                <input value={registerForm.firstName} onChange={handleRegisterChange('firstName')} required />
              </label>
              <label>
                Last name
                <input value={registerForm.lastName} onChange={handleRegisterChange('lastName')} required />
              </label>
            </div>
            <label>
              Email
              <input type="email" value={registerForm.email} onChange={handleRegisterChange('email')} required />
            </label>
            <label>
              Phone (UZ)
              <input value={registerForm.phone} onChange={handleRegisterChange('phone')} placeholder="+998" required />
            </label>
            <label>
              Password
              <input type="password" value={registerForm.password} onChange={handleRegisterChange('password')} required />
            </label>
            <div className="auth-grid">
              <label>
                Role
                <select value={registerForm.role} onChange={handleRegisterChange('role')}>
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Language
                <select value={registerForm.language} onChange={handleRegisterChange('language')}>
                  {languages.map((language) => (
                    <option key={language.value} value={language.value}>
                      {language.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button type="submit" className="primary" disabled={!canSubmitRegister || isLoading}>
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
