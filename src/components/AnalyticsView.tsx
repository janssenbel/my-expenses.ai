import React, { useMemo, useState } from 'react';
import { CurrencyConfig, ExpenseCategory, Transaction } from '../types';
import { CATEGORY_META, EXPENSE_CATEGORIES } from '../data/demoData';
import { formatMoney } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface AnalyticsViewProps {
  transactions: Transaction[];
  currency: CurrencyConfig;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ transactions, currency }) => {
  const [timeframeDays, setTimeframeDays] = useState<7 | 14 | 30>(14);

  const expenses = useMemo(
    () => transactions.filter((t) => t.type === 'expense'),
    [transactions]
  );
  const incomes = useMemo(
    () => transactions.filter((t) => t.type === 'income'),
    [transactions]
  );

  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);
  const totalIncome = incomes.reduce((s, t) => s + t.amount, 0);
  const savingsRate =
    totalIncome > 0 ? Math.max(0, Math.round(((totalIncome - totalExpense) / totalIncome) * 100)) : 0;

  // Daily Bar Chart Data
  const dailySeries = useMemo(() => {
    const today = new Date();
    const map: Record<string, number> = {};
    expenses.forEach((tx) => {
      map[tx.date] = (map[tx.date] ?? 0) + tx.amount;
    });

    const days = [];
    for (let i = timeframeDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const shortDay = d.toLocaleDateString('en-US', { weekday: 'narrow' });
      days.push({
        iso,
        label,
        shortDay,
        dayNum: d.getDate(),
        amount: map[iso] ?? 0,
      });
    }
    return days;
  }, [expenses, timeframeDays]);

  const maxDailySpend = Math.max(...dailySeries.map((d) => d.amount), 50);
  const avgDailySpend =
    dailySeries.reduce((s, d) => s + d.amount, 0) / Math.max(1, dailySeries.length);

  // Category Breakdown
  const categoryBreakdown = useMemo(() => {
    const totals: Record<string, { amount: number; count: number }> = {};
    expenses.forEach((tx) => {
      if (!totals[tx.category]) totals[tx.category] = { amount: 0, count: 0 };
      totals[tx.category].amount += tx.amount;
      totals[tx.category].count += 1;
    });

    return EXPENSE_CATEGORIES.map((cat) => ({
      category: cat,
      amount: totals[cat]?.amount ?? 0,
      count: totals[cat]?.count ?? 0,
      share: totalExpense > 0 ? ((totals[cat]?.amount ?? 0) / totalExpense) * 100 : 0,
    }))
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [expenses, totalExpense]);

  // Top Merchants
  const topMerchants = useMemo(() => {
    const byMerchant: Record<
      string,
      { title: string; amount: number; count: number; category: ExpenseCategory }
    > = {};
    expenses.forEach((tx) => {
      const key = tx.title.trim();
      if (!byMerchant[key]) {
        byMerchant[key] = { title: key, amount: 0, count: 0, category: tx.category };
      }
      byMerchant[key].amount += tx.amount;
      byMerchant[key].count += 1;
    });
    return Object.values(byMerchant)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [expenses]);

  return (
    <div className="space-y-6">
      {/* Key Cashflow & Velocity Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Average Daily Burn
          </div>
          <div className="font-mono-num text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {formatMoney(avgDailySpend, currency)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Across last {timeframeDays} calendar days
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Net Savings Rate
          </div>
          <div className="font-mono-num text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {savingsRate}%
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {formatMoney(Math.max(0, totalIncome - totalExpense), currency)} retained of income
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Largest Category
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1 truncate">
            {categoryBreakdown[0]?.category ?? 'None'}
          </div>
          <div className="font-mono-num text-xs text-slate-500 dark:text-slate-400 mt-1">
            {categoryBreakdown[0]
              ? `${formatMoney(categoryBreakdown[0].amount, currency)} (${Math.round(
                  categoryBreakdown[0].share
                )}% of spend)`
              : 'No expenses logged yet'}
          </div>
        </div>
      </div>

      {/* Daily Spending Trend Bar Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Daily Spending Velocity
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Day-by-day expense distribution with peak burn highlights
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start">
            {([7, 14, 30] as const).map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setTimeframeDays(days)}
                className={`min-h-[36px] px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  timeframeDays === days
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {days} Days
              </button>
            ))}
          </div>
        </div>

        {/* Bar Chart Viewport */}
        <div className="pt-4">
          <div className="h-48 flex items-end gap-1.5 sm:gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-2">
            {dailySeries.map((day) => {
              const heightPct =
                day.amount > 0 ? Math.max(8, Math.round((day.amount / maxDailySpend) * 100)) : 3;
              const isPeak = day.amount > 0 && day.amount === maxDailySpend;

              return (
                <div
                  key={day.iso}
                  className="flex-1 h-full flex flex-col justify-end items-center group relative"
                >
                  {/* Hover Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-8 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] font-mono-num px-2 py-1 rounded shadow-sm whitespace-nowrap z-10 transition-opacity">
                    {day.label}: {formatMoney(day.amount, currency)}
                  </div>
                  <div
                    className={`w-full max-w-[28px] rounded-t-md transition-all duration-200 ${
                      day.amount === 0
                        ? 'bg-slate-100 dark:bg-slate-800'
                        : isPeak
                        ? 'bg-amber-500 dark:bg-amber-400'
                        : 'bg-emerald-600 dark:bg-emerald-500 group-hover:bg-emerald-500'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between gap-1 pt-2">
            {dailySeries.map((day, idx) => {
              const showLabel =
                timeframeDays <= 14 || idx % 3 === 0 || idx === dailySeries.length - 1;
              return (
                <div
                  key={day.iso}
                  className="flex-1 text-center font-mono-num text-[10px] text-slate-500 dark:text-slate-400"
                >
                  {showLabel ? day.dayNum : ''}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Category Distribution & Top Merchants Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Spending by Category
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Proportional breakdown of total expenses ({formatMoney(totalExpense, currency)})
            </p>
          </div>

          {/* Multi-segment Horizontal Stacked Bar */}
          {categoryBreakdown.length > 0 && (
            <div className="h-3.5 w-full rounded-full overflow-hidden flex gap-0.5 bg-slate-100 dark:bg-slate-800">
              {categoryBreakdown.map((item) => (
                <div
                  key={item.category}
                  className={CATEGORY_META[item.category].barClass}
                  style={{ width: `${Math.max(3, item.share)}%` }}
                  title={`${item.category}: ${Math.round(item.share)}%`}
                />
              ))}
            </div>
          )}

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {categoryBreakdown.map((item) => (
              <div
                key={item.category}
                className="py-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <CategoryIcon category={item.category} size="sm" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {item.category}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {item.count} {item.count === 1 ? 'transaction' : 'transactions'}
                    </div>
                  </div>
                </div>
                <div className="text-right font-mono-num shrink-0">
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {formatMoney(item.amount, currency)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {item.share.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Merchants */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Top Merchants & Payees
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Highest cumulative spend destinations in your ledger
            </p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {topMerchants.map((merchant, idx) => (
              <div
                key={merchant.title}
                className="py-3.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono-num text-xs font-bold text-slate-400 dark:text-slate-500 w-5">
                    0{idx + 1}.
                  </span>
                  <CategoryIcon category={merchant.category} size="sm" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {merchant.title}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {merchant.category} · {merchant.count}{' '}
                      {merchant.count === 1 ? 'visit' : 'visits'}
                    </div>
                  </div>
                </div>
                <div className="font-mono-num text-sm font-bold text-slate-900 dark:text-slate-100 shrink-0">
                  {formatMoney(merchant.amount, currency)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
