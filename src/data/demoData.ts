import { CategoryBudget, CurrencyConfig, ExpenseCategory, RecurringBill, Transaction } from '../types';

export const CURRENCIES: CurrencyConfig[] = [
  { code: 'PHP', symbol: '₱', label: 'Philippine Peso (₱)' },
  { code: 'USD', symbol: '$', label: 'US Dollar ($)' },
  { code: 'EUR', symbol: '€', label: 'Euro (€)' },
  { code: 'GBP', symbol: '£', label: 'British Pound (£)' },
  { code: 'CAD', symbol: 'CA$', label: 'Canadian Dollar (CA$)' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar (A$)' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen (¥)' },
];

export const EXPENSE_CATEGORIES: Exclude<ExpenseCategory, 'Income'>[] = [
  'Groceries',
  'Food & Dining',
  'Transport',
  'Housing & Bills',
  'Shopping',
  'Health & Wellness',
  'Entertainment',
  'Other',
];

export const CATEGORY_META: Record<
  ExpenseCategory,
  { colorHex: string; bgClass: string; textClass: string; barClass: string; shortLabel: string }
> = {
  Groceries: {
    colorHex: '#059669',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/60',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    barClass: 'bg-emerald-600 dark:bg-emerald-500',
    shortLabel: 'Groceries',
  },
  'Food & Dining': {
    colorHex: '#D97706',
    bgClass: 'bg-amber-50 dark:bg-amber-950/60',
    textClass: 'text-amber-700 dark:text-amber-300',
    barClass: 'bg-amber-500 dark:bg-amber-400',
    shortLabel: 'Dining',
  },
  Transport: {
    colorHex: '#0284C7',
    bgClass: 'bg-sky-50 dark:bg-sky-950/60',
    textClass: 'text-sky-700 dark:text-sky-300',
    barClass: 'bg-sky-600 dark:bg-sky-500',
    shortLabel: 'Transport',
  },
  'Housing & Bills': {
    colorHex: '#4F46E5',
    bgClass: 'bg-indigo-50 dark:bg-indigo-950/60',
    textClass: 'text-indigo-700 dark:text-indigo-300',
    barClass: 'bg-indigo-600 dark:bg-indigo-500',
    shortLabel: 'Housing',
  },
  Shopping: {
    colorHex: '#7C3AED',
    bgClass: 'bg-violet-50 dark:bg-violet-950/60',
    textClass: 'text-violet-700 dark:text-violet-300',
    barClass: 'bg-violet-600 dark:bg-violet-500',
    shortLabel: 'Shopping',
  },
  'Health & Wellness': {
    colorHex: '#0D9488',
    bgClass: 'bg-teal-50 dark:bg-teal-950/60',
    textClass: 'text-teal-700 dark:text-teal-300',
    barClass: 'bg-teal-600 dark:bg-teal-500',
    shortLabel: 'Health',
  },
  Entertainment: {
    colorHex: '#E11D48',
    bgClass: 'bg-rose-50 dark:bg-rose-950/60',
    textClass: 'text-rose-700 dark:text-rose-300',
    barClass: 'bg-rose-600 dark:bg-rose-500',
    shortLabel: 'Culture',
  },
  Income: {
    colorHex: '#16A34A',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/60',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    barClass: 'bg-emerald-600 dark:bg-emerald-500',
    shortLabel: 'Income',
  },
  Other: {
    colorHex: '#475569',
    bgClass: 'bg-slate-100 dark:bg-slate-800',
    textClass: 'text-slate-700 dark:text-slate-300',
    barClass: 'bg-slate-600 dark:bg-slate-400',
    shortLabel: 'Other',
  },
};

