import type {
  CategoryBudgetDto,
  CategoryResponse,
  CreateCategoryRequest,
  CreateCategoryResponse,
  GetCategoryBudgetsResponse,
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

export const getCategoryBudgets = (token: string, year: number, month: number) => {
  return apiRequest<GetCategoryBudgetsResponse>(`/category-budgets?year=${year}&month=${month}`, {
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

export const extractCategoryBudgets = (response: GetCategoryBudgetsResponse): CategoryBudgetDto[] => {
  if ('data' in response) {
    return response.data;
  }
  return [];
};

export const createCategoryBudget = (token: string, categoryId: string, limitAmount: number, year: number, month: number) => {
  return apiRequest<CategoryBudgetDto>(`/categories/${categoryId}/budget?year=${year}&month=${month}`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ limitAmount }),
  });
};

export const updateCategoryBudget = (token: string, categoryId: string, limitAmount: number, year: number, month: number) => {
  return apiRequest<CategoryBudgetDto>(`/categories/${categoryId}/budget?year=${year}&month=${month}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({ limitAmount }),
  });
};

export const deleteCategoryBudget = (token: string, categoryId: string, year: number, month: number) => {
  return apiRequest<void>(`/categories/${categoryId}/budget?year=${year}&month=${month}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
};
