export type AuthResponse = {
  token: string;
  userId: string;
  name: string;
  email: string;
  role: 'Admin' | 'Usuario';
};

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

type RegisterPayload = {
  name: string;
  email: string;
  cpf: string;
  birthDate: string;
  password: string;
  confirmPassword: string;
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
    throw new Error(data.message ?? 'Não foi possível concluir a operação.');
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
