import type {
  CategoryBudgetDto,
  CategoryResponse,
  CreateCategoryRequest,
  CreateCategoryResponse,
  GetCategoriesResponse,
} from './types';
import { apiRequest } from './client';

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const getCategories = (token: string) => {
  return apiRequest<GetCategoriesResponse>('/categories', {
    headers: authHeaders(token),
  });
};

export const getCategoryBudgets = (token: string) => {
  return apiRequest<CategoryBudgetDto[]>('/category-budgets', {
    headers: authHeaders(token),
  });
};

export const createCategory = (token: string, payload: CreateCategoryRequest) => {
  return apiRequest<CreateCategoryResponse>('/categories', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
};

export const extractCategoryList = (response: GetCategoriesResponse): CategoryResponse[] => {
  if ('data' in response) {
    return response.data;
  }
  return [];
};

export const extractCreatedCategory = (response: CreateCategoryResponse): CategoryResponse | null => {
  if ('category' in response) {
    return response.category;
  }
  return null;
};

export const createCategoryBudget = (token: string, categoryId: string, limitAmount: number) => {
  return apiRequest<CategoryBudgetDto>(`/categories/${categoryId}/budget`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ limitAmount }),
  });
};

export const updateCategoryBudget = (token: string, categoryId: string, limitAmount: number) => {
  return apiRequest<CategoryBudgetDto>(`/categories/${categoryId}/budget`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({ limitAmount }),
  });
};

export const deleteCategoryBudget = (token: string, categoryId: string) => {
  return apiRequest<void>(`/categories/${categoryId}/budget`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
};
