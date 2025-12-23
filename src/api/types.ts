export type Language = 'ru' | 'en' | 'uz';
export type UserStatus = 'active' | 'inactive' | 'deleted';
export type TransactionType = 'income' | 'expense';
export type Currency = 'UZS';

export type CategoryBudgetDto = {
  id: string;
  categoryId: string;
  limitAmount: number;
};

export type GetCategoryBudgetsResponse =
  | { success: true; data: CategoryBudgetDto[] }
  | ErrorDto;

export type CategoryResponse = {
  id: string;
  title: string;
  multilanguageTitle: {
    ru: string;
    uz: string;
    en: string;
  };
  alias: string;
  color: string;
  icon: string | null;
};

export type CreateCategoryRequest = {
  title: string;
  color: string;
  icon?: string;
};

export type CreateCategoryResponse =
  | { success: true; category: CategoryResponse }
  | ErrorDto;

export type GetCategoriesResponse =
  | { success: true; data: CategoryResponse[] }
  | ErrorDto;

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

export type TransactionResponseDto = {
  id: string;
  userId: string;
  categoryId: string;
  title: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  occurredAt: string;
  note?: string;
  createdAt: string;
};

export type CreateTransactionRequest = {
  categoryId: string;
  title: string;
  type: TransactionType;
  amount: number;
};

export type CreateTransactionResponseDto =
  | {
      success: boolean;
      transaction: TransactionResponseDto;
    }
  | ErrorDto;

export type SuggestedCategory = {
  id?: string;
  title: string;
  aiSuggested: boolean;
  isNew: boolean;
};

export type SuggestCategoryResponseDto =
  | {
      success: boolean;
      data: SuggestedCategory[];
    }
  | ErrorDto;
