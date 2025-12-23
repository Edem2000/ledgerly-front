export type Language = 'ru' | 'en' | 'uz';
export type UserStatus = 'active' | 'inactive' | 'deleted';
export type TransactionType = 'income' | 'expense';
export type Currency = 'UZS';

export type CategoryDto = {
  id: string;
  name: string;
};

export type CategoryBudgetDto = {
  id: string;
  categoryId: string;
  limitAmount: number;
};

export type MultiLanguage = {
  ru: string;
  uz: string;
  en: string;
};

export type ErrorDto = {
  success: boolean;
  errorMessage: MultiLanguage | string;
  errorCode: number;
};

export type UserResponseDto = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: UserStatus;
  role?: {
    id: string;
    name: MultiLanguage;
    alias: string;
  };
  language: Language;
  lastLoggedInAt: string | null;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type RegisterUserDto = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  language: Language;
};

export type LoginDto = {
  email: string;
  password: string;
};

export type RegisterResponseDto =
  | { success: true; user: UserResponseDto }
  | ErrorDto;

export type LoginResponseDto =
  | { success: true; user: UserResponseDto; tokens: AuthTokens }
  | ErrorDto;
