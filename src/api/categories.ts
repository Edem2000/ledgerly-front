import type { CategoryBudgetDto, CategoryDto } from './types';
import { apiRequest } from './client';

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const getCategories = (token: string) => {
  return apiRequest<CategoryDto[]>('/categories', {
    headers: authHeaders(token),
  });
};

export const getCategoryBudgets = (token: string) => {
  return apiRequest<CategoryBudgetDto[]>('/category-budgets', {
    headers: authHeaders(token),
  });
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
