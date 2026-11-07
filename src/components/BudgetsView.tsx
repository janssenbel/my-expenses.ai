import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Edit3, Check, X } from 'lucide-react';
import { CategoryBudget, CurrencyConfig, ExpenseCategory, Transaction } from '../types';
import { CATEGORY_META } from '../data/demoData';
import { CategoryIcon } from './CategoryIcon';
import { formatMoney } from '../utils/formatters';

interface BudgetsViewProps {
  budgets: CategoryBudget[];
  transactions: Transaction[];
  currency: CurrencyConfig;
  onUpdateBudgetLimit: (category: Exclude<ExpenseCategory, 'Income'>, newLimit: number) => void;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({
  budgets,
  transactions,
  currency,
  onUpdateBudgetLimit,
}) => {
  const [editingCategory, setEditingCategory] = useState<Exclude<ExpenseCategory, 'Income'> | null>(
    null
  );
  const [draftLimit, setDraftLimit] = useState<string>('');

  // Compute current month expenses per category
  const spentByCategory = transactions.reduce<Record<string, number>>((acc, tx) => {
    if (tx.type === 'expense') {
      acc[tx.category] = (acc[tx.category] ?? 0) + tx.amount;
    }
    return acc;
  }, {});

  const totalBudgetLimit = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);
  const totalBudgetSpent = budgets.reduce((sum, b) => sum + (spentByCategory[b.category] ?? 0), 0);
  const overallRatio = totalBudgetLimit > 0 ? totalBudgetSpent / totalBudgetLimit : 0;
  const overallPercent = Math.min(100, Math.round(overallRatio * 100));

  // SVG Ring geometry
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - Math.min(1, overallRatio) * circumference;

  const startEditing = (cat: Exclude<ExpenseCategory, 'Income'>, currentLimit: number) => {
    setEditingCategory(cat);
    setDraftLimit(String(currentLimit));
  };

  const commitEdit = (cat: Exclude<ExpenseCategory, 'Income'>) => {
    const val = parseFloat(draftLimit);
    if (!Number.isNaN(val) && val >= 10) {
      onUpdateBudgetLimit(cat, Math.round(val));
    }
    setEditingCategory(null);
  };

  return (
    <div className="space-y-6">
      {/* Overall Monthly Envelope Summary */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Monthly Category Budget Envelope · {budgets.length} Active Limits
          </div>
          <div className="flex items-baseline gap-2.5 font-mono-num">
            <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {formatMoney(totalBudgetSpent, currency)}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              of {formatMoney(totalBudgetLimit, currency)} limit
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {totalBudgetLimit >= totalBudgetSpent
              ? `${formatMoney(totalBudgetLimit - totalBudgetSpent, currency)} remaining across your planned monthly budgets.`
              : `${formatMoney(totalBudgetSpent - totalBudgetLimit, currency)} over your combined monthly budget target.`}
          </p>
        </div>

        {/* SVG Progress Ring */}
        <div className="flex items-center gap-4 self-end sm:self-center">
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth="10"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke={
                  overallRatio > 1 ? '#DC2626' : overallRatio >= 0.8 ? '#D97706' : '#059669'
                }
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center font-mono-num">
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {overallPercent}%
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">used</span>
            </div>
          </div>
        </div>
      </div>

      {/* Individual Category Budget Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Category Spending Limits
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tap any monthly limit to adjust your target threshold.
            </p>
          </div>
        </div>

        {budgets.map((budget) => {
          const spent = spentByCategory[budget.category] ?? 0;
          const ratio = budget.monthlyLimit > 0 ? spent / budget.monthlyLimit : 0;
          const pct = Math.round(ratio * 100);
          const remaining = budget.monthlyLimit - spent;
          const isOver = ratio > 1;
          const isWarning = !isOver && ratio >= budget.alertThreshold;
          const meta = CATEGORY_META[budget.category];

          return (
            <div key={budget.category} className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <CategoryIcon category={budget.category} size="md" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {budget.category}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {isOver ? (
                        <span className="text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                          <AlertTriangle size={13} />
                          Over limit by {formatMoney(Math.abs(remaining), currency)}
                        </span>
                      ) : isWarning ? (
                        <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                          <AlertTriangle size={13} />
                          Approaching limit · {formatMoney(remaining, currency)} left
                        </span>
                      ) : (
                        <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 size={13} />
                          On track · {formatMoney(remaining, currency)} left
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Inline Budget Editor or Value Display */}
                <div className="text-right shrink-0">
                  {editingCategory === budget.category ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={10}
                        step={100}
                        value={draftLimit}
                        onChange={(e) => setDraftLimit(e.target.value)}
                        className="w-28 min-h-[40px] px-2.5 py-1 rounded-lg border border-emerald-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-base sm:text-sm font-mono-num text-right focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => commitEdit(budget.category)}
                        aria-label="Save budget limit"
                        className="min-h-[40px] min-w-[40px] rounded-lg bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCategory(null)}
                        aria-label="Cancel budget edit"
                        className="min-h-[40px] min-w-[40px] rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEditing(budget.category, budget.monthlyLimit)}
                      className="min-h-[44px] px-2.5 py-1 -mr-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors text-right group"
                    >
                      <div className="font-mono-num text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center justify-end gap-1.5">
                        <span>{formatMoney(spent, currency)}</span>
                        <span className="text-slate-400 dark:text-slate-500 font-normal">/</span>
                        <span className="text-slate-600 dark:text-slate-300">
                          {formatMoney(budget.monthlyLimit, currency)}
                        </span>
                        <Edit3
                          size={13}
                          className="text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors"
                        />
                      </div>
                      <div className="font-mono-num text-[11px] text-slate-500 dark:text-slate-400">
                        {pct}% utilized
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-200 ${
                    isOver ? 'bg-rose-600' : isWarning ? 'bg-amber-500' : meta.barClass
                  }`}
                  style={{ width: `${Math.min(100, Math.max(2, pct))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
