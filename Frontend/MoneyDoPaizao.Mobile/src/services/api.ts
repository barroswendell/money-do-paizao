import type { DocumentPickerAsset } from 'expo-document-picker';
import { cacheDirectory, downloadAsync } from 'expo-file-system/legacy';
import { isAvailableAsync, shareAsync } from 'expo-sharing';
import { Platform } from 'react-native';

export type AuthResponse = {
  token: string;
  userId: string;
  name: string;
  email: string;
  role: 'Admin' | 'Usuario';
  accountId: string;
  modules: ProductModule[];
  activeModule?: ProductModule | null;
};

export type ProductModule = 'Loans' | 'Parties' | 'PersonalFinance' | 'Sales';

export type AppearanceSettings = {
  useCustomTheme: boolean;
  primaryColor: string;
  secondaryColor: string;
  isDarkMode: boolean;
};

export type Customer = {
  id: string;
  name: string;
  phone?: string | null;
  hasReferral: boolean;
  referral?: string | null;
  createdAtUtc: string;
};

export type Loan = {
  id: string;
  customerId: string;
  customerName: string;
  principalAmount: number;
  dueDay: number;
  monthlyInterestRatePercent: number;
  lateDailyInterestRatePercent: number;
  dueDate: string;
  daysLate: number;
  interestDue: number;
  totalDue: number;
  status: 'Active' | 'Paid';
  paidInterest: number;
  payments: LoanPayment[];
};

export type LoanPayment = {
  id: string;
  type: LoanPaymentType;
  amount: number;
  interestAmount: number;
  principalAmount: number;
  paidAtUtc: string;
  receiptName?: string | null;
};

export type LoanPaymentType = 'Full' | 'InterestOnly';

export type DashboardSummary = {
  totalCustomers: number;
  totalLent: number;
  totalProfit: number;
  customersOnTime: number;
  customersOverdue: number;
};

export type PartyTheme = {
  id: string;
  name: string;
  description?: string | null;
  createdAtUtc: string;
};

export type PartyEvent = {
  id: string;
  customerId: string;
  customerName: string;
  themeId?: string | null;
  themeName?: string | null;
  eventDate: string;
  totalAmount: number;
  depositReceived: boolean;
  depositAmount: number;
  remainingAmount: number;
  notes?: string | null;
  status: string;
};

export type PartyDashboard = {
  upcomingEvents: number;
  monthlyRevenue: number;
  monthlyDeposits: number;
  monthlyPending: number;
};

export type FinanceEntryType = 'Income' | 'Expense';

export type FinanceEntry = {
  id: string;
  type: FinanceEntryType;
  amount: number;
  entryDate: string;
  category: string;
  description?: string | null;
  createdAtUtc: string;
};

export type PersonalFinanceSummary = {
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyBalance: number;
  entriesCount: number;
};

export type Product = {
  id: string;
  name: string;
  brand: string;
  price: number;
  createdAtUtc: string;
};

export type Sale = {
  id: string;
  customerId: string;
  customerName: string;
  productId: string;
  productName: string;
  productBrand: string;
  amount: number;
  paymentType: 'Cash' | 'Installment';
  status: 'Pending' | 'Paid';
  dueDate?: string | null;
  soldAtUtc: string;
  paidAtUtc?: string | null;
};

export type SalesDashboard = {
  totalCustomers: number;
  totalProducts: number;
  totalSales: number;
  totalRevenue: number;
  totalReceived: number;
  totalPending: number;
};

type RegisterPayload = {
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  password: string;
  confirmPassword: string;
  modules: ProductModule[];
};

// Web/desktop uses localhost; Android emulator can override with EXPO_PUBLIC_API_URL=http://10.0.2.2:5000/api.
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000/api';

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(typeof options.body === 'string' ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers ?? {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const validationMessage = data.errors
      ? Object.keys(data.errors).map((key) => data.errors[key].join(' ')).join(' ')
      : undefined;
    throw new Error(data.message ?? data.detail ?? validationMessage ?? 'Não foi possível concluir a operação.');
  }

  return data as T;
}

export function login(email: string, password: string) {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function register(payload: RegisterPayload) {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function activateModule(token: string, module: ProductModule) {
  return request<AuthResponse>('/account/modules/activate', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ module }),
  });
}

export function getAppearanceSettings(token: string) {
  return request<AppearanceSettings>('/account/settings', {
    method: 'GET',
    headers: authHeaders(token),
  });
}

