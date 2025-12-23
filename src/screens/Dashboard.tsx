import { useEffect, useMemo, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { useAuth } from '../auth/auth-context';
import {
  createCategory,
  createCategoryBudget,
  deleteCategoryBudget,
  extractCategoryBudgets,
  extractCategoryList,
  extractCreatedCategory,
  getCategories,
  getCategoryBudgets,
} from '../api/categories';
import {
  createTransaction,
  extractCreatedTransaction,
  extractSuggestedCategories,
  suggestTransactionCategory,
} from '../api/transactions';
import type { SuggestedCategory } from '../api/types';

type UnitMode = 'k' | 'full';
type BudgetSortMode = 'name' | 'spent' | 'over';
type TransactionType = 'income' | 'expense';

type Transaction = {
  date: string;
  amount: number;
  type: TransactionType;
  category: string;
  title?: string;
};

type Budgets = Record<string, number>;
type CategoryMeta = {
  id: string;
  title: string;
  color: string;
  icon: string | null;
};

type FormState = {
  date: string;
  type: TransactionType;
  amount: string;
  category: string;
  title: string;
  categoryId?: string;
};

type ToastState = {
  message: string;
  visible: boolean;
};

const nfK = new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nfFull = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const fmtK = (k: number) => (k < 0 ? '-' : '') + nfK.format(Math.abs(k)) + 'k UZS';
const fmtFull = (k: number) => (k < 0 ? '-' : '') + nfFull.format(Math.abs(k) * 1000) + ' UZS';

const fmtDate = (s: string) => new Date(`${s}T00:00:00`);
const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const DEFAULT_CATEGORY_COLOR = '#6d6ef9';
const DEFAULT_CATEGORY_ICON = null;
const parseMonthKey = (value: string) => {
  const [yearPart, monthPart] = value.split('-');
  const year = Number(yearPart);
  const month = Number(monthPart);
  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    return null;
  }
  return { year, month };
};
const toPaddedDate = (year: number, month: number, day: number) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const baseTransactions: Transaction[] = [
  { date: '2025-10-02', amount: 1500.0, type: 'income', category: 'Salary', title: 'Employer Inc.' },
  { date: '2025-10-03', amount: -480.0, type: 'expense', category: 'Rent', title: 'Landlord' },
  { date: '2025-10-04', amount: -64.4, type: 'expense', category: 'Groceries', title: 'Supermarket' },
  { date: '2025-10-05', amount: -12.5, type: 'expense', category: 'Transport', title: 'Metro' },
  { date: '2025-10-05', amount: -21.9, type: 'expense', category: 'Entertainment', title: 'Cinema' },
  { date: '2025-10-06', amount: -45.8, type: 'expense', category: 'Groceries', title: 'Farmer Market' },
  { date: '2025-10-08', amount: -14.2, type: 'expense', category: 'Transport', title: 'Taxi' },
  { date: '2025-10-10', amount: -57.6, type: 'expense', category: 'Utilities', title: 'Energy Co.' },
  { date: '2025-10-12', amount: 120.0, type: 'income', category: 'Other', title: 'Freelance' },
  { date: '2025-10-13', amount: -23.1, type: 'expense', category: 'Groceries', title: 'Mini-Mart' },
  { date: '2025-10-15', amount: -18.0, type: 'expense', category: 'Entertainment', title: 'Spotify' },
  { date: '2025-10-18', amount: -6.8, type: 'expense', category: 'Other', title: 'Coffee' },
  { date: '2025-10-20', amount: -74.2, type: 'expense', category: 'Groceries', title: 'Supermarket' },
  { date: '2025-10-22', amount: -12.2, type: 'expense', category: 'Transport', title: 'Bus' },
  { date: '2025-10-24', amount: -95.0, type: 'expense', category: 'Utilities', title: 'Water Co.' },
  { date: '2025-10-26', amount: 80.0, type: 'income', category: 'Other', title: 'FB Marketplace' },
  { date: '2025-10-28', amount: -43.9, type: 'expense', category: 'Groceries', title: 'Mini-Mart' },
  { date: '2025-10-28', amount: -12.5, type: 'expense', category: 'Transport', title: 'Metro' },
  { date: '2025-10-30', amount: -25.0, type: 'expense', category: 'Entertainment', title: 'Movies' },
  { date: '2025-11-01', amount: -68.0, type: 'expense', category: 'Groceries', title: 'Supermarket' },
  { date: '2025-11-01', amount: 50.0, type: 'income', category: 'Other', title: 'Gift' },
];

