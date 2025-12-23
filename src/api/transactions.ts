import type {
  CreateTransactionRequest,
  CreateTransactionResponseDto,
  SuggestCategoryResponseDto,
} from './types';
import { apiRequest } from './client';

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const createTransaction = (token: string, payload: CreateTransactionRequest) => {
  return apiRequest<CreateTransactionResponseDto>('/transactions', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
};

export const suggestTransactionCategory = (token: string, title: string) => {
  return apiRequest<SuggestCategoryResponseDto>('/transactions/suggest-category', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ title }),
  });
};

export const extractCreatedTransaction = (response: CreateTransactionResponseDto) => {
  if ('transaction' in response) {
    return response.transaction;
  }
  return null;
};

export const extractSuggestedCategories = (response: SuggestCategoryResponseDto) => {
  if ('data' in response) {
    return response.data;
  }
  return [];
};
