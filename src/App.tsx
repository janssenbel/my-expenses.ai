import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Wallet,
  PieChart,
  BarChart3,
  CalendarClock,
  FileSpreadsheet,
  Camera,
  Download,
  ChevronRight,
  SlidersHorizontal,
  X,
  Moon,
  Sun,
  Smartphone,
  Share,
  PlusSquare,
  Edit3,
  Check,
} from 'lucide-react';
import {
  ActiveTab,
  CategoryBudget,
  CurrencyConfig,
  ExpenseCategory,
  RecurringBill,
  Transaction,
} from './types';
import {
  CATEGORY_META,
  CURRENCIES,
  EXPENSE_CATEGORIES,
  getInitialRecurringBills,
  getInitialTransactions,
  INITIAL_BUDGETS,
} from './data/demoData';
import {
  formatMoney,
  formatShortDate,
  generateTransactionsCSV,
  getRecentDaysStrip,
} from './utils/formatters';
import { CategoryIcon } from './components/CategoryIcon';
import { ExpenseSheetModal } from './components/ExpenseSheetModal';
import { BudgetsView } from './components/BudgetsView';
import { AnalyticsView } from './components/AnalyticsView';
import { RecurringView } from './components/RecurringView';
import { DataPortabilityView } from './components/DataPortabilityView';

