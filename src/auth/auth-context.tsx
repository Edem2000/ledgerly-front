import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { AuthTokens, LoginDto, RegisterUserDto, UserResponseDto } from '../api/types';
import { loginUser, registerUser } from '../api/auth';
import { ApiError } from '../api/client';
import { clearTokens, clearUser, getStoredTokens, getStoredUser, storeTokens, storeUser } from './token-storage';

export type AuthState = {
  user: UserResponseDto | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  error: string | null;
};

export type AuthContextValue = AuthState & {
  login: (payload: LoginDto) => Promise<boolean>;
  register: (payload: RegisterUserDto) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserResponseDto | null>(() => getStoredUser());
  const [tokens, setTokens] = useState<AuthTokens | null>(() => getStoredTokens());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const handleAuthError = useCallback((err: unknown) => {
    if (err instanceof ApiError) {
      setError(err.message);
      return;
    }
    setError('Unable to reach the API.');
  }, []);

  const login = useCallback(async (payload: LoginDto) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await loginUser(payload);
      if ('tokens' in response) {
        setTokens(response.tokens);
        setUser(response.user);
        storeTokens(response.tokens);
        storeUser(response.user);
        return true;
      }
    } catch (err) {
      handleAuthError(err);
    } finally {
      setIsLoading(false);
    }
    return false;
  }, [handleAuthError]);

  const register = useCallback(async (payload: RegisterUserDto) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await registerUser(payload);
      if ('user' in response) {
        setUser(response.user);
        storeUser(response.user);
        return true;
      }
    } catch (err) {
      handleAuthError(err);
    } finally {
      setIsLoading(false);
    }
    return false;
  }, [handleAuthError]);

  const logout = useCallback(() => {
    setUser(null);
    setTokens(null);
    clearTokens();
    clearUser();
  }, []);

  const value = useMemo(
    () => ({
      user,
      tokens,
      isLoading,
      error,
      login,
      register,
      logout,
      clearError,
    }),
    [user, tokens, isLoading, error, login, register, logout, clearError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
