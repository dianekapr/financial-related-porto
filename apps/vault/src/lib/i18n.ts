export type Locale = 'id' | 'en'

export const LOCALE_COOKIE = 'vault-locale'
export const DEFAULT_LOCALE: Locale = 'id'

export const LOCALES: { id: Locale; label: string }[] = [
  { id: 'id', label: 'Bahasa Indonesia' },
  { id: 'en', label: 'English' },
]

const dict = {
  nav: { id: 'Dashboard', en: 'Dashboard' },
  navHome: { id: 'Home', en: 'Home' },
  navTransactions: { id: 'Transaksi', en: 'Transactions' },
  navWallets: { id: 'Wallet', en: 'Wallets' },
  navBudget: { id: 'Budget', en: 'Budget' },
  navAnalytics: { id: 'Analitik', en: 'Analytics' },
  navSettings: { id: 'Pengaturan', en: 'Settings' },
  logout: { id: 'Keluar', en: 'Sign out' },

  loginSubtitle: { id: 'Kelola keuanganmu dengan gaya', en: 'Manage your money in style' },
  loginTitle: { id: 'Masuk ke akun', en: 'Sign in to your account' },
  loginConnecting: { id: 'Menghubungkan...', en: 'Connecting...' },
  loginContinueGoogle: { id: 'Lanjutkan dengan Google', en: 'Continue with Google' },
  loginTermsPrefix: { id: 'Dengan masuk, kamu setuju dengan', en: 'By signing in, you agree to the' },
  loginTerms: { id: 'Syarat & Ketentuan', en: 'Terms & Conditions' },
  loginFeatureTrack: { id: 'Track pengeluaran', en: 'Track spending' },
  loginFeatureBudget: { id: 'Budget per kategori', en: 'Budget per category' },
  loginFeatureAnalysis: { id: 'Analisis bulanan', en: 'Monthly analysis' },

  dashboardSummary: { id: 'RINGKASAN', en: 'SUMMARY' },
  dashboardBalance: { id: 'saldo bulan ini', en: 'balance this month' },

  summaryTotalIncome: { id: 'Total Pemasukan', en: 'Total Income' },
  summaryTotalExpense: { id: 'Total Pengeluaran', en: 'Total Expense' },
  summarySavingRate: { id: 'Saving Rate', en: 'Saving Rate' },
  summaryTransactions: { id: 'Transaksi', en: 'Transactions' },

  tickerTitle: { id: 'TRANSAKSI', en: 'TRANSACTIONS' },
  tickerAdd: { id: '+ Tambah', en: '+ Add' },
  tickerSeeAll: { id: 'Semua →', en: 'All →' },
  tickerEmpty: { id: 'Belum ada transaksi bulan ini', en: 'No transactions this month yet' },
  tickerAddFirst: { id: 'Tambah pertama kali', en: 'Add your first one' },
  fallbackTxName: { id: 'Transaksi', en: 'Transaction' },

  budgetGaugeTitle: { id: 'BUDGET', en: 'BUDGET' },
  budgetGaugeEmpty1: { id: 'Belum ada budget.', en: 'No budget set yet.' },
  budgetGaugeEmpty2: { id: 'Set budget di halaman Budget.', en: 'Set a budget on the Budget page.' },

  monthlyChartTitle: { id: '6 BULAN TERAKHIR', en: 'LAST 6 MONTHS' },
  in: { id: 'Masuk', en: 'In' },
  out: { id: 'Keluar', en: 'Out' },
  million: { id: 'jt', en: 'M' },
  thousand: { id: 'rb', en: 'K' },

  transactionsBreadcrumb: { id: 'Riwayat', en: 'History' },
  transactionsTitle: { id: 'TRANSAKSI', en: 'TRANSACTIONS' },
  incomeToggle: { id: '↑ Pemasukan', en: '↑ Income' },
  expenseToggle: { id: '↓ Pengeluaran', en: '↓ Expense' },
  all: { id: 'Semua', en: 'All' },
  balance: { id: 'Saldo', en: 'Balance' },
  noTransactions: { id: 'Tidak ada transaksi', en: 'No transactions' },
  confirmDeleteTx: { id: 'Hapus transaksi ini?', en: 'Delete this transaction?' },

  budgetBreadcrumb: { id: 'Pengelolaan', en: 'Management' },
  budgetTitle: { id: 'BUDGET', en: 'BUDGET' },
  budgetTotalThisMonth: { id: 'Total Budget Bulan Ini', en: 'Total Budget This Month' },
  budgetUsed: { id: 'Terpakai', en: 'Used' },
  budgetRemaining: { id: 'Sisa', en: 'Remaining' },
  budgetNotSet: { id: 'Belum di-set', en: 'Not set' },
  budgetSetBtn: { id: '+ Set', en: '+ Set' },
  budgetEdit: { id: 'Edit', en: 'Edit' },
  budgetAmountPlaceholder: { id: 'Jumlah budget...', en: 'Budget amount...' },
  ok: { id: 'OK', en: 'OK' },
  cancel: { id: 'Batal', en: 'Cancel' },
  budgetOver: { id: '⚠ Over budget!', en: '⚠ Over budget!' },
  budgetAlmostOut: { id: '⚠ Hampir habis', en: '⚠ Almost gone' },

  walletsTitle: { id: 'WALLET', en: 'WALLETS' },
  walletsTotalBalance: { id: 'Total Saldo Semua Wallet', en: 'Total Balance — All Wallets' },
  walletBalancePlaceholder: { id: 'Saldo baru...', en: 'New balance...' },
  walletAddBtn: { id: '+ Tambah Wallet', en: '+ Add Wallet' },
  walletNewTitle: { id: 'Wallet Baru', en: 'New Wallet' },
  walletNamePlaceholder: { id: 'Nama wallet (Cash, GoPay, BCA...)', en: 'Wallet name (Cash, GoPay, Bank...)' },
  walletInitialBalancePlaceholder: { id: 'Saldo awal (opsional)', en: 'Starting balance (optional)' },
  walletSaveBtn: { id: 'Simpan Wallet', en: 'Save Wallet' },
  saving: { id: 'Menyimpan...', en: 'Saving...' },
  confirmDeleteWallet: {
    id: 'Hapus wallet ini? Transaksi yang terkait tetap ada, tapi ga lagi terhubung ke wallet manapun.',
    en: 'Delete this wallet? Related transactions stay, but will no longer be linked to any wallet.',
  },
  walletBackLink: { id: '← Wallet', en: '← Wallets' },
  walletEmptyTransactions: { id: 'Belum ada transaksi di wallet ini', en: 'No transactions in this wallet yet' },
  walletOptional: { id: 'Wallet (opsional)', en: 'Wallet (optional)' },

  analyticsBreadcrumb: { id: 'Laporan', en: 'Report' },
  analyticsTitle: { id: 'ANALITIK', en: 'ANALYTICS' },
  analyticsCategory: { id: 'KATEGORI', en: 'CATEGORY' },
  analyticsTopSpending: { id: 'TOP PENGELUARAN', en: 'TOP SPENDING' },
  analyticsTrend: { id: 'TREN 6 BULAN', en: '6 MONTH TREND' },
  analyticsWallet: { id: 'Wallet', en: 'Wallet' },
  analyticsTimeRange: { id: 'Rentang Waktu', en: 'Time Range' },
  analyticsFrom: { id: 'Dari', en: 'From' },
  analyticsTo: { id: 'Sampai', en: 'To' },
  analyticsAllWallets: { id: 'Semua Wallet', en: 'All Wallets' },
  analyticsTotal: { id: 'Total', en: 'Total' },
  analyticsNoExpense: { id: 'Belum ada pengeluaran', en: 'No expenses yet' },
  analyticsNoData: { id: 'Belum ada data', en: 'No data yet' },
  analyticsRangeMonth: { id: 'Bulan Ini', en: 'This Month' },
  analyticsRange3m: { id: '3 Bulan Terakhir', en: 'Last 3 Months' },
  analyticsRange6m: { id: '6 Bulan Terakhir', en: 'Last 6 Months' },
  analyticsRangeYear: { id: 'Tahun Ini', en: 'This Year' },
  analyticsRangeAll: { id: 'Semua Waktu', en: 'All Time' },
  analyticsRangeCustom: { id: 'Rentang Custom', en: 'Custom Range' },

  addTxTitle: { id: 'TAMBAH TRANSAKSI', en: 'ADD TRANSACTION' },
  addTxAmount: { id: 'Jumlah', en: 'Amount' },
  addTxCategory: { id: 'Kategori', en: 'Category' },
  addTxNote: { id: 'Catatan (opsional)', en: 'Note (optional)' },
  addTxNotePlaceholder: { id: 'Makan siang di warung...', en: 'Lunch at the warung...' },
  addTxDate: { id: 'Tanggal', en: 'Date' },
  addTxSubmit: { id: 'Simpan Transaksi', en: 'Save Transaction' },

  settingsTitle: { id: 'PENGATURAN', en: 'SETTINGS' },
  settingsTheme: { id: 'Vault Skins', en: 'Vault Skins' },
  settingsThemeHint: { id: 'Pilih palet warna, lalu Siang/Malam', en: 'Pick a color family, then Day or Night' },
  settingsLanguage: { id: 'Bahasa', en: 'Language' },
} as const