const STORAGE_KEYS = {
  LEDGER_NAME: 'verdant_ledger_custom_name_v1',
  TX: 'verdant_ledger_transactions_v3_empty',
  BUDGETS: 'verdant_ledger_budgets_v3',
  RECURRING: 'verdant_ledger_recurring_v3',
  CURRENCY: 'verdant_ledger_currency_v3_php',
  THEME: 'verdant_ledger_theme_v3',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  // Custom Ledger Name state
  const [ledgerName, setLedgerName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LEDGER_NAME);
      if (saved && saved.trim()) return saved.trim();
    } catch {
      // Fallback
    }
    return 'Verdant Ledger';
  });
  const [isEditingNameInline, setIsEditingNameInline] = useState<boolean>(false);
  const [draftLedgerName, setDraftLedgerName] = useState<string>(ledgerName);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LEDGER_NAME, ledgerName);
      document.title = `${ledgerName} — Mobile Expense Tracker`;
    } catch {
      // Ignore storage errors
    }
  }, [ledgerName]);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    const metaTheme = document.getElementById('theme-color-meta');
    if (isDarkMode) {
      root.classList.add('dark');
      if (metaTheme) metaTheme.setAttribute('content', '#0F172A');
    } else {
      root.classList.remove('dark');
      if (metaTheme) metaTheme.setAttribute('content', '#FFFFFF');
    }
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, isDarkMode ? 'dark' : 'light');
    } catch {
      // Ignore storage errors
    }
  }, [isDarkMode]);

  // Clear All Transactions by default (initializes to empty array [] unless user adds or imports)
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TX);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Fallback to empty array
    }
    return [];
  });

  const [budgets, setBudgets] = useState<CategoryBudget[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BUDGETS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback to default budgets
    }
    return INITIAL_BUDGETS;
  });

  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RECURRING);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Fallback to default recurring bills
    }
    return getInitialRecurringBills();
  });

  // Default currency is CURRENCIES[0] which is Philippine Peso (PHP, ₱)
  const [currency, setCurrency] = useState<CurrencyConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENCY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.code) return parsed;
      }
    } catch {
      // Fallback to PHP
    }
    return CURRENCIES[0];
  });

  // Filters & Search state
  const [selectedDateIso, setSelectedDateIso] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'highest'>('newest');

  // Expense Sheet Modal & iPhone Setup Guide state
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);
  const [sheetMode, setSheetMode] = useState<'manual' | 'scan'>('manual');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [showIPhoneModal, setShowIPhoneModal] = useState<boolean>(false);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TX, JSON.stringify(transactions));
    } catch {
      // Ignore storage quota issues
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
    } catch {
      // Ignore storage quota issues
    }
  }, [budgets]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RECURRING, JSON.stringify(recurringBills));
    } catch {
      // Ignore storage quota issues
    }
  }, [recurringBills]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENCY, JSON.stringify(currency));
    } catch {
      // Ignore storage quota issues
    }
  }, [currency]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const handleCommitInlineName = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = draftLedgerName.trim();
    if (clean) {
      setLedgerName(clean);
      showToast(`Ledger renamed to "${clean}"`);
    }
    setIsEditingNameInline(false);
  };

  // Core financial metrics
  const totalExpenses = useMemo(
    () =>
      transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const totalIncome = useMemo(
    () =>
      transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const totalMonthlyBudget = useMemo(
    () => budgets.reduce((sum, b) => sum + b.monthlyLimit, 0),
    [budgets]
  );

  const budgetRemaining = totalMonthlyBudget - totalExpenses;
  const budgetUsedPct =
    totalMonthlyBudget > 0 ? Math.min(100, Math.round((totalExpenses / totalMonthlyBudget) * 100)) : 0;

  const recentDaysStrip = useMemo(() => getRecentDaysStrip(9), []);

  // Filtered & sorted ledger transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        if (selectedDateIso && tx.date !== selectedDateIso) return false;
        if (selectedCategory !== 'ALL' && tx.category !== selectedCategory) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const inTitle = tx.title.toLowerCase().includes(q);
          const inNotes = (tx.notes ?? '').toLowerCase().includes(q);
          const inCat = tx.category.toLowerCase().includes(q);
          if (!inTitle && !inNotes && !inCat) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'highest') return b.amount - a.amount;
        return b.date.localeCompare(a.date);
      });
  }, [transactions, selectedDateIso, selectedCategory, searchQuery, sortOrder]);

  // Handlers
  const handleOpenAddModal = (mode: 'manual' | 'scan' = 'manual') => {
    setEditingTx(null);
    setSheetMode(mode);
    setIsSheetOpen(true);
  };

  const handleOpenEditModal = (tx: Transaction) => {
    setEditingTx(tx);
    setSheetMode('manual');
    setIsSheetOpen(true);
  };

  const handleSaveTransaction = (txData: Omit<Transaction, 'id'>, existingId?: string) => {
    if (existingId) {
      setTransactions((prev) =>
        prev.map((item) => (item.id === existingId ? { ...txData, id: existingId } : item))
      );
      showToast(`Updated ${txData.title}`);
    } else {
      const newTx: Transaction = {
        ...txData,
        id: `tx-${Date.now()}`,
      };
      setTransactions((prev) => [newTx, ...prev]);
      showToast(`Logged ${txData.title} (${formatMoney(txData.amount, currency)})`);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    const target = transactions.find((t) => t.id === id);
    setTransactions((prev) => prev.filter((item) => item.id !== id));
    if (target) {
      showToast(`Removed ${target.title}`);
    }
  };

  const handleUpdateBudgetLimit = (
    category: Exclude<ExpenseCategory, 'Income'>,
    newLimit: number
  ) => {
    setBudgets((prev) =>
      prev.map((b) => (b.category === category ? { ...b, monthlyLimit: newLimit } : b))
    );
    showToast(`Updated ${category} limit to ${formatMoney(newLimit, currency)}`);
  };

  const handleLogRecurringPayment = (bill: RecurringBill) => {
    const todayIso = new Date().toISOString().slice(0, 10);
    const newTx: Transaction = {
      id: `tx-rec-${Date.now()}`,
      title: bill.title,
      amount: bill.amount,
      type: 'expense',
      category: bill.category,
      date: todayIso,
      paymentMethod: bill.paymentMethod,
      notes: `Recurring ${bill.frequency} bill payment`,
      recurringId: bill.id,
    };

    // Advance next due date
    const d = new Date(bill.nextDueDate + 'T00:00:00');
    if (bill.frequency === 'weekly') d.setDate(d.getDate() + 7);
    else if (bill.frequency === 'yearly') d.setFullYear(d.getFullYear() + 1);
    else d.setMonth(d.getMonth() + 1);
    const nextIso = d.toISOString().slice(0, 10);

    setTransactions((prev) => [newTx, ...prev]);
    setRecurringBills((prev) =>
      prev.map((item) =>
        item.id === bill.id
          ? { ...item, lastPaidDate: todayIso, nextDueDate: nextIso }
          : item
      )
    );
    showToast(`Paid ${bill.title} & advanced next renewal to ${formatShortDate(nextIso)}`);
  };

  const handleAddRecurringBill = (billData: Omit<RecurringBill, 'id'>) => {
    const newBill: RecurringBill = {
      ...billData,
      id: `rec-${Date.now()}`,
    };
    setRecurringBills((prev) => [...prev, newBill]);
    showToast(`Added recurring bill: ${billData.title}`);
  };

  const handleDeleteRecurringBill = (id: string) => {
    setRecurringBills((prev) => prev.filter((b) => b.id !== id));
    showToast('Removed recurring bill');
  };

  const handleQuickExportCSV = () => {
    const csv = generateTransactionsCSV(filteredTransactions);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const slug =
      ledgerName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'ledger';
    link.setAttribute('download', `${slug}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${filteredTransactions.length} transactions as CSV`);
  };

  // Top Bar Navigation Items (Strict 3-Zone Top Bar Contract)
  const navItems: Array<{ id: ActiveTab; label: string; icon: React.ReactNode }> = [
    { id: 'overview', label: 'Ledger', icon: <Wallet size={19} /> },
    { id: 'budgets', label: 'Budgets', icon: <PieChart size={19} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={19} /> },
    { id: 'recurring', label: 'Recurring', icon: <CalendarClock size={19} /> },
    { id: 'data', label: 'Settings', icon: <FileSpreadsheet size={19} /> },
  ];

  // Category spending map for sidebar quick preview
  const categorySpendMap = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach((tx) => {
      if (tx.type === 'expense') {
        map[tx.category] = (map[tx.category] ?? 0) + tx.amount;
      }
    });
    return map;
  }, [transactions]);

  return (
    <div className="min-h-dvh flex flex-col bg-[#F8FAFC] dark:bg-[#090D16] text-[#0F172A] dark:text-[#F8FAFC] mb-safe-nav md:pb-12 transition-colors duration-200">
      {/* Solid Opaque iPhone-Safe Top Bar (No backdrop blur collision or crushed height on iOS) */}
      <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 pt-safe px-4 sm:px-6 min-h-14 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element Brand Wordmark (Dynamic Custom Ledger Name) */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('overview');
          }}
          className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 font-display truncate max-w-[200px] sm:max-w-xs shrink-0 py-3"
        >
          {ledgerName}
        </a>

        {/* Zone 2: 5 clean single-line text navigation links */}
        <nav
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400"
          aria-label="Primary Navigation"
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`min-h-[44px] px-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                activeTab === item.id
                  ? 'border-emerald-600 dark:border-emerald-500 text-slate-900 dark:text-slate-100 font-semibold'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: 1 Primary Action Button */}
        <div className="flex items-center shrink-0 py-2">
          <button
            type="button"
            onClick={() => handleOpenAddModal('manual')}
            className="min-h-[40px] px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] rounded-xl flex items-center gap-1.5 shadow-xs transition-all whitespace-nowrap shrink-0"
          >
            <Plus size={16} />
            <span>Log Expense</span>
          </button>
        </div>
      </header>

      {/* Main Responsive Workspace Container */}
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-5 flex-1 space-y-5 sm:space-y-6">
        {/* Top Financial Overview Banner */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 space-y-5">
          {/* Sub-Toolbar for Renaming Ledger, Dark Mode, and iPhone Setup */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800">
            {isEditingNameInline ? (
              <form
                onSubmit={handleCommitInlineName}
                className="flex items-center gap-2 flex-1 min-w-[220px]"
              >
                <input
                  type="text"
                  value={draftLedgerName}
                  onChange={(e) => setDraftLedgerName(e.target.value)}
                  maxLength={36}
                  placeholder="Enter ledger name..."
                  autoFocus
                  className="min-h-[38px] px-3 py-1 rounded-xl border border-emerald-500 bg-white dark:bg-slate-950 text-base sm:text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none"
                />
                <button
                  type="submit"
                  className="min-h-[38px] px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1 shrink-0"
                >
                  <Check size={14} />
                  <span>Save</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingNameInline(false)}
                  className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold shrink-0"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {ledgerName}
                </span>
                <span className="text-xs text-slate-400" aria-hidden="true">
                  ·
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {currency.code} ({currency.symbol})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setDraftLedgerName(ledgerName);
                    setIsEditingNameInline(true);
                  }}
                  className="min-h-[34px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
                >
                  <Edit3 size={12} />
                  <span>Rename Ledger</span>
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowIPhoneModal(true)}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
              >
                <Smartphone size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span>iPhone Setup</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDarkMode((prev) => !prev)}
                aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
              >
                {isDarkMode ? (
                  <>
                    <Sun size={14} className="text-amber-400" />
                    <span>Light</span>
                  </>
                ) : (
                  <>
                    <Moon size={14} className="text-slate-600" />
                    <span>Dark</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left Primary Focal Anchor: Remaining Budget & Total Spend */}
            <div className="lg:col-span-5 space-y-2">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Monthly Spend vs. Planned Budget
              </div>
              <div className="flex items-baseline gap-3 font-mono-num flex-wrap">
                <span className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {formatMoney(totalExpenses, currency)}
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  of {formatMoney(totalMonthlyBudget, currency)} budget
                </span>
              </div>

              {/* Clean Progress Bar */}
              <div className="pt-1">
                <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-200 ${
                      budgetRemaining < 0
                        ? 'bg-rose-600'
                        : budgetUsedPct >= 80
                        ? 'bg-amber-500'
                        : 'bg-emerald-600 dark:bg-emerald-500'
                    }`}
                    style={{ width: `${Math.max(2, budgetUsedPct)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-mono-num">
                  <span>{budgetUsedPct}% of monthly budget used</span>
                  <span
                    className={
                      budgetRemaining < 0
                        ? 'text-rose-600 dark:text-rose-400 font-semibold'
                        : 'text-emerald-700 dark:text-emerald-400 font-semibold'
                    }
                  >
                    {budgetRemaining >= 0
                      ? `${formatMoney(budgetRemaining, currency)} left`
                      : `${formatMoney(Math.abs(budgetRemaining), currency)} over`}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Metrics & Quick Action Toolbar */}
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 lg:pl-6">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Monthly Income</div>
                <div className="font-mono-num text-lg sm:text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {formatMoney(totalIncome, currency, true)}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Net {formatMoney(totalIncome - totalExpenses, currency, true)}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Upcoming Bills</div>
                <div className="font-mono-num text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {recurringBills.filter((b) => b.active).length} active
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Next due{' '}
                  {recurringBills[0] ? formatShortDate(recurringBills[0].nextDueDate) : 'None'}
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1 flex sm:flex-col justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenAddModal('scan')}
                  className="flex-1 min-h-[44px] px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/70 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                >
                  <Camera size={15} />
                  <span>Scan Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={handleQuickExportCSV}
                  className="flex-1 min-h-[44px] px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                >
                  <Download size={14} />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* View Switcher Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left / Center Column: Daily Date Scroller + Interactive Transaction Feed */}
            <div className="lg:col-span-8 space-y-4">
              {/* Horizontal Date Scroller (Mobile Touch Pattern) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3.5">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Filter by Day
                  </span>
                  {selectedDateIso && (
                    <button
                      type="button"
                      onClick={() => setSelectedDateIso(null)}
                      className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                    >
                      Show All Days
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                  <button
                    type="button"
                    onClick={() => setSelectedDateIso(null)}
                    className={`min-h-[48px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      selectedDateIso === null
                        ? 'bg-slate-900 dark:bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    All Dates
                  </button>
                  {recentDaysStrip.map((d) => {
                    const isSelected = selectedDateIso === d.iso;
                    const hasSpend = transactions.some(
                      (tx) => tx.date === d.iso && tx.type === 'expense'
                    );
                    return (
                      <button
                        key={d.iso}
                        type="button"
                        onClick={() =>
                          setSelectedDateIso((prev) => (prev === d.iso ? null : d.iso))
                        }
                        className={`min-h-[48px] min-w-[52px] px-2.5 py-1.5 rounded-xl flex flex-col items-center justify-center transition-colors shrink-0 ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/70'
                        }`}
                      >
                        <span
                          className={`text-[10px] font-medium ${
                            isSelected ? 'text-emerald-100' : 'text-slate-400 dark:text-slate-400'
                          }`}
                        >
                          {d.isToday ? 'Today' : d.dayName}
                        </span>
                        <span className="font-mono-num text-xs font-bold mt-0.5">
                          {d.dayNum}
                        </span>
                        {hasSpend && (
                          <span
                            className={`w-1 h-1 rounded-full mt-0.5 ${
                              isSelected ? 'bg-white' : 'bg-emerald-600 dark:bg-emerald-400'
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Search, Category Filter & Sort Controls */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <Search
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search merchants, categories, or notes..."
                      className="w-full min-h-[44px] pl-9 pr-9 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-base sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-600"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        aria-label="Clear search"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSortOrder((prev) => (prev === 'newest' ? 'highest' : 'newest'))
                    }
                    className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <SlidersHorizontal size={14} />
                    <span>Sort: {sortOrder === 'newest' ? 'Newest First' : 'Highest Amount'}</span>
                  </button>
                </div>

                {/* Interactive Category Filter Buttons */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
                  {(['ALL', ...EXPENSE_CATEGORIES, 'Income'] as const).map((cat) => {
                    const active = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                          active
                            ? 'bg-slate-900 dark:bg-emerald-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
                        }`}
                      >
                        {cat === 'ALL' ? 'All Categories' : cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Interactive Tap List Rows (Transactions) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Transactions ({filteredTransactions.length})
                  </h2>
                  {transactions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setTransactions([]);
                        showToast('Cleared all transactions');
                      }}
                      className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {filteredTransactions.length === 0 ? (
                  <div className="p-10 text-center space-y-3">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {transactions.length === 0
                        ? 'Your ledger is clean and ready'
                        : 'No transactions match your current filter'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      {transactions.length === 0
                        ? 'Log your first expense in Philippine Peso (₱) using the tactile keypad or snap a receipt photo.'
                        : 'Try clearing your date or category filter, or log a new expense.'}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      {(selectedDateIso || selectedCategory !== 'ALL' || searchQuery) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDateIso(null);
                            setSelectedCategory('ALL');
                            setSearchQuery('');
                          }}
                          className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200"
                        >
                          Reset Filters
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenAddModal('manual')}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white flex items-center gap-1.5"
                      >
                        <Plus size={15} />
                        <span>Log First Expense</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenAddModal('scan')}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/70 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5"
                      >
                        <Camera size={15} />
                        <span>Scan Receipt</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredTransactions.map((tx) => (
                      <button
                        key={tx.id}
                        type="button"
                        onClick={() => handleOpenEditModal(tx)}
                        className="w-full min-h-[68px] px-5 py-3.5 flex items-center justify-between gap-3.5 text-left hover:bg-slate-50/90 dark:hover:bg-slate-800/60 active:bg-slate-100/70 dark:active:bg-slate-800 transition-colors group"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <CategoryIcon category={tx.category} size="md" />
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {tx.title}
                            </div>
                            {/* Zero-Pill Metadata Discipline: Unboxed text with middle-dot separators */}
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                              <span>{tx.category}</span>
                              <span aria-hidden="true">·</span>
                              <span>{tx.paymentMethod}</span>
                              <span aria-hidden="true">·</span>
                              <span>{formatShortDate(tx.date)}</span>
                              {tx.receiptItems && tx.receiptItems.length > 0 && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                                    Receipt ({tx.receiptItems.length} items)
                                  </span>
                                </>
                              )}
                            </div>
                            {tx.notes && (
                              <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                                {tx.notes}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right font-mono-num">
                            <div
                              className={`text-sm sm:text-base font-bold ${
                                tx.type === 'income'
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-slate-900 dark:text-slate-100'
                              }`}
                            >
                              {tx.type === 'income' ? '+' : '−'}
                              {formatMoney(tx.amount, currency)}
                            </div>
                          </div>
                          <ChevronRight
                            size={16}
                            className="text-slate-300 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors"
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column on Desktop: Category Budget Watch & Upcoming Subscriptions */}
            <aside className="lg:col-span-4 space-y-6">
              {/* Budget Watch Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Category Budget Watch
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('budgets')}
                    className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    Manage Limits →
                  </button>
                </div>

                <div className="space-y-3.5">
                  {budgets.slice(0, 5).map((b) => {
                    const spent = categorySpendMap[b.category] ?? 0;
                    const pct =
                      b.monthlyLimit > 0 ? Math.round((spent / b.monthlyLimit) * 100) : 0;
                    const isOver = spent > b.monthlyLimit;
                    const isWarn = !isOver && pct >= 80;
                    const meta = CATEGORY_META[b.category];

                    return (
                      <div key={b.category} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {b.category}
                          </span>
                          <span className="font-mono-num text-slate-600 dark:text-slate-400">
                            {formatMoney(spent, currency)} / {formatMoney(b.monthlyLimit, currency)}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isOver
                                ? 'bg-rose-600'
                                : isWarn
                                ? 'bg-amber-500'
                                : meta.barClass
                            }`}
                            style={{ width: `${Math.min(100, Math.max(2, pct))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Next Recurring Bills Snapshot */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Upcoming Bills
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('recurring')}
                    className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    All Bills →
                  </button>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recurringBills.slice(0, 4).map((bill) => (
                    <div
                      key={bill.id}
                      className="py-2.5 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {bill.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Due {formatShortDate(bill.nextDueDate)} · {bill.paymentMethod}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleLogRecurringPayment(bill)}
                        className="min-h-[38px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/70 hover:text-emerald-800 dark:hover:text-emerald-300 text-xs font-mono-num font-semibold text-slate-800 dark:text-slate-200 transition-colors shrink-0"
                        title="Click to log payment now"
                      >
                        {formatMoney(bill.amount, currency)}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        )}

        {activeTab === 'budgets' && (
          <BudgetsView
            budgets={budgets}
            transactions={transactions}
            currency={currency}
            onUpdateBudgetLimit={handleUpdateBudgetLimit}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView transactions={transactions} currency={currency} />
        )}

        {activeTab === 'recurring' && (
          <RecurringView
            recurringBills={recurringBills}
            currency={currency}
            onLogRecurringPayment={handleLogRecurringPayment}
            onAddRecurringBill={handleAddRecurringBill}
            onDeleteRecurringBill={handleDeleteRecurringBill}
          />
        )}

        {activeTab === 'data' && (
          <DataPortabilityView
            ledgerName={ledgerName}
            onUpdateLedgerName={(newName) => {
              setLedgerName(newName);
              setDraftLedgerName(newName);
            }}
            transactions={transactions}
            budgets={budgets}
            recurringBills={recurringBills}
            currency={currency}
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
            onSelectCurrency={setCurrency}
            onImportTransactions={(imported) => {
              setTransactions((prev) => [...imported, ...prev]);
            }}
            onRestoreBackup={(backup) => {
              setLedgerName(backup.ledgerName);
              setDraftLedgerName(backup.ledgerName);
              setCurrency(backup.currency);
              setTransactions(backup.transactions);
              setBudgets(backup.budgets);
              setRecurringBills(backup.recurringBills);
              showToast(`Restored backup "${backup.ledgerName}"`);
            }}
            onRestoreDemoData={() => {
              setTransactions(getInitialTransactions());
              setBudgets(INITIAL_BUDGETS);
              setRecurringBills(getInitialRecurringBills());
              setCurrency(CURRENCIES[0]);
            }}
            onClearAllData={() => {
              setTransactions([]);
            }}
          />
        )}
      </main>

      {/* Mobile Fixed Bottom Tab Bar with Solid Opaque Surface & iPhone Safe-Area Padding */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 pb-safe bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-2 grid grid-cols-5 items-center"
        aria-label="Mobile Bottom Navigation"
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`min-h-[54px] flex flex-col items-center justify-center rounded-xl transition-colors ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-semibold tracking-tight mt-0.5 whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* iPhone Safari Install Instructions Modal */}
      {showIPhoneModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-label="iPhone App Setup Guide"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Smartphone size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Install on iPhone
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Full-screen iOS Web App with Dynamic Island support
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIPhoneModal(false)}
                className="min-h-[40px] min-w-[40px] rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/70 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-700/70">
              <div className="flex items-start gap-3">
                <Share size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    Step 1: Tap Share in Safari
                  </span>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Open this page in Safari on your iPhone and tap the Share button at the bottom of the screen.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-2 border-t border-slate-200/70 dark:border-slate-700/70">
                <PlusSquare
                  size={16}
                  className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5"
                />
                <div>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    Step 2: Add to Home Screen
                  </span>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Scroll down and tap <strong>Add to Home Screen</strong>. {ledgerName} will launch full-screen without browser bars and keep your Peso (₱) data saved offline on your iPhone.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIPhoneModal(false)}
              className="w-full min-h-[46px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-20 md:bottom-6 right-4 z-40 bg-slate-900 dark:bg-emerald-600 text-white text-xs font-medium px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5"
        >
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Slide-Up Quick Expense & Receipt Scanner Modal */}
      <ExpenseSheetModal
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onSave={handleSaveTransaction}
        onDelete={handleDeleteTransaction}
        editingTransaction={editingTx}
        currency={currency}
        initialMode={sheetMode}
      />
    </div>
  );
}