function offsetDays(daysDiff: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysDiff);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getInitialTransactions(): Transaction[] {
  return [
    {
      id: 'tx-101',
      title: 'Landers Superstore BGC',
      amount: 3420.0,
      type: 'expense',
      category: 'Groceries',
      date: offsetDays(0),
      paymentMethod: 'Card',
      notes: 'Weekly fresh produce, olive oil, coffee beans & pantry staples',
      receiptItems: [
        { name: 'Imported Fuji Apples (1kg)', price: 320.0 },
        { name: 'Extra Virgin Olive Oil 750ml', price: 890.0 },
        { name: 'Mt. Apo Arabica Whole Beans', price: 650.0 },
        { name: 'Artisan Sourdough Loaf', price: 295.0 },
        { name: 'Free-Range Eggs & Salad Greens', price: 1265.0 },
      ],
    },
    {
      id: 'tx-102',
      title: 'Yardstick Coffee Legazpi',
      amount: 340.0,
      type: 'expense',
      category: 'Food & Dining',
      date: offsetDays(0),
      paymentMethod: 'GCash',
      notes: 'Sea salt latte & kouign-amann before morning standup',
    },
    {
      id: 'tx-103',
      title: 'Beep Card & RFID Autosweep Reload',
      amount: 1000.0,
      type: 'expense',
      category: 'Transport',
      date: offsetDays(-1),
      paymentMethod: 'GCash',
      notes: 'Skyway toll & MRT commuter reload',
    },
    {
      id: 'tx-104',
      title: 'Manam Comfort Filipino Dinner',
      amount: 1860.0,
      type: 'expense',
      category: 'Food & Dining',
      date: offsetDays(-1),
      paymentMethod: 'Card',
      notes: 'Dinner with friends — house crispy sisig, sinigang & shakes',
    },
    {
      id: 'tx-105',
      title: 'Anytime Fitness Monthly Pass',
      amount: 2500.0,
      type: 'expense',
      category: 'Health & Wellness',
      date: offsetDays(-2),
      paymentMethod: 'Card',
      notes: 'Monthly gym & 24/7 studio membership',
      recurringId: 'rec-3',
    },
    {
      id: 'tx-106',
      title: 'Marketplace by Rustan’s',
      amount: 1945.5,
      type: 'expense',
      category: 'Groceries',
      date: offsetDays(-3),
      paymentMethod: 'Maya',
      notes: 'Greek yogurt, sparkling water, roasted almonds & fruit',
    },
    {
      id: 'tx-107',
      title: 'BPI Payroll Direct Deposit',
      amount: 68500.0,
      type: 'income',
      category: 'Income',
      date: offsetDays(-4),
      paymentMethod: 'Transfer',
      notes: 'Semi-monthly net salary deposit',
    },
    {
      id: 'tx-108',
      title: 'Uniqlo Glorietta Flagship',
      amount: 2490.0,
      type: 'expense',
      category: 'Shopping',
      date: offsetDays(-4),
      paymentMethod: 'Card',
      notes: 'AIRism oversized tees & linen blend trousers',
    },
    {
      id: 'tx-109',
      title: 'Meralco Electric Utility',
      amount: 4280.0,
      type: 'expense',
      category: 'Housing & Bills',
      date: offsetDays(-5),
      paymentMethod: 'GCash',
      notes: 'Monthly condo electricity statement',
      recurringId: 'rec-2',
    },
    {
      id: 'tx-110',
      title: 'GrabCar — NAIA Terminal 3',
      amount: 645.0,
      type: 'expense',
      category: 'Transport',
      date: offsetDays(-6),
      paymentMethod: 'GCash',
      notes: 'Airport transfer including Skyway toll',
    },
    {
      id: 'tx-111',
      title: 'Netflix & Spotify Duo Bundle',
      amount: 788.0,
      type: 'expense',
      category: 'Entertainment',
      date: offsetDays(-7),
      paymentMethod: 'Maya',
      notes: 'Monthly streaming & music subscriptions',
    },
    {
      id: 'tx-112',
      title: 'SaladStop! Ayala Triangle',
      amount: 495.0,
      type: 'expense',
      category: 'Food & Dining',
      date: offsetDays(-8),
      paymentMethod: 'GCash',
      notes: 'Hail Caesar wrap + infused water',
    },
    {
      id: 'tx-113',
      title: 'Salcedo Saturday Market',
      amount: 1150.0,
      type: 'expense',
      category: 'Groceries',
      date: offsetDays(-10),
      paymentMethod: 'Cash',
      notes: 'Fresh Bukidnon vegetables, local honey & artisan cheese',
    },
    {
      id: 'tx-114',
      title: 'UX Design Consulting Retainer',
      amount: 18000.0,
      type: 'income',
      category: 'Income',
      date: offsetDays(-11),
      paymentMethod: 'Transfer',
      notes: 'Mobile design system audit invoice #208',
    },
    {
      id: 'tx-115',
      title: 'Mercury Drug & Watsons',
      amount: 1320.0,
      type: 'expense',
      category: 'Health & Wellness',
      date: offsetDays(-12),
      paymentMethod: 'Maya',
      notes: 'Vitamins, sunscreen & daily essentials',
    },
  ];
}

