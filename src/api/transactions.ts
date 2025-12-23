import type { CreateTransactionRequest, CreateTransactionResponseDto } from './types';
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

export const extractCreatedTransaction = (response: CreateTransactionResponseDto) => {
  if ('transaction' in response) {
    return response.transaction;
  }
  return null;
};