export type TranslationKey = keyof typeof dict

export function t(locale: Locale, key: TranslationKey): string {
  return dict[key]?.[locale] ?? dict[key]?.[DEFAULT_LOCALE] ?? key
}

// The 9 default categories are seeded (in Indonesian) by a DB trigger on
// signup — they're fixed, known app content, not arbitrary user text, so
// unlike a category the user renamed or created themselves, these can be
// safely translated for display. Anything not in this map (custom
// categories, renamed ones) passes through unchanged.
const CATEGORY_NAMES: Record<string, { id: string; en: string }> = {
  'Makan & Minum': { id: 'Makan & Minum', en: 'Food & Drinks' },
  'Transport': { id: 'Transport', en: 'Transport' },
  'Belanja': { id: 'Belanja', en: 'Shopping' },
  'Hiburan': { id: 'Hiburan', en: 'Entertainment' },
  'Kesehatan': { id: 'Kesehatan', en: 'Health' },
  'Tagihan': { id: 'Tagihan', en: 'Bills' },
  'Gaji': { id: 'Gaji', en: 'Salary' },
  'Freelance': { id: 'Freelance', en: 'Freelance' },
  'Lainnya': { id: 'Lainnya', en: 'Other' },
}

export function translateCategoryName(name: string, locale: Locale): string {
  return CATEGORY_NAMES[name]?.[locale] ?? name
}
