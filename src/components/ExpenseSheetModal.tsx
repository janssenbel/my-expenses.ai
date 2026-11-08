import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  Delete,
  Check,
  Trash2,
  FileText,
  Sparkles,
  Upload,
  AlertCircle,
  Keyboard,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import {
  CurrencyConfig,
  ExpenseCategory,
  PaymentMethod,
  ReceiptLineItem,
  Transaction,
} from '../types';
import {
  EXPENSE_CATEGORIES,
  SAMPLE_RECEIPT_PRESETS,
  SampleReceiptPreset,
} from '../data/demoData';

interface ExpenseSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, 'id'>, existingId?: string) => void;
  onDelete?: (id: string) => void;
  editingTransaction: Transaction | null;
  currency: CurrencyConfig;
  initialMode?: 'choice' | 'manual' | 'scan';
  initialEntryType?: 'expense' | 'income';
}

const PAYMENT_METHODS: PaymentMethod[] = [
  'GCash',
  'Maya',
  'Apple Pay',
  'Card',
  'Cash',
  'Transfer',
];

export const ExpenseSheetModal: React.FC<ExpenseSheetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingTransaction,
  currency,
  initialMode = 'choice',
  initialEntryType = 'expense',
}) => {
  const [entryType, setEntryType] = useState<'expense' | 'income'>('expense');
  const [expenseMethod, setExpenseMethod] = useState<'choice' | 'manual' | 'scan'>('choice');
  const [amountStr, setAmountStr] = useState<string>('0');
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<ExpenseCategory>('Food & Dining');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('GCash');
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState<string>('');
  const [receiptItems, setReceiptItems] = useState<ReceiptLineItem[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Receipt AI scanning state
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanSuccessBanner, setScanSuccessBanner] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const quickPresetAmounts =
    currency.code === 'PHP'
      ? entryType === 'income'
        ? [5000, 15000, 25000, 50000]
        : [150, 350, 750, 1500, 3000]
      : entryType === 'income'
      ? [250, 500, 1500, 3000]
      : [8.5, 15, 35, 75, 120];

  useEffect(() => {
    if (!isOpen) return;
    setValidationError(null);
    setScanError(null);
    setScanSuccessBanner(null);

    if (editingTransaction) {
      setEntryType(editingTransaction.type);
      setAmountStr(String(editingTransaction.amount));
      setTitle(editingTransaction.title);
      setCategory(editingTransaction.category);
      setPaymentMethod(editingTransaction.paymentMethod);
      setDate(editingTransaction.date);
      setNotes(editingTransaction.notes ?? '');
      setReceiptItems(editingTransaction.receiptItems ?? []);
      setExpenseMethod('manual');
    } else {
      setEntryType(initialEntryType);
      setAmountStr('0');
      setTitle('');
      setCategory(initialEntryType === 'income' ? 'Income' : 'Food & Dining');
      setPaymentMethod(
        initialEntryType === 'income'
          ? 'Transfer'
          : currency.code === 'PHP'
          ? 'GCash'
          : 'Apple Pay'
      );
      setDate(new Date().toISOString().slice(0, 10));
      setNotes('');
      setReceiptItems([]);
      setExpenseMethod(initialEntryType === 'income' ? 'manual' : initialMode);
    }
  }, [isOpen, editingTransaction, initialMode, initialEntryType, currency.code]);

  if (!isOpen) return null;

  const handleKeypadPress = (key: string) => {
    setValidationError(null);
    if (key === 'BACK') {
      setAmountStr((prev) => (prev.length <= 1 ? '0' : prev.slice(0, -1)));
      return;
    }
    if (key === 'CLEAR') {
      setAmountStr('0');
      return;
    }
    if (key === '.') {
      if (amountStr.includes('.')) return;
      setAmountStr((prev) => `${prev}.`);
      return;
    }
    const dotIndex = amountStr.indexOf('.');
    if (dotIndex !== -1 && amountStr.length - dotIndex > 2) {
      return;
    }
    if (amountStr === '0') {
      setAmountStr(key);
    } else if (amountStr.length < 9) {
      setAmountStr((prev) => prev + key);
    }
  };

  const handleQuickAmount = (val: number) => {
    setValidationError(null);
    setAmountStr(String(val));
  };

  const applyScannedReceipt = (scanned: {
    merchant?: string;
    amount?: number;
    date?: string;
    category?: string;
    paymentMethod?: string;
    notes?: string;
    items?: ReceiptLineItem[];
  }) => {
    setEntryType('expense');
    if (scanned.merchant) setTitle(scanned.merchant);
    if (typeof scanned.amount === 'number' && scanned.amount > 0) {
      setAmountStr(scanned.amount.toFixed(2).replace(/\.00$/, ''));
    }
    if (scanned.date && /^\d{4}-\d{2}-\d{2}$/.test(scanned.date)) {
      setDate(scanned.date);
    }
    if (
      scanned.category &&
      EXPENSE_CATEGORIES.includes(scanned.category as Exclude<ExpenseCategory, 'Income'>)
    ) {
      setCategory(scanned.category as ExpenseCategory);
    }
    if (
      scanned.paymentMethod &&
      PAYMENT_METHODS.includes(scanned.paymentMethod as PaymentMethod)
    ) {
      setPaymentMethod(scanned.paymentMethod as PaymentMethod);
    }
    if (scanned.notes) {
      setNotes(scanned.notes);
    }
    if (Array.isArray(scanned.items)) {
      setReceiptItems(scanned.items);
    }
    setExpenseMethod('manual');
    setScanSuccessBanner(
      `Extracted ${scanned.merchant || 'Receipt'} (${currency.symbol}${(scanned.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setScanError(null);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Failed to read image file.'));
        reader.readAsDataURL(file);
      });

      const response = await fetch('/api/receipts/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: file.type || 'image/jpeg',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Receipt extraction failed.');
      }

      applyScannedReceipt(data.receipt);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to scan receipt photo.';
      setScanError(msg);
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePresetReceiptScan = async (preset: SampleReceiptPreset) => {
    setIsScanning(true);
    setScanError(null);

    try {
      const response = await fetch('/api/receipts/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiptTextHint: preset.receiptTextHint,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Sample receipt extraction failed.');
      }

      applyScannedReceipt(data.receipt);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to parse receipt.';
      setScanError(msg);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amountStr);
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      setValidationError('Enter an amount greater than zero.');
      return;
    }

    const cleanTitle = title.trim() || (entryType === 'income' ? 'Income Deposit' : category);

    onSave(
      {
        title: cleanTitle,
        amount: Math.round(numericAmount * 100) / 100,
        type: entryType,
        category: entryType === 'income' ? 'Income' : category,
        date,
        paymentMethod,
        notes: notes.trim() || undefined,
        receiptItems: receiptItems.length > 0 ? receiptItems : undefined,
      },
      editingTransaction?.id
    );
    onClose();
  };

  const isChoiceScreen = !editingTransaction && entryType === 'expense' && expenseMethod === 'choice';
  const showScannerPanel = entryType === 'expense' && expenseMethod === 'scan';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-label={editingTransaction ? 'Edit Transaction' : 'Record Expense'}
    >
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[92dvh] flex flex-col overflow-hidden pb-safe-sheet">
        {/* Grab Handle for iPhone Ergonomics */}
        <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-1 sm:hidden" />

        {/* Sheet Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {!editingTransaction && entryType === 'expense' && expenseMethod !== 'choice' && (
              <button
                type="button"
                onClick={() => setExpenseMethod('choice')}
                aria-label="Back to Record Expense options"
                className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Options</span>
              </button>
            )}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setEntryType('expense');
                  if (category === 'Income') setCategory('Food & Dining');
                }}
                className={`min-h-[38px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  entryType === 'expense'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                Record Expense
              </button>
              <button
                type="button"
                onClick={() => {
                  setEntryType('income');
                  setCategory('Income');
                  setExpenseMethod('manual');
                }}
                className={`min-h-[38px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  entryType === 'income'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                Income
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {entryType === 'expense' && !isChoiceScreen && (
              <button
                type="button"
                onClick={() =>
                  setExpenseMethod((prev) => (prev === 'scan' ? 'manual' : 'scan'))
                }
                className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                  showScannerPanel
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/70'
                }`}
              >
                {showScannerPanel ? (
                  <>
                    <Keyboard size={14} />
                    <span>Manual Input</span>
                  </>
                ) : (
                  <>
                    <Camera size={14} />
                    <span>Scan Receipt</span>
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="min-h-[44px] min-w-[44px] rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Choice View vs. Scrollable Sheet Body */}
        {isChoiceScreen ? (
          <div className="px-5 py-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Record Expense
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Choose how you would like to record your expense:
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => setExpenseMethod('scan')}
                className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 text-left flex items-center justify-between gap-4 transition-all group"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Camera size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                      Scan a Receipt
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Take a photo or upload an image of your receipt to extract amount, merchant, and items automatically.
                    </p>
                  </div>
                </div>
                <ChevronRight
                  size={18}
                  className="text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 shrink-0 transition-colors"
                />
              </button>

              <button
                type="button"
                onClick={() => setExpenseMethod('manual')}
                className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 text-left flex items-center justify-between gap-4 transition-all group"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                    <Keyboard size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                      Manually Input Data
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Enter the Peso ({currency.symbol}) amount using the keypad and select the merchant, category, and payment method.
                    </p>
                  </div>
                </div>
                <ChevronRight
                  size={18}
                  className="text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 shrink-0 transition-colors"
                />
              </button>
            </div>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="overflow-y-auto px-5 py-4 space-y-4 flex-1 no-scrollbar">
          {scanSuccessBanner && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-200">
              <div className="flex items-center gap-2 font-medium">
                <Sparkles size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{scanSuccessBanner}</span>
              </div>
              <button
                type="button"
                onClick={() => setScanSuccessBanner(null)}
                className="text-emerald-700 dark:text-emerald-300 hover:underline font-semibold ml-2"
              >
                Dismiss
              </button>
            </div>
          )}

          {showScannerPanel ? (
            <div className="space-y-4 py-1">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Receipt Photo Extraction
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Snap a receipt with your iPhone camera or choose from Photos, or test immediately with a sample Philippine receipt below.
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  disabled={isScanning}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full min-h-[52px] rounded-xl border-2 border-dashed border-emerald-400 dark:border-emerald-700 bg-white dark:bg-slate-900 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Upload size={18} className="text-emerald-600 dark:text-emerald-400" />
                  <span>{isScanning ? 'Extracting Receipt Details...' : 'Take Photo or Upload Receipt'}</span>
                </button>

                {isScanning && (
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2.5 animate-pulse">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
                  </div>
                )}

                {scanError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span>{scanError}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                    Or try instant extraction with a sample receipt:
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {SAMPLE_RECEIPT_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        disabled={isScanning}
                        onClick={() => handlePresetReceiptScan(preset)}
                        className="min-h-[48px] px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 text-left flex items-center justify-between transition-colors disabled:opacity-50"
                      >
                        <div>
                          <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            {preset.label}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {preset.summary}
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap shrink-0">
                          Scan Sample →
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Big Tabular Amount Display + Quick Amounts */}
              <div className="text-center py-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 px-4">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {entryType === 'income' ? 'Income Amount' : 'Expense Amount'} ({currency.code})
                </div>
                <div className="mt-1 flex items-baseline justify-center gap-1 font-mono-num">
                  <span className="text-2xl font-semibold text-slate-400 dark:text-slate-500">
                    {currency.symbol}
                  </span>
                  <span
                    className={`text-4xl font-bold tracking-tight ${
                      entryType === 'income'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {amountStr}
                  </span>
                </div>
                {validationError && (
                  <p className="text-xs font-medium text-rose-600 dark:text-rose-400 mt-1">
                    {validationError}
                  </p>
                )}
                <div className="flex items-center justify-center gap-1.5 mt-2.5 flex-wrap">
                  {quickPresetAmounts.map((presetVal) => (
                    <button
                      key={presetVal}
                      type="button"
                      onClick={() => handleQuickAmount(presetVal)}
                      className="min-h-[36px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono-num font-medium text-slate-700 dark:text-slate-300 hover:border-emerald-500 dark:hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                    >
                      {currency.symbol}
                      {presetVal.toLocaleString('en-US')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tactile Numeric Keypad */}
              <div className="grid grid-cols-3 gap-2" aria-label="Numeric keypad">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'BACK'].map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleKeypadPress(key)}
                    className="min-h-[48px] rounded-xl bg-slate-100/90 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 active:scale-[0.98] text-slate-900 dark:text-slate-100 font-mono-num text-lg font-semibold flex items-center justify-center transition-all select-none"
                  >
                    {key === 'BACK' ? (
                      <Delete size={20} className="text-slate-600 dark:text-slate-300" />
                    ) : (
                      key
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Merchant / Description & Date (text-base on mobile prevents iPhone Safari zoom) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {entryType === 'income' ? 'Source / Description' : 'Merchant or Description'}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  entryType === 'income' ? 'e.g. Payroll or Client Invoice' : 'e.g. Landers or GrabCar'
                }
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-base sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-base sm:text-sm font-mono-num text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Category Grid (Only for Expenses) */}
          {entryType === 'expense' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {EXPENSE_CATEGORIES.map((cat) => {
                  const selected = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors border truncate ${
                        selected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payment Method & Optional Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`min-h-[44px] px-2 py-2 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
                      paymentMethod === method
                        ? 'bg-slate-900 dark:bg-emerald-600 text-white border-slate-900 dark:border-emerald-600'
                        : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add memo or split details..."
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-base sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Extracted Receipt Line Items Preview */}
          {receiptItems.length > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <FileText size={14} className="text-emerald-600 dark:text-emerald-400" />
                  Receipt Line Items ({receiptItems.length})
                </span>
                <button
                  type="button"
                  onClick={() => setReceiptItems([])}
                  className="text-slate-500 dark:text-slate-400 hover:text-rose-600"
                >
                  Clear items
                </button>
              </div>
              <div className="divide-y divide-slate-200/70 dark:divide-slate-700/70">
                {receiptItems.map((item, idx) => (
                  <div key={idx} className="py-1.5 flex items-center justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-300">{item.name}</span>
                    <span className="font-mono-num font-medium text-slate-900 dark:text-slate-100">
                      {currency.symbol}
                      {item.price.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-2 flex items-center gap-2.5">
            {editingTransaction && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete(editingTransaction.id);
                  onClose();
                }}
                className="min-h-[48px] px-4 rounded-xl border border-rose-200 dark:border-rose-900/80 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
              >
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
            )}
            <button
              type="submit"
              className="flex-1 min-h-[48px] rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all whitespace-nowrap shrink-0"
            >
              <Check size={18} />
              <span>
                {editingTransaction
                  ? 'Save Changes'
                  : `Save ${entryType === 'income' ? 'Income' : 'Expense'}`}
              </span>
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};
