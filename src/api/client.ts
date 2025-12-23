import { API_BASE_URL } from '../config';
import type { ErrorDto, MultiLanguage } from './types';

export class ApiError extends Error {
  code?: number;

  constructor(message: string, code?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

const isMultiLanguage = (value: unknown): value is MultiLanguage => {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'en' in value &&
      'ru' in value &&
      'uz' in value,
  );
};

export const resolveErrorMessage = (errorMessage: MultiLanguage | string): string => {
  if (typeof errorMessage === 'string') return errorMessage;
  if (isMultiLanguage(errorMessage)) {
    return errorMessage.en || errorMessage.ru || errorMessage.uz;
  }
  return 'Something went wrong.';
};

const buildUrl = (path: string) => {
  if (!API_BASE_URL) {
    return path;
  }
  return `${API_BASE_URL.replace(/\/$/, '')}${path}`;
};

export const apiRequest = async <TResponse>(path: string, options: RequestInit = {}): Promise<TResponse> => {
  const response = await fetch(buildUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const data = (await response.json().catch(() => null)) as TResponse | ErrorDto | null;

  if (!response.ok || (data && typeof data === 'object' && 'success' in data && !data.success)) {
    if (data && typeof data === 'object' && 'errorMessage' in data) {
      const errorData = data as ErrorDto;
      throw new ApiError(resolveErrorMessage(errorData.errorMessage), errorData.errorCode);
    }
    throw new ApiError('Unexpected API error.');
  }

  return data as TResponse;
};