const LS_KEY = 'pfaExtras';
const BUDGET_SORT_LS = 'pfaBudgetSort';
const UNIT_LS = 'pfaUnit';

const getStored = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const getStoredString = (key: string, fallback: string): string => {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
};

export const Dashboard = () => {
  const { user, logout, tokens } = useAuth();
  const [unitMode, setUnitMode] = useState<UnitMode>(getStoredString(UNIT_LS, 'k') as UnitMode);
  const [budgetSortMode, setBudgetSortMode] = useState<BudgetSortMode>(
    getStoredString(BUDGET_SORT_LS, 'name') as BudgetSortMode,
  );
  const [budgets, setBudgets] = useState<Budgets>({});
  const [categoriesMeta, setCategoriesMeta] = useState<CategoryMeta[]>([]);
  const [budgetsError, setBudgetsError] = useState<string | null>(null);
  const [extraTransactions, setExtraTransactions] = useState<Transaction[]>(() => getStored<Transaction[]>(LS_KEY, []));
  const [selectedMonth, setSelectedMonth] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>({ message: '', visible: false });
  const [clearArmed, setClearArmed] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const clearTimerRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const chartRef = useRef<Chart | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [formState, setFormState] = useState<FormState>({
    date: '',
    type: 'expense',
    amount: '',
    category: '',
    title: '',
    categoryId: undefined,
  });
  const [suggestedCategories, setSuggestedCategories] = useState<SuggestedCategory[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const suggestRequestRef = useRef(0);
  const titleValue = formState.title.trim();

  useEffect(() => {
    if (!isAddOpen) return;
    if (!titleValue) {
      setSuggestedCategories([]);
      setIsSuggesting(false);
      return;
    }
    if (!tokens?.accessToken) {
      setSuggestedCategories([]);
      setIsSuggesting(false);
      return;
    }
    const requestId = suggestRequestRef.current + 1;
    suggestRequestRef.current = requestId;
    setIsSuggesting(true);
    const loadSuggestions = async () => {
      try {
        const response = await suggestTransactionCategory(tokens.accessToken, titleValue);
        if (suggestRequestRef.current !== requestId) return;
        setSuggestedCategories(extractSuggestedCategories(response));
      } catch (err) {
        if (suggestRequestRef.current !== requestId) return;
        setSuggestedCategories([]);
      } finally {
        if (suggestRequestRef.current === requestId) {
          setIsSuggesting(false);
        }
      }
    };
    loadSuggestions();
  }, [titleValue, isAddOpen, tokens?.accessToken]);

  const fmtAmount = (k: number) => (unitMode === 'full' ? fmtFull(k) : fmtK(k));

  const allTx = useMemo(() => [...baseTransactions, ...extraTransactions], [extraTransactions]);
  const months = useMemo(() => {
    const monthSet = new Set(allTx.map((t) => monthKey(fmtDate(t.date))));
    return Array.from(monthSet).sort();
  }, [allTx]);
  const budgetPeriod = useMemo(() => {
    const parsed = selectedMonth ? parseMonthKey(selectedMonth) : null;
    if (parsed && parsed.year >= 1970 && parsed.year <= 3000 && parsed.month >= 1 && parsed.month <= 12) {
      return parsed;
    }
    const fallback = new Date();
    return { year: fallback.getFullYear(), month: fallback.getMonth() + 1 };
  }, [selectedMonth]);

  useEffect(() => {
    if (!months.length) {
      setSelectedMonth('');
      return;
    }
    if (!selectedMonth || !months.includes(selectedMonth)) {
      setSelectedMonth(months[months.length - 1]);
    }
  }, [months, selectedMonth]);

  useEffect(() => {
    try {
      localStorage.setItem(UNIT_LS, unitMode);
    } catch {
      // ignore
    }
  }, [unitMode]);

  useEffect(() => {
    try {
      localStorage.setItem(BUDGET_SORT_LS, budgetSortMode);
    } catch {
      // ignore
    }
  }, [budgetSortMode]);

  useEffect(() => {
    let isMounted = true;
    const loadCategories = async () => {
      if (!tokens?.accessToken) return;
      setBudgetsError(null);
      try {
        const [categoriesResponse, budgetsResponse] = await Promise.all([
          getCategories(tokens.accessToken),
          getCategoryBudgets(tokens.accessToken, budgetPeriod.year, budgetPeriod.month),
        ]);
        if (!isMounted) return;
        const categoryList = extractCategoryList(categoriesResponse).map((item) => ({
          id: item.id,
          title: item.title,
          color: item.color,
          icon: item.icon,
        }));
        const budgetMap = extractCategoryBudgets(budgetsResponse).reduce<Record<string, number>>((acc, item) => {
          const category = categoryList.find((cat) => cat.id === item.categoryId);
          if (category) {
            acc[category.title] = item.limitAmount;
          }
          return acc;
        }, {});
        setCategoriesMeta(categoryList);
        setBudgets(budgetMap);
      } catch (err) {
        if (!isMounted) return;
        setBudgetsError('Unable to load categories and budgets.');
      }
    };
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, [tokens?.accessToken, budgetPeriod]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(extraTransactions));
    } catch {
      // ignore
    }
  }, [extraTransactions]);

  useEffect(() => {
    if (!isAddOpen) return;
    const today = new Date();
    const parsed = selectedMonth ? parseMonthKey(selectedMonth) : null;
    let dateValue = today.toISOString().slice(0, 10);
    if (parsed) {
      const isCurrentMonth =
        parsed.year === today.getFullYear() && parsed.month === today.getMonth() + 1;
      const day = isCurrentMonth ? today.getDate() : 1;
      const lastDay = new Date(parsed.year, parsed.month, 0).getDate();
      dateValue = toPaddedDate(parsed.year, parsed.month, Math.min(day, lastDay));
    }
    setFormState((prev) => ({
      ...prev,
      date: dateValue,
      type: 'expense',
      amount: '',
      category: '',
      title: '',
      categoryId: undefined,
    }));
    setSuggestedCategories([]);
  }, [isAddOpen, selectedMonth]);

  useEffect(() => {
    return () => {
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
      }
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 1800);
  };

  const view = useMemo(() => {
    if (!selectedMonth) return [];
    return allTx.filter((t) => monthKey(fmtDate(t.date)) === selectedMonth);
  }, [allTx, selectedMonth]);

  const { income, expense, net, spentByCat } = useMemo(() => {
    const incomeTotal = view.filter((t) => t.amount > 0).reduce((a, b) => a + b.amount, 0);
    const expenseTotal = Math.abs(view.filter((t) => t.amount < 0).reduce((a, b) => a + b.amount, 0));
    const netTotal = incomeTotal - expenseTotal;
    const spent = view
      .filter((t) => t.amount < 0)
      .reduce<Record<string, number>>((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
        return acc;
      }, {});
    return { income: incomeTotal, expense: expenseTotal, net: netTotal, spentByCat: spent };
  }, [view]);

  const categories = useMemo(() => {
    const categorySet = new Set([
      ...categoriesMeta.map((item) => item.title),
      ...Object.keys(budgets),
      ...Object.keys(spentByCat),
    ]);
    const list = Array.from(categorySet);
    if (budgetSortMode === 'name') {
      list.sort((a, b) => a.localeCompare(b));
    } else if (budgetSortMode === 'spent') {
      list.sort((a, b) => (spentByCat[b] || 0) - (spentByCat[a] || 0));
    } else if (budgetSortMode === 'over') {
      const overMap = Object.fromEntries(
        list.map((c) => [c, (spentByCat[c] || 0) > (Number.isFinite(budgets[c]) ? budgets[c] : Infinity)]),
      );
      list.sort((a, b) => Number(overMap[b]) - Number(overMap[a]) || a.localeCompare(b));
    }
    return list;
  }, [budgets, spentByCat, budgetSortMode, categoriesMeta]);

  const categoryOptions = useMemo(() => {
    const set = new Set([...categoriesMeta.map((item) => item.title), ...allTx.map((t) => t.category)].filter(Boolean));
    return Array.from(set).sort();
  }, [allTx, categoriesMeta]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const catPairs = Object.entries(spentByCat);
    if (chartRef.current) {
      chartRef.current.destroy();
    }
    chartRef.current = new Chart(canvasRef.current, {
      type: 'doughnut',
      data: {
        labels: catPairs.map(([c]) => c),
        datasets: [{ data: catPairs.map(([, v]) => v) }],
      },
      options: {
        plugins: {
          legend: {
            labels: { color: '#e7ecf3' },
          },
        },
        cutout: '60%',
      },
    });
  }, [spentByCat]);

  const handleFormChange =
    (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = event.target.value;
      setFormState((prev) => ({
        ...prev,
        [field]: value,
        ...(field === 'category' ? { categoryId: undefined } : {}),
      }));
    };

  const handleCategoryInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFormState((prev) => ({ ...prev, category: value, categoryId: undefined }));
  };

  const handleSuggestedCategorySelect = async (suggestion: SuggestedCategory) => {
    if (!tokens?.accessToken) {
      showToast('Please sign in to add transactions');
      return;
    }
    if (suggestion.aiSuggested && suggestion.isNew) {
      try {
        const createdResponse = await createCategory(tokens.accessToken, {
          title: suggestion.title,
          color: DEFAULT_CATEGORY_COLOR,
          icon: DEFAULT_CATEGORY_ICON ?? undefined,
        });
        const created = extractCreatedCategory(createdResponse);
        if (!created) {
          showToast('Unable to create category');
          return;
        }
        setCategoriesMeta((prev) => [...prev, created]);
        setFormState((prev) => ({
          ...prev,
          category: created.title,
          categoryId: created.id,
        }));
        setSuggestedCategories([]);
        return;
      } catch (err) {
        showToast('Unable to create category');
        return;
      }
    }
    if (suggestion.id && !categoriesMeta.some((item) => item.id === suggestion.id)) {
      setCategoriesMeta((prev) => [
        ...prev,
        {
          id: suggestion.id!,
          title: suggestion.title,
          color: DEFAULT_CATEGORY_COLOR,
          icon: DEFAULT_CATEGORY_ICON,
        },
      ]);
    }
    setFormState((prev) => ({
      ...prev,
      category: suggestion.title,
      categoryId: suggestion.id,
    }));
    setSuggestedCategories([]);
  };

  const handleAddSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { date, type, amount, category, title, categoryId } = formState;
    const amountRaw = parseFloat(amount);
    if (!date || !Number.isFinite(amountRaw) || amountRaw <= 0) return;
    if (!tokens?.accessToken) {
      showToast('Please sign in to add transactions');
      return;
    }
    const trimmedCategory = (category || 'Other').trim();
    const meta = categoryId
      ? categoriesMeta.find((item) => item.id === categoryId) ||
        categoriesMeta.find((item) => item.title === trimmedCategory)
      : categoriesMeta.find((item) => item.title === trimmedCategory);
    if (!meta) {
      showToast('Select a valid category');
      return;
    }
    const transactionTitle = title.trim() || trimmedCategory;
    try {
      const response = await createTransaction(tokens.accessToken, {
        categoryId: meta.id,
        title: transactionTitle,
        type,
        amount: amountRaw,
      });
      const created = extractCreatedTransaction(response);
      if (!created) {
        showToast('Unable to add transaction');
        return;
      }
      const createdDate = created.occurredAt ? created.occurredAt.slice(0, 10) : date;
      const normalizedAmount =
        created.type === 'expense' ? -Math.abs(created.amount) : Math.abs(created.amount);
      const entry: Transaction = {
        date: createdDate,
        amount: normalizedAmount,
        type: created.type,
        category: trimmedCategory,
        title: created.title || transactionTitle,
      };
      setExtraTransactions((prev) => [...prev, entry]);
      setSelectedMonth(monthKey(fmtDate(createdDate)));
      showToast('Transaction added');
      setIsAddOpen(false);
    } catch (err) {
      showToast('Unable to add transaction');
    }
  };

  const handleClearAdded = () => {
    if (!clearArmed) {
      setClearArmed(true);
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      clearTimerRef.current = window.setTimeout(() => {
        setClearArmed(false);
      }, 3000);
      return;
    }
    setClearArmed(false);
    setClearLoading(true);
    window.setTimeout(() => {
      setExtraTransactions([]);
      setClearLoading(false);
      showToast('Added transactions cleared');
    }, 350);
  };

  const categoriesByName = useMemo(() => {
    return new Map(categoriesMeta.map((item) => [item.title, item]));
  }, [categoriesMeta]);

  const handleAddBudget = async () => {
    const name = (prompt('Category name:', '') || '').trim();
    if (!name) {
      showToast('Category name required');
      return;
    }
    const meta = categoriesByName.get(name);
    if (!meta) {
      showToast('Category not found');
      return;
    }
    const existing = budgets[name];
    const def = existing != null ? String(existing) : '';
    const val = prompt(`Monthly limit for "${name}" (in thousands UZS):`, def);
    if (val === null) return;
    const n = parseFloat((val || '').replace(',', '.'));
    if (!Number.isFinite(n) || n < 0) {
      showToast('Invalid number');
      return;
    }
    if (!tokens?.accessToken) return;
    try {
      let meta = categoriesByName.get(name);
      if (!meta) {
        const createdResponse = await createCategory(tokens.accessToken, {
          title: name,
          color: DEFAULT_CATEGORY_COLOR,
          icon: DEFAULT_CATEGORY_ICON ?? undefined,
        });
        const created = extractCreatedCategory(createdResponse);
        if (!created) {
          showToast('Unable to create category');
          return;
        }
        meta = { id: created.id, title: created.title, color: created.color, icon: created.icon };
        setCategoriesMeta((prev) => [...prev, meta]);
      }
      await createCategoryBudget(tokens.accessToken, {
        categoryId: meta.id,
        year: budgetPeriod.year,
        month: budgetPeriod.month,
        limitAmount: n,
      });
      setBudgets((prev) => ({ ...prev, [name]: n }));
      showToast(existing != null ? `Limit for ${name} updated` : `Limit for ${name} added`);
    } catch (err) {
      showToast('Unable to save limit');
    }
  };

  const handleEditBudget = async (cat: string) => {
    const current = budgets[cat] ?? 0;
    const val = prompt(`New monthly limit for "${cat}" (in thousands UZS):`, String(current));
    if (val === null) return;
    const n = parseFloat((val || '').replace(',', '.'));
    if (!Number.isFinite(n) || n < 0) {
      showToast('Invalid number');
      return;
    }
    if (!tokens?.accessToken) return;
    let meta = categoriesByName.get(cat);
    try {
      if (!meta) {
        const createdResponse = await createCategory(tokens.accessToken, {
          title: cat,
          color: DEFAULT_CATEGORY_COLOR,
          icon: DEFAULT_CATEGORY_ICON ?? undefined,
        });
        const created = extractCreatedCategory(createdResponse);
        if (!created) {
          showToast('Unable to create category');
          return;
        }
        meta = { id: created.id, title: created.title, color: created.color, icon: created.icon };
        setCategoriesMeta((prev) => [...prev, meta]);
      }
    } catch (err) {
      showToast('Unable to create category');
      return;
    }
    try {
      await createCategoryBudget(tokens.accessToken, {
        categoryId: meta.id,
        year: budgetPeriod.year,
        month: budgetPeriod.month,
        limitAmount: n,
      });
      setBudgets((prev) => ({ ...prev, [cat]: n }));
      showToast(`Limit for ${cat} updated`);
    } catch (err) {
      showToast('Unable to save limit');
    }
  };

  const handleDeleteBudget = async (cat: string) => {
    if (!confirm(`Delete limit for "${cat}"?`)) return;
    const meta = categoriesByName.get(cat);
    if (!meta) {
      showToast('Category not found');
      return;
    }
    if (!tokens?.accessToken) return;
    try {
      await deleteCategoryBudget(tokens.accessToken, meta.id, budgetPeriod.year, budgetPeriod.month);
      setBudgets((prev) => {
        const next = { ...prev };
        delete next[cat];
        return next;
      });
      showToast(`Limit for ${cat} deleted`);
    } catch (err) {
      showToast('Unable to delete limit');
    }
  };

  const sortedTransactions = useMemo(() => {
    return [...view].sort((a, b) => fmtDate(b.date).getTime() - fmtDate(a.date).getTime()).slice(0, 10);
  }, [view]);

  return (
    <>
      <div className="container">
        <header>
          <div className="brand">
            <div className="logo">UZS</div>
            <div>
              <h1>Personal Finance Assistant — Prototype (UZS, in thousands)</h1>
              <div className="muted" style={{ fontSize: 12 }}>
                One‑page demo • Author - Edem Veliev
              </div>
            </div>
          </div>
          <div className="controls">
            <select
              id="monthSelect"
              title="Month filter"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <select
              id="unitSelect"
              title="Units"
              value={unitMode}
              onChange={(event) => setUnitMode(event.target.value as UnitMode)}
            >
              <option value="k">k UZS</option>
              <option value="full">UZS</option>
            </select>
            <button id="resetBtn" onClick={() => setSelectedMonth(months[months.length - 1] || '')}>
              Reset
            </button>
          </div>
          <div className="account-chip">
            <div>
              <div className="account-name">
                {user ? `${user.firstName} ${user.lastName}` : 'Signed in'}
              </div>
              <div className="muted" style={{ fontSize: 11 }}>
                {user?.email}
              </div>
            </div>
            <button className="mini" onClick={logout}>
              Log out
            </button>
          </div>
          <button id="addBtn" onClick={() => setIsAddOpen(true)}>
            + Add
          </button>
        </header>

        {isAddOpen && (
          <section className="card" id="addFormCard" style={{ marginBottom: 12 }}>
            <form id="addForm" className="add-form" autoComplete="off" onSubmit={handleAddSubmit}>
              <div className="form-row">
                <label>
                  Date<br />
                  <input type="date" id="fDate" required value={formState.date} onChange={handleFormChange('date')} />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Type<br />
                  <select id="fType" value={formState.type} onChange={handleFormChange('type')}>
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </label>
              </div>
              <div className="form-row">
                <label>
                  Amount<br />
                  <input
                    type="number"
                    id="fAmount"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={formState.amount}
                    onChange={handleFormChange('amount')}
                  />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Category<br />
                  <input
                    list="catList"
                    id="fCategory"
                    required
                    placeholder="e.g. Groceries"
                    value={formState.category}
                    onChange={handleCategoryInputChange}
                  />
                  <datalist id="catList">
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat}></option>
                    ))}
                  </datalist>
                  {isSuggesting ? (
                    <div className="muted" style={{ marginTop: 6 }}>
                      Looking up suggestions...
                    </div>
                  ) : suggestedCategories.length ? (
                    <div className="muted" style={{ marginTop: 6 }}>
                      Suggested categories:
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                        {suggestedCategories.map((suggestion) => (
                          <button
                            key={`${suggestion.title}-${suggestion.id ?? 'new'}`}
                            type="button"
                            className="mini"
                            onClick={() => handleSuggestedCategorySelect(suggestion)}
                          >
                            {suggestion.title}
                            {suggestion.aiSuggested ? ' ✨' : ''}
                            {suggestion.isNew ? ' (new)' : ''}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </label>
              </div>
              <div className="form-row" style={{ flex: 2 }}>
                <label>
                  Title<br />
                  <input
                    type="text"
                    id="fTitle"
                    placeholder="optional"
                    value={formState.title}
                    onChange={handleFormChange('title')}
                  />
                </label>
              </div>
              <div className="form-actions">
                <button type="submit">Add</button>
                <button type="button" id="cancelAdd" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="kpis">
          <div className="card kpi" id="kpiIncome">
            <h3>Income</h3>
            <div className="value good" data-testid="income">
              {fmtAmount(income)}
            </div>
            <div className="muted" style={{ fontSize: 12 }} data-testid="income-count">
              {view.filter((t) => t.amount > 0).length} transactions
            </div>
          </div>
          <div className="card kpi" id="kpiExpense">
            <h3>Expenses</h3>
            <div className="value bad" data-testid="expense">
              {fmtAmount(expense)}
            </div>
            <div className="muted" style={{ fontSize: 12 }} data-testid="expense-count">
              {view.filter((t) => t.amount < 0).length} transactions
            </div>
          </div>
          <div className="card kpi" id="kpiNet">
            <h3>Net</h3>
            <div className="value" data-testid="net">
              {fmtAmount(net)}
            </div>
            <div className="muted" style={{ fontSize: 12 }} data-testid="net-note">
              {net >= 0 ? 'You are in surplus' : 'Deficit this month'}
            </div>
          </div>
          <div className="card kpi" id="kpiBudgets">
            <h3>Budgets (month)</h3>
            <div className="budget-toolbar">
              <select
                id="budgetSort"
                title="Sort budgets"
                value={budgetSortMode}
                onChange={(event) => setBudgetSortMode(event.target.value as BudgetSortMode)}
              >
                <option value="name">Name (A–Z)</option>
                <option value="spent">Spent (desc)</option>
                <option value="over">Over first</option>
              </select>
              <button id="addBudgetBtn" className="mini" onClick={handleAddBudget}>
                Add Limit
              </button>
            </div>
            <div className="budgets" id="budgetsBox">
              {categories.map((cat) => {
                const hasLimit = Number.isFinite(budgets[cat]);
                const limit = hasLimit ? budgets[cat] : null;
                const spent = spentByCat[cat] || 0;
                const pctRaw = hasLimit && limit > 0 ? (spent / limit) * 100 : 0;
                const pct = Math.min(100, Math.round(pctRaw));
                const over = hasLimit ? spent > limit : false;
                const state = hasLimit ? (over ? 'bad' : pct > 80 ? 'warn' : 'good') : 'warn';
                const statusText = hasLimit ? `${fmtAmount(spent)} / ${fmtAmount(limit)}` : `${fmtAmount(spent)} / Limit not defined`;
                const title = hasLimit
                  ? `Spent ${pctRaw.toFixed(1)}% — ${spent}k / ${limit}k UZS`
                  : `No limit set — Spent ${spent}k UZS`;
                return (
                  <div className="budget" title={title} key={cat}>
                    <h4 className="budget-title">{cat}</h4>
                    <div className="budget-stats">
                      <span className={`status ${state}`}>{statusText}</span>
                      {hasLimit ? (
                        <span className={`badge ${over ? 'over' : 'ok'}`} title={over ? 'Over the limit' : 'Within limit'}>
                          {over ? 'Over' : 'OK'}
                        </span>
                      ) : (
                        <span className="badge nolimit" title="No monthly limit set">
                          No limit
                        </span>
                      )}
                    </div>
                    <div className={`progress ${over ? 'over' : ''}`}>
                      <i style={{ width: hasLimit && limit > 0 ? `${Math.min(100, (spent / limit) * 100)}%` : 0 }}></i>
                    </div>
                    <div className="budget-actions">
                      {hasLimit ? (
                        <>
                          <button className="mini edit-limit" data-cat={cat} onClick={() => handleEditBudget(cat)}>
                            Edit
                          </button>{' '}
                          <button className="mini delete-limit" data-cat={cat} onClick={() => handleDeleteBudget(cat)}>
                            Delete
                          </button>
                        </>
                      ) : (
                        <button className="mini edit-limit" data-cat={cat} onClick={() => handleEditBudget(cat)}>
                          Set limit
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {budgetsError ? (
              <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
                {budgetsError}
              </div>
            ) : null}
          </div>
        </section>

        <section className="row" style={{ marginTop: 8 }}>
          <div className="card chart-card">
            <h3 style={{ margin: '0 0 8px 0', fontSize: 13, color: 'var(--muted)' }}>By Category</h3>
            <canvas id="pie" ref={canvasRef}></canvas>
          </div>
          <div className="card table-card">
            <h3 style={{ margin: '0 0 8px 0', fontSize: 13, color: 'var(--muted)' }}>Recent Transactions</h3>
            <table id="txTable">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th className="t-amount">Amount</th>
                </tr>
              </thead>
              <tbody>
                {sortedTransactions.length ? (
                  sortedTransactions.map((t, index) => (
                    <tr key={`${t.date}-${index}`}>
                      <td>{t.date}</td>
                      <td>{t.title || ''}</td>
                      <td>{t.category || '—'}</td>
                      <td className="t-amount">{fmtAmount(t.amount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="muted">
                      No transactions
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="footer">
          <span>Local changes are stored in your browser.</span>
          <button
            id="clearAddedBtn"
            className={`${clearArmed ? 'armed' : ''} ${clearLoading ? 'loading' : ''}`.trim()}
            onClick={handleClearAdded}
          >
            {clearArmed ? 'Click again to confirm' : 'Clear Added'}
          </button>
        </footer>
      </div>
      <div id="toast" className={`toast ${toast.visible ? 'show' : ''}`} aria-live="polite">
        {toast.message}
      </div>
    </>
  );
};
