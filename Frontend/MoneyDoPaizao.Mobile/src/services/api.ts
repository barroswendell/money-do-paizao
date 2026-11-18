export type AuthResponse = {
  token: string;
  userId: string;
  name: string;
  email: string;
  role: 'Admin' | 'Usuario';
  accountId: string;
  module: ProductModule;
};

export type ProductModule = 'Loans' | 'Parties' | 'PersonalFinance';

export type Customer = {
  id: string;
  name: string;
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
};

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

type RegisterPayload = {
  name: string;
  email: string;
  cpf: string;
  birthDate: string;
  password: string;
  confirmPassword: string;
  module: ProductModule;
};

// Web/desktop uses localhost; Android emulator can override with EXPO_PUBLIC_API_URL=http://10.0.2.2:5000/api.
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000/api';

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
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

export function registerLoanPayment(token: string, loanId: string, type: 'Full' | 'InterestOnly') {
  return request<Loan>(`/loans/${loanId}/payments`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ type }),
  });
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
