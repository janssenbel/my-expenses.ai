import React, { useRef, useState } from 'react';
import {
  Download,
  Upload,
  RotateCcw,
  Trash2,
  CheckCircle2,
  FileSpreadsheet,
  Smartphone,
  Moon,
  Sun,
  Share,
  PlusSquare,
  Edit3,
  Check,
  FileJson,
  AlertCircle,
} from 'lucide-react';
import { CategoryBudget, CurrencyConfig, RecurringBill, Transaction } from '../types';
import { CURRENCIES } from '../data/demoData';
import {
  generateLedgerBackupJSON,
  generateTransactionsCSV,
  LedgerBackupPayload,
  parseLedgerBackupJSON,
  parseTransactionsCSV,
} from '../utils/formatters';

interface DataPortabilityViewProps {
  ledgerName: string;
  onUpdateLedgerName: (name: string) => void;
  showCategorySpending: boolean;
  onToggleCategorySpending: () => void;
  transactions: Transaction[];
  budgets: CategoryBudget[];
  recurringBills: RecurringBill[];
  currency: CurrencyConfig;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onSelectCurrency: (c: CurrencyConfig) => void;
  onImportTransactions: (imported: Transaction[]) => void;
  onRestoreBackup: (backup: LedgerBackupPayload) => void;
  onRestoreDemoData: () => void;
  onClearAllData: () => void;
}