export function updateAppearanceSettings(token: string, payload: AppearanceSettings) {
  return request<AppearanceSettings>('/account/settings', {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export function getDashboardSummary(token: string) {
  return request<DashboardSummary>('/dashboard/summary', {
    method: 'GET',
    headers: authHeaders(token),
  });
}

export function getCustomers(token: string) {
  return request<Customer[]>('/customers', {
    method: 'GET',
    headers: authHeaders(token),
  });
}

export function createCustomer(token: string, payload: Omit<Customer, 'id' | 'createdAtUtc'>) {
  return request<Customer>('/customers', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function getLoans(token: string) {
  return request<Loan[]>('/loans', {
    method: 'GET',
    headers: authHeaders(token),
  });
}

export function createLoan(token: string, payload: {
  customerId: string;
  principalAmount: number;
  dueDay: number;
  monthlyInterestRatePercent: number;
  lateDailyInterestRatePercent: number;
}) {
  return request<Loan>('/loans', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function registerLoanPayment(token: string, loanId: string, type: LoanPaymentType, requestId: string, receipt: DocumentPickerAsset | null) {
  let body: string | FormData = JSON.stringify({ type, requestId });
  if (receipt) {
    const form = new FormData();
    form.append('type', type);
    form.append('requestId', requestId);
    if (receipt.file) {
      form.append('receipt', receipt.file, receipt.name);
    } else {
      // React Native uses the local URI to read the file when sending the form.
      form.append('receipt', { uri: receipt.uri, name: receipt.name, type: receipt.mimeType ?? 'application/octet-stream' } as unknown as Blob);
    }
    body = form;
  }

  return request<Loan>(`/loans/${loanId}/payments`, {
    method: 'POST',
    headers: authHeaders(token),
    body,
  });
}

export async function downloadLoanPaymentReceipt(token: string, loanId: string, paymentId: string, name: string) {
  const url = `${API_URL}/loans/${loanId}/payments/${paymentId}/receipt`;
  const headers = authHeaders(token);
  if (Platform.OS === 'web') {
    const response = await fetch(url, { headers, cache: 'no-store' });
    if (!response.ok) throw new Error('Não foi possível baixar o comprovante.');

    const objectUrl = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
    return;
  }

  if (!cacheDirectory || !(await isAvailableAsync())) {
    throw new Error('Este dispositivo não consegue abrir o menu para salvar o comprovante.');
  }

  const extension = name.slice(name.lastIndexOf('.'));
  const file = await downloadAsync(url, `${cacheDirectory}comprovante-${paymentId}${extension}`, { headers, cache: false });
  if (file.status !== 200) throw new Error('Não foi possível baixar o comprovante.');
  await shareAsync(file.uri, { dialogTitle: name });
}

export function getPartyDashboard(token: string) {
  return request<PartyDashboard>('/parties/dashboard', { method: 'GET', headers: authHeaders(token) });
}

export function getPartyThemes(token: string) {
  return request<PartyTheme[]>('/parties/themes', { method: 'GET', headers: authHeaders(token) });
}

export function createPartyTheme(token: string, payload: { name: string; description?: string }) {
  return request<PartyTheme>('/parties/themes', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function getPartyEvents(token: string) {
  return request<PartyEvent[]>('/parties/events', { method: 'GET', headers: authHeaders(token) });
}

export function createPartyEvent(token: string, payload: {
  customerId: string;
  themeId?: string | null;
  eventDate: string;
  totalAmount: number;
  depositReceived: boolean;
  depositAmount: number;
  notes?: string;
}) {
  return request<PartyEvent>('/parties/events', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function getFinanceSummary(token: string) {
  return request<PersonalFinanceSummary>('/personal-finance/summary', { method: 'GET', headers: authHeaders(token) });
}

export function getFinanceEntries(token: string) {
  return request<FinanceEntry[]>('/personal-finance/entries', { method: 'GET', headers: authHeaders(token) });
}

export function createFinanceEntry(token: string, payload: {
  type: FinanceEntryType;
  amount: number;
  entryDate: string;
  category: string;
  description?: string;
}) {
  return request<FinanceEntry>('/personal-finance/entries', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function getSalesDashboard(token: string) {
  return request<SalesDashboard>('/sales/dashboard', { method: 'GET', headers: authHeaders(token) });
}

export function getProducts(token: string) {
  return request<Product[]>('/sales/products', { method: 'GET', headers: authHeaders(token) });
}

export function createProduct(token: string, payload: { name: string; brand: string; price: number }) {
  return request<Product>('/sales/products', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function getSales(token: string) {
  return request<Sale[]>('/sales', { method: 'GET', headers: authHeaders(token) });
}

export function createSale(token: string, payload: { customerId: string; productId: string; paymentType: 'Cash' | 'Installment'; dueDate?: string | null }) {
  return request<Sale>('/sales', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function markSaleAsPaid(token: string, saleId: string) {
  return request<Sale>(`/sales/${saleId}/pay`, { method: 'POST', headers: authHeaders(token) });
}
