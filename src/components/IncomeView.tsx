import React, { useMemo, useState } from 'react';
import {
  Plus,
  ArrowDownLeft,
  ChevronRight,
  Search,
  X,
  Trash2,
  Check,
} from 'lucide-react';
import { CurrencyConfig, PaymentMethod, Transaction } from '../types';
import { formatMoney, formatShortDate } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface IncomeViewProps {
  transactions: Transaction[];
  currency: CurrencyConfig;
  onOpenIncomeKeypad: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onAddIncomeDirect: (tx: Omit<Transaction, 'id'>) => void;
  onDeleteTransaction: (id: string) => void;
}

const DEPOSIT_METHODS: PaymentMethod[] = ['Transfer', 'GCash', 'Maya', 'Cash', 'Card', 'Apple Pay'];

const INCOME_PRESET_SOURCES = [
  'Payroll / Salary',
  'Freelance / Client Invoice',
  'Business / Side Hustle',
  '13th Month / Bonus',
  'Allowance / Remittance',
  'Dividends / Interest',
];

export const IncomeView: React.FC<IncomeViewProps> = ({
  transactions,
  currency,
  onOpenIncomeKeypad,
  onEditTransaction,
  onAddIncomeDirect,
  onDeleteTransaction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showQuickForm, setShowQuickForm] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Transfer');
  const [notes, setNotes] = useState('');

  const incomeTransactions = useMemo(
    () =>
      transactions
        .filter((tx) => tx.type === 'income')
        .sort((a, b) => b.date.localeCompare(a.date)),
    [transactions]
  );

  const expenseTransactions = useMemo(
    () => transactions.filter((tx) => tx.type === 'expense'),
    [transactions]
  );

  const totalIncome = useMemo(
    () => incomeTransactions.reduce((sum, tx) => sum + tx.amount, 0),
    [incomeTransactions]
  );

  const totalExpenses = useMemo(
    () => expenseTransactions.reduce((sum, tx) => sum + tx.amount, 0),
    [expenseTransactions]
  );

  const netBalance = totalIncome - totalExpenses;

  const filteredIncomes = useMemo(() => {
    if (!searchQuery.trim()) return incomeTransactions;
    const q = searchQuery.toLowerCase();
    return incomeTransactions.filter(
      (tx) =>
        tx.title.toLowerCase().includes(q) ||
        (tx.notes ?? '').toLowerCase().includes(q) ||
        tx.paymentMethod.toLowerCase().includes(q)
    );
  }, [incomeTransactions, searchQuery]);

  const byDepositMethod = useMemo(() => {
    const map: Record<string, { method: PaymentMethod; total: number; count: number }> = {};
    incomeTransactions.forEach((tx) => {
      if (!map[tx.paymentMethod]) {
        map[tx.paymentMethod] = { method: tx.paymentMethod, total: 0, count: 0 };
      }
      map[tx.paymentMethod].total += tx.amount;
      map[tx.paymentMethod].count += 1;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [incomeTransactions]);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (Number.isNaN(num) || num <= 0) return;

    onAddIncomeDirect({
      title: title.trim() || 'Income Deposit',
      amount: Math.round(num * 100) / 100,
      type: 'income',
      category: 'Income',
      date,
      paymentMethod,
      notes: notes.trim() || undefined,
    });

    setTitle('');
    setAmount('');
    setNotes('');
    setShowQuickForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Income & Net Cashflow Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Total Logged Income
          </div>
          <div className="font-mono-num text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatMoney(totalIncome, currency, true)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Across {incomeTransactions.length}{' '}
            {incomeTransactions.length === 1 ? 'deposit' : 'deposits'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Net Cashflow (Income − Spend)
          </div>
          <div
            className={`font-mono-num text-2xl sm:text-3xl font-bold mt-1 ${
              netBalance >= 0
                ? 'text-slate-900 dark:text-slate-100'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatMoney(netBalance, currency, true)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            After {formatMoney(totalExpenses, currency)} in expenses
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 flex flex-col justify-between gap-3">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Record New Income
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Log salary, client payouts, or remittances.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenIncomeKeypad}
              className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus size={15} />
              <span>Keypad Entry</span>
            </button>
            <button
              type="button"
              onClick={() => setShowQuickForm((prev) => !prev)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              {showQuickForm ? 'Close Form' : 'Quick Form'}
            </button>
          </div>
        </div>
      </div>

      {/* Inline Quick Income Entry Form */}
      {showQuickForm && (
        <form
          onSubmit={handleQuickSubmit}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              New Income Entry
            </h3>
            <div className="flex items-center gap-1.5 flex-wrap">
              {INCOME_PRESET_SOURCES.slice(0, 4).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTitle(preset)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium hover:bg-emerald-100 transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Income Source / Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Payroll, Client Invoice, Bonus"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-base sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Amount ({currency.symbol})
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="25000.00"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-base sm:text-sm font-mono-num text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date Received
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-base sm:text-sm font-mono-num text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Deposit Account / Method
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {DEPOSIT_METHODS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`min-h-[40px] px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                      paymentMethod === m
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-between gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Semi-monthly payout or project milestone"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-base sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Check size={15} />
              <span>Save Income Entry</span>
            </button>
          </div>
        </form>
      )}

      {/* Main Income Ledger & Deposit Channel Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
          <div className="p-4 sm:px-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Income History ({filteredIncomes.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tap any income entry to edit or delete
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search income sources..."
                className="w-full min-h-[40px] pl-8 pr-8 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-base sm:text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {filteredIncomes.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <ArrowDownLeft size={22} />
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                No income entries recorded yet
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Record your salary, freelance invoices, or side-hustle payouts to track your net savings rate in {currency.code} ({currency.symbol}).
              </p>
              <div className="pt-1 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={onOpenIncomeKeypad}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white flex items-center gap-1.5"
                >
                  <Plus size={15} />
                  <span>Log First Income</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredIncomes.map((tx) => (
                <div
                  key={tx.id}
                  className="w-full min-h-[68px] px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => onEditTransaction(tx)}
                    className="flex items-center gap-3.5 min-w-0 flex-1 text-left"
                  >
                    <CategoryIcon category="Income" size="md" />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {tx.title}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        <span>Income</span>
                        <span aria-hidden="true">·</span>
                        <span>{tx.paymentMethod}</span>
                        <span aria-hidden="true">·</span>
                        <span>{formatShortDate(tx.date)}</span>
                      </div>
                      {tx.notes && (
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                          {tx.notes}
                        </div>
                      )}
                    </div>
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditTransaction(tx)}
                      className="text-right font-mono-num flex items-center gap-1.5"
                    >
                      <span className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400">
                        +{formatMoney(tx.amount, currency)}
                      </span>
                      <ChevronRight size={15} className="text-slate-300 dark:text-slate-600" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteTransaction(tx.id)}
                      aria-label={`Delete ${tx.title}`}
                      className="min-h-[40px] min-w-[40px] rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center justify-center transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Income by Deposit Channel */}
        <aside className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Income by Channel
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Where your incoming funds are deposited
            </p>
          </div>

          {byDepositMethod.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-4">
              Deposit channel totals will appear here once you log income.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {byDepositMethod.map((item) => {
                const pct = totalIncome > 0 ? Math.round((item.total / totalIncome) * 100) : 0;
                return (
                  <div key={item.method} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {item.method}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {item.count} {item.count === 1 ? 'deposit' : 'deposits'} · {pct}%
                      </div>
                    </div>
                    <div className="font-mono-num text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      +{formatMoney(item.total, currency)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