export const DataPortabilityView: React.FC<DataPortabilityViewProps> = ({
  ledgerName,
  onUpdateLedgerName,
  showCategorySpending,
  onToggleCategorySpending,
  transactions,
  budgets,
  recurringBills,
  currency,
  isDarkMode,
  onToggleDarkMode,
  onSelectCurrency,
  onImportTransactions,
  onRestoreBackup,
  onRestoreDemoData,
  onClearAllData,
}) => {
  const csvInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [draftName, setDraftName] = useState(ledgerName);

  const getSlug = () =>
    ledgerName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'ledger';

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = draftName.trim();
    if (!trimmed) return;
    onUpdateLedgerName(trimmed);
    setErrorNotice(null);
    setStatusNotice(`Ledger name updated to "${trimmed}".`);
  };

  const handleDownloadJSONBackup = () => {
    const jsonString = generateLedgerBackupJSON({
      ledgerName,
      currency,
      transactions,
      budgets,
      recurringBills,
    });
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `${getSlug()}-backup-${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setErrorNotice(null);
    setStatusNotice(
      `Downloaded full JSON backup (${transactions.length} transactions, ${budgets.length} budgets, ${recurringBills.length} recurring bills).`
    );
  };

  const handleJSONRestoreUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorNotice(null);
    try {
      const text = await file.text();
      const backup = parseLedgerBackupJSON(text);
      onRestoreBackup(backup);
      setDraftName(backup.ledgerName);
      setStatusNotice(
        `Restored backup "${backup.ledgerName}" (${backup.transactions.length} transactions, ${backup.budgets.length} budgets, ${backup.recurringBills.length} bills).`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to parse JSON backup file.';
      setErrorNotice(msg);
    } finally {
      if (jsonInputRef.current) jsonInputRef.current.value = '';
    }
  };

  const handleDownloadCSV = () => {
    const csv = generateTransactionsCSV(transactions);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${getSlug()}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setErrorNotice(null);
    setStatusNotice(`Exported ${transactions.length} transactions to CSV.`);
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorNotice(null);
    const text = await file.text();
    const parsed = parseTransactionsCSV(text);
    if (parsed.length > 0) {
      onImportTransactions(parsed);
      setStatusNotice(`Imported ${parsed.length} transactions from ${file.name}.`);
    } else {
      setErrorNotice('No valid transaction rows found in the selected CSV file.');
    }
    if (csvInputRef.current) csvInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {statusNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{statusNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusNotice(null)}
            className="font-semibold text-emerald-800 dark:text-emerald-300 hover:underline ml-3 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorNotice && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 flex items-center justify-between text-xs text-rose-900 dark:text-rose-200">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle size={16} className="text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{errorNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorNotice(null)}
            className="font-semibold text-rose-800 dark:text-rose-300 hover:underline ml-3 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Full JSON Backup & Restore Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              JSON Backup & Restore
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Save a complete snapshot of your ledger (name, currency, transactions, category budgets, and recurring bills) as a JSON file, or restore from an existing backup.
            </p>
          </div>
          <FileJson size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={handleDownloadJSONBackup}
            className="min-h-[48px] px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
          >
            <Download size={16} />
            <span>Backup to JSON File</span>
          </button>

          <input
            ref={jsonInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleJSONRestoreUpload}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => jsonInputRef.current?.click()}
            className="min-h-[48px] px-4 py-3 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white dark:text-slate-100 text-xs font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
          >
            <Upload size={16} />
            <span>Restore from JSON Backup</span>
          </button>
        </div>
      </div>

      {/* Custom Ledger Name Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Ledger Name
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Customize the title shown in the top navigation bar and exported backup files.
            </p>
          </div>
          <Edit3 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
        </div>

        <form onSubmit={handleSaveName} className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            maxLength={36}
            placeholder="e.g. My Expenses, Household Budget, Janssen's Ledger"
            className="flex-1 min-h-[46px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-base sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-600"
          />
          <button
            type="submit"
            className="min-h-[46px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
          >
            <Check size={16} />
            <span>Save Ledger Name</span>
          </button>
        </form>
      </div>

      {/* Category Spending Visibility Option */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Category Spending & Budgets
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {showCategorySpending
              ? 'Category Spending widgets and the Budgets tab are currently visible.'
              : 'Category Spending has been removed from your views for a cleaner ledger.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            onToggleCategorySpending();
            setStatusNotice(
              showCategorySpending
                ? 'Removed Category Spending from your workspace.'
                : 'Restored Category Spending and Budgets tab.'
            );
          }}
          className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
            showCategorySpending
              ? 'border border-rose-200 dark:border-rose-900/70 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {showCategorySpending ? 'Remove Category Spending' : 'Show Category Spending'}
        </button>
      </div>

      {/* iPhone Home Screen Installation & Appearance Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                iPhone & iOS Home Screen Setup
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Features a custom emerald Ledger Book Home Screen icon, Dynamic Island safe areas, and standalone launch.
              </p>
            </div>
            <Smartphone size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2.5">
              <Share size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                1. In iPhone Safari, tap the <strong>Share</strong> icon in the bottom bar.
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <PlusSquare size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                2. Select <strong>Add to Home Screen</strong> to add the Ledger Book icon and launch {ledgerName} full-screen.
              </span>
            </div>
          </div>
        </div>

        {/* Appearance / Dark Mode Toggle Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 flex flex-col justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Appearance & Theme
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Switch between Clean Fintech Light for daylight legibility and OLED-friendly Dark Mode for night use on iPhone.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                if (isDarkMode) onToggleDarkMode();
              }}
              className={`min-h-[48px] px-4 py-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                !isDarkMode
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Sun size={16} />
              <span>Light Mode</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!isDarkMode) onToggleDarkMode();
              }}
              className={`min-h-[48px] px-4 py-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                isDarkMode
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Moon size={16} />
              <span>Dark Mode</span>
            </button>
          </div>
        </div>
      </div>

      {/* Display Currency Preference */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Display Currency
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Defaulting to Philippine Peso (₱). Choose the primary currency symbol used across your ledger and budget gauges.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {CURRENCIES.map((c) => {
            const active = c.code === currency.code;
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  onSelectCurrency(c);
                  setStatusNotice(`Display currency updated to ${c.label}.`);
                }}
                className={`min-h-[48px] px-3.5 py-2.5 rounded-xl border text-left transition-colors ${
                  active
                    ? 'bg-slate-900 dark:bg-emerald-600 text-white border-slate-900 dark:border-emerald-600'
                    : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="text-xs font-bold font-mono-num">
                  {c.code} ({c.symbol})
                </div>
                <div
                  className={`text-[11px] truncate ${
                    active ? 'text-slate-200 dark:text-emerald-100' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {c.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* CSV Export & Import Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Spreadsheet & CSV Portability
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Export your transaction rows to Excel, Google Sheets, or Apple Numbers, or import a CSV statement.
            </p>
          </div>
          <FileSpreadsheet size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={handleDownloadCSV}
            className="min-h-[48px] px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
          >
            <Download size={16} />
            <span>Download Ledger CSV ({transactions.length} rows)</span>
          </button>

          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleCSVUpload}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => csvInputRef.current?.click()}
            className="min-h-[48px] px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
          >
            <Upload size={16} />
            <span>Import Transactions from CSV</span>
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 text-xs text-slate-600 dark:text-slate-400 font-mono-num">
          CSV Columns: Date (YYYY-MM-DD), Merchant / Title, Type (expense|income), Category, Amount, Payment Method, Notes
        </div>
      </div>

      {/* Local Storage & Demo Data Management */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Local Device Storage
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Your ledger starts clean with zero transactions by default. You can clear all transactions or load sample demo data anytime.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!confirmClear ? (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="min-h-[44px] px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/80 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <Trash2 size={15} />
              <span>Clear All Transactions</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClearAllData();
                  setConfirmClear(false);
                  setStatusNotice('Cleared all transactions. Ready for your personal entries.');
                }}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                Confirm Clear Ledger
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="min-h-[44px] px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold whitespace-nowrap shrink-0"
              >
                Cancel
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              onRestoreDemoData();
              setConfirmClear(false);
              setStatusNotice('Loaded Philippine Peso (₱) sample transactions, budgets, and bills.');
            }}
            className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
          >
            <RotateCcw size={15} />
            <span>Load Sample Demo Data (₱)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
