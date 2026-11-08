export type ExpenseCategory =
  | 'Groceries'
  | 'Food & Dining'
  | 'Transport'
  | 'Housing & Bills'
  | 'Shopping'
  | 'Health & Wellness'
  | 'Entertainment'
  | 'Income'
  | 'Other';

export type PaymentMethod = 'GCash' | 'Maya' | 'Apple Pay' | 'Card' | 'Cash' | 'Transfer';

export interface ReceiptLineItem {
  name: string;
  price: number;
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'expense' | 'income';
  category: ExpenseCategory;
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  notes?: string;
  receiptItems?: ReceiptLineItem[];
  recurringId?: string;
}

export interface CategoryBudget {
  category: Exclude<ExpenseCategory, 'Income'>;
  monthlyLimit: number;
  alertThreshold: number; // e.g. 0.8 for 80%
}

export interface RecurringBill {
  id: string;
  title: string;
  amount: number;
  category: Exclude<ExpenseCategory, 'Income'>;
  frequency: 'monthly' | 'weekly' | 'yearly';
  nextDueDate: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  autoPay: boolean;
  active: boolean;
  lastPaidDate?: string;
}

export type ActiveTab = 'overview' | 'income' | 'budgets' | 'analytics' | 'recurring' | 'data';

export interface CurrencyConfig {
  code: 'PHP' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD';
  symbol: string;
  label: string;
}