export const INITIAL_BUDGETS: CategoryBudget[] = [
  { category: 'Groceries', monthlyLimit: 14000, alertThreshold: 0.8 },
  { category: 'Food & Dining', monthlyLimit: 8500, alertThreshold: 0.8 },
  { category: 'Housing & Bills', monthlyLimit: 12000, alertThreshold: 0.8 },
  { category: 'Transport', monthlyLimit: 4500, alertThreshold: 0.8 },
  { category: 'Shopping', monthlyLimit: 6000, alertThreshold: 0.8 },
  { category: 'Health & Wellness', monthlyLimit: 5000, alertThreshold: 0.8 },
  { category: 'Entertainment', monthlyLimit: 3000, alertThreshold: 0.8 },
  { category: 'Other', monthlyLimit: 3000, alertThreshold: 0.8 },
];

export function getInitialRecurringBills(): RecurringBill[] {
  return [
    {
      id: 'rec-1',
      title: 'Globe At Home GFiber 500Mbps',
      amount: 2099.0,
      category: 'Housing & Bills',
      frequency: 'monthly',
      nextDueDate: offsetDays(2),
      paymentMethod: 'GCash',
      autoPay: true,
      active: true,
    },
    {
      id: 'rec-2',
      title: 'Meralco Residential Power',
      amount: 4280.0,
      category: 'Housing & Bills',
      frequency: 'monthly',
      nextDueDate: offsetDays(5),
      paymentMethod: 'GCash',
      autoPay: true,
      active: true,
      lastPaidDate: offsetDays(-5),
    },
    {
      id: 'rec-3',
      title: 'Anytime Fitness Club Pass',
      amount: 2500.0,
      category: 'Health & Wellness',
      frequency: 'monthly',
      nextDueDate: offsetDays(9),
      paymentMethod: 'Card',
      autoPay: true,
      active: true,
      lastPaidDate: offsetDays(-2),
    },
    {
      id: 'rec-4',
      title: 'Netflix Premium UHD Plan',
      amount: 549.0,
      category: 'Entertainment',
      frequency: 'monthly',
      nextDueDate: offsetDays(4),
      paymentMethod: 'Maya',
      autoPay: true,
      active: true,
    },
    {
      id: 'rec-5',
      title: 'Apple iCloud+ 2TB Family',
      amount: 499.0,
      category: 'Housing & Bills',
      frequency: 'monthly',
      nextDueDate: offsetDays(12),
      paymentMethod: 'Apple Pay',
      autoPay: true,
      active: true,
    },
    {
      id: 'rec-6',
      title: 'Spotify Premium Duo PH',
      amount: 239.0,
      category: 'Entertainment',
      frequency: 'monthly',
      nextDueDate: offsetDays(15),
      paymentMethod: 'GCash',
      autoPay: true,
      active: true,
    },
  ];
}

export interface SampleReceiptPreset {
  id: string;
  label: string;
  merchant: string;
  summary: string;
  receiptTextHint: string;
}

export const SAMPLE_RECEIPT_PRESETS: SampleReceiptPreset[] = [
  {
    id: 'sample-grocery',
    label: 'The Marketplace Rockwell',
    merchant: 'The Marketplace',
    summary: 'Groceries · ₱1,845.00 · 4 items',
    receiptTextHint:
      'THE MARKETPLACE ROCKWELL MAKATI. Date: Today. Items: Norwegian Salmon Fillet ₱680.00, Oatside Barista Blend 2-Pack ₱310.00, French Brioche Loaf ₱245.00, Hass Avocados (Bag) ₱610.00. Total Paid: ₱1845.00 via GCash.',
  },
  {
    id: 'sample-dining',
    label: 'Single Origin BGC High Street',
    merchant: 'Single Origin BGC',
    summary: 'Food & Dining · ₱1,420.00 · 3 items',
    receiptTextHint:
      'SINGLE ORIGIN BONIFACIO HIGH STREET. Date: Today. Items: Truffle Mushroom Pasta ₱595.00, Angus Beef Burger ₱625.00, Iced Spanish Latte ₱200.00. Total Paid: ₱1420.00 via Visa Card.',
  },
  {
    id: 'sample-transit',
    label: 'GrabCar & Skyway Toll Receipt',
    merchant: 'Grab Philippines',
    summary: 'Transport · ₱485.00 · 2 items',
    receiptTextHint:
      'GRABCAR E-RECEIPT MANILA. Date: Today. Items: Makati to BGC Ride ₱400.00, Skyway Stage 3 Toll ₱85.00. Total Paid: ₱485.00 via GCash.',
  },
];
