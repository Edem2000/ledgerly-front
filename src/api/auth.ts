import type { LoginDto, LoginResponseDto, RegisterResponseDto, RegisterUserDto } from './types';
import { apiRequest } from './client';

export const registerUser = (payload: RegisterUserDto) => {
  return apiRequest<RegisterResponseDto>('/users/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const loginUser = (payload: LoginDto) => {
  return apiRequest<LoginResponseDto>('/users/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};
