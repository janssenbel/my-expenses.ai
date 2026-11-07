import {
  CategoryBudget,
  CurrencyConfig,
  ExpenseCategory,
  PaymentMethod,
  RecurringBill,
  Transaction,
} from '../types';
import { CURRENCIES, EXPENSE_CATEGORIES, INITIAL_BUDGETS } from '../data/demoData';

export function formatMoney(amount: number, currency: CurrencyConfig, showSign = false): string {
  const isZeroDecimal = currency.code === 'JPY';
  const absVal = Math.abs(amount);
  const formatted = absVal.toLocaleString('en-US', {
    minimumFractionDigits: isZeroDecimal ? 0 : 2,
    maximumFractionDigits: isZeroDecimal ? 0 : 2,
  });

  if (showSign) {
    const sign = amount > 0 ? '+' : amount < 0 ? '−' : '';
    return `${sign}${currency.symbol}${formatted}`;
  }
  return `${currency.symbol}${formatted}`;
}

export function formatShortDate(isoDate: string): string {
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3) return isoDate;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.getTime() === today.getTime()) return 'Today';
  if (d.getTime() === yesterday.getTime()) return 'Yesterday';

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function getRecentDaysStrip(daysCount = 10): Array<{
  iso: string;
  dayName: string;
  dayNum: string;
  isToday: boolean;
}> {
  const result = [];
  const today = new Date();
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const iso = `${year}-${month}-${day}`;
    result.push({
      iso,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3),
      dayNum: String(d.getDate()).padStart(2, '0'),
      isToday: i === 0,
    });
  }
  return result;
}

export function generateTransactionsCSV(transactions: Transaction[]): string {
  const headers = ['Date', 'Merchant / Title', 'Type', 'Category', 'Amount', 'Payment Method', 'Notes'];
  const escapeCSV = (val: string | number | undefined) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = transactions.map((tx) => [
    escapeCSV(tx.date),
    escapeCSV(tx.title),
    escapeCSV(tx.type),
    escapeCSV(tx.category),
    escapeCSV(tx.amount.toFixed(2)),
    escapeCSV(tx.paymentMethod),
    escapeCSV(tx.notes ?? ''),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function parseTransactionsCSV(csvText: string): Transaction[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const splitCSVRow = (row: string): string[] => {
    const out: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (ch === '"') {
        if (inQuotes && row[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        out.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    out.push(cur.trim());
    return out;
  };

  const validCategories: ExpenseCategory[] = [...EXPENSE_CATEGORIES, 'Income'];
  const validMethods: PaymentMethod[] = ['GCash', 'Maya', 'Apple Pay', 'Card', 'Cash', 'Transfer'];

  const imported: Transaction[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSVRow(lines[i]);
    if (cols.length < 5) continue;

    const rawDate = cols[0] || new Date().toISOString().slice(0, 10);
    const title = cols[1] || 'Imported Entry';
    const rawType = (cols[2] || 'expense').toLowerCase();
    const type: 'expense' | 'income' = rawType === 'income' ? 'income' : 'expense';

    const rawCat = cols[3] as ExpenseCategory;
    const category: ExpenseCategory = validCategories.includes(rawCat)
      ? rawCat
      : type === 'income'
      ? 'Income'
      : 'Other';

    const amount = Math.abs(parseFloat(cols[4].replace(/[^0-9.-]/g, '')));
    if (Number.isNaN(amount) || amount <= 0) continue;

    const rawMethod = cols[5] as PaymentMethod;
    const paymentMethod: PaymentMethod = validMethods.includes(rawMethod) ? rawMethod : 'Card';
    const notes = cols[6] || '';

    imported.push({
      id: `csv-${Date.now()}-${i}`,
      date: /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : new Date().toISOString().slice(0, 10),
      title,
      type,
      category,
      amount,
      paymentMethod,
      notes,
    });
  }

  return imported;
}

export interface LedgerBackupPayload {
  version: number;
  exportedAt: string;
  ledgerName: string;
  currency: CurrencyConfig;
  transactions: Transaction[];
  budgets: CategoryBudget[];
  recurringBills: RecurringBill[];
}

export function generateLedgerBackupJSON(payload: Omit<LedgerBackupPayload, 'version' | 'exportedAt'>): string {
  const backup: LedgerBackupPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    ...payload,
  };
  return JSON.stringify(backup, null, 2);
}

export function parseLedgerBackupJSON(jsonText: string): LedgerBackupPayload {
  const raw = JSON.parse(jsonText);
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid JSON backup file.');
  }

  // Support either full backup object or raw array of transactions
  if (Array.isArray(raw)) {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      ledgerName: 'Verdant Ledger',
      currency: CURRENCIES[0],
      transactions: raw as Transaction[],
      budgets: INITIAL_BUDGETS,
      recurringBills: [],
    };
  }

  if (!Array.isArray(raw.transactions)) {
    throw new Error('Backup JSON does not contain a valid transactions array.');
  }

  const matchedCurrency =
    CURRENCIES.find((c) => c.code === raw.currency?.code) ?? CURRENCIES[0];

  return {
    version: Number(raw.version) || 1,
    exportedAt: String(raw.exportedAt || new Date().toISOString()),
    ledgerName:
      typeof raw.ledgerName === 'string' && raw.ledgerName.trim()
        ? raw.ledgerName.trim()
        : 'Verdant Ledger',
    currency: matchedCurrency,
    transactions: raw.transactions as Transaction[],
    budgets:
      Array.isArray(raw.budgets) && raw.budgets.length > 0
        ? (raw.budgets as CategoryBudget[])
        : INITIAL_BUDGETS,
    recurringBills: Array.isArray(raw.recurringBills)
      ? (raw.recurringBills as RecurringBill[])
      : [],
  };
}
