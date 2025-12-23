import type { AuthTokens, UserResponseDto } from '../api/types';

const ACCESS_TOKEN_KEY = 'ledgerly.accessToken';
const REFRESH_TOKEN_KEY = 'ledgerly.refreshToken';
const USER_KEY = 'ledgerly.user';

export const getStoredTokens = (): AuthTokens | null => {
  try {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!accessToken || !refreshToken) return null;
    return { accessToken, refreshToken };
  } catch {
    return null;
  }
};

export const storeTokens = (tokens: AuthTokens) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
};

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const getStoredUser = (): UserResponseDto | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as UserResponseDto) : null;
  } catch {
    return null;
  }
};

export const storeUser = (user: UserResponseDto) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearUser = () => {
  localStorage.removeItem(USER_KEY);
};
