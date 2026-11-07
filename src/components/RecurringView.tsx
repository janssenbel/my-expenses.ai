import React, { useState } from 'react';
import { CalendarClock, Check, Plus, Trash2 } from 'lucide-react';
import { CurrencyConfig, ExpenseCategory, PaymentMethod, RecurringBill } from '../types';
import { EXPENSE_CATEGORIES } from '../data/demoData';
import { formatMoney, formatShortDate } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface RecurringViewProps {
  recurringBills: RecurringBill[];
  currency: CurrencyConfig;
  onLogRecurringPayment: (bill: RecurringBill) => void;
  onAddRecurringBill: (bill: Omit<RecurringBill, 'id'>) => void;
  onDeleteRecurringBill: (id: string) => void;
}

export const RecurringView: React.FC<RecurringViewProps> = ({
  recurringBills,
  currency,
  onLogRecurringPayment,
  onAddRecurringBill,
  onDeleteRecurringBill,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Exclude<ExpenseCategory, 'Income'>>('Housing & Bills');
  const [frequency, setFrequency] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');
  const [nextDueDate, setNextDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('GCash');
  const [autoPay, setAutoPay] = useState(true);

  const sortedBills = [...recurringBills].sort((a, b) =>
    a.nextDueDate.localeCompare(b.nextDueDate)
  );

  const monthlyCommittedTotal = recurringBills.reduce((sum, bill) => {
    if (!bill.active) return sum;
    if (bill.frequency === 'weekly') return sum + bill.amount * 4.33;
    if (bill.frequency === 'yearly') return sum + bill.amount / 12;
    return sum + bill.amount;
  }, 0);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!title.trim() || Number.isNaN(num) || num <= 0) return;

    onAddRecurringBill({
      title: title.trim(),
      amount: Math.round(num * 100) / 100,
      category,
      frequency,
      nextDueDate,
      paymentMethod,
      autoPay,
      active: true,
    });

    setTitle('');
    setAmount('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Summary Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Monthly Fixed & Subscription Commitment
          </div>
          <div className="font-mono-num text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {formatMoney(monthlyCommittedTotal, currency)}
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400"> / month</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {recurringBills.length} active recurring bills and subscriptions tracked.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm((prev) => !prev)}
          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-2 self-start sm:self-center transition-colors whitespace-nowrap shrink-0"
        >
          <Plus size={16} />
          <span>{showAddForm ? 'Cancel' : 'Add Recurring Bill'}</span>
        </button>
      </div>

      {/* Optional Add New Recurring Bill Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-5 space-y-4"
        >
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            New Recurring Subscription or Bill
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Bill / Service Name
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Meralco, Globe Fiber, Condo Dues"
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-base sm:text-sm focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Amount ({currency.symbol})
              </label>
              <input
                type="number"
                step="0.01"
                min="0.5"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1699.00"
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-base sm:text-sm font-mono-num focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Next Renewal Date
              </label>
              <input
                type="date"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-base sm:text-sm font-mono-num focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Exclude<ExpenseCategory, 'Income'>)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-base sm:text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Billing Cycle
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as 'monthly' | 'weekly' | 'yearly')}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-base sm:text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600"
              >
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-base sm:text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600"
              >
                <option value="GCash">GCash</option>
                <option value="Maya">Maya</option>
                <option value="Apple Pay">Apple Pay</option>
                <option value="Card">Card</option>
                <option value="Transfer">Transfer</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer min-h-[44px]">
              <input
                type="checkbox"
                checked={autoPay}
                onChange={(e) => setAutoPay(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Auto-pay enabled on renewal date</span>
            </label>

            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              Save Recurring Rule
            </button>
          </div>
        </form>
      )}

      {/* Upcoming Bills List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Upcoming Renewals & Bills
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Mark any bill as paid to record it in your ledger and advance its next due date.
            </p>
          </div>
          <CalendarClock size={18} className="text-slate-400 dark:text-slate-500" />
        </div>

        {sortedBills.map((bill) => (
          <div
            key={bill.id}
            className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <CategoryIcon category={bill.category} size="md" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {bill.title}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                  <span>{bill.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className="capitalize">{bill.frequency}</span>
                  <span aria-hidden="true">·</span>
                  <span>Due {formatShortDate(bill.nextDueDate)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{bill.autoPay ? 'Auto-Pay' : 'Manual Bill'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
              <div className="text-left sm:text-right font-mono-num">
                <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {formatMoney(bill.amount, currency)}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {bill.paymentMethod}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onLogRecurringPayment(bill)}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/70 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                >
                  <Check size={14} />
                  <span>Log Payment</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteRecurringBill(bill.id)}
                  aria-label={`Remove ${bill.title}`}
                  className="min-h-[44px] min-w-[44px] rounded-xl text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center justify-center transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
