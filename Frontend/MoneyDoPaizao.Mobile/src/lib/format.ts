export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatMoneyInput(value: number) {
  return value.toFixed(2).replace('.', ',');
}

export function localDateInput(date = new Date()) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part) => String(part).padStart(2, '0')).join('-');
}

export function parseMoneyCents(input: string): number | null {
  const value = input.trim();
  const isGrouped = /^\d{1,3}(\.\d{3})+(,\d{0,2})?$/.test(value);
  const normalized = isGrouped ? value.replace(/\./g, '') : value;
  const match = /^(\d+)(?:[.,](\d{0,2}))?$/.exec(normalized);
  if (!match) return null;

  const cents = Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'));
  return Number.isSafeInteger(cents) && Math.round(cents / 100 * 100) === cents ? cents : null;
}

export function formatDate(value: string) {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: dateOnly ? 'UTC' : undefined,
  }).format(new Date(value));
}

export function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
