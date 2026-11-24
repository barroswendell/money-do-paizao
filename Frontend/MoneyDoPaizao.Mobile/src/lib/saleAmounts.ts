export function parseMoneyCents(input: string): number | null {
  const value = input.trim();
  const isGrouped = /^\d{1,3}(\.\d{3})+(,\d{0,2})?$/.test(value);
  const normalized = isGrouped ? value.replace(/\./g, '') : value;
  const match = /^(\d+)(?:[.,](\d{0,2}))?$/.exec(normalized);
  if (!match) return null;

  const cents = Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'));
  return Number.isSafeInteger(cents) && Math.round(cents / 100 * 100) === cents ? cents : null;
}

export function parseInstallmentCount(input: string): number | null {
  const value = input.trim();
  if (!/^\d+$/.test(value)) return null;

  const count = Number(value);
  return count > 0 && count <= 2_147_483_647 ? count : null;
}

export function calculateInstallments(price: number, downPayment: number, count: number, override: number | null) {
  const remaining = price - downPayment;
  const installment = override ?? Math.floor(remaining / count);
  const lastInstallment = override ?? remaining - installment * (count - 1);
  const total = downPayment + installment * (count - 1) + lastInstallment;
  if (remaining <= 0 || installment <= 0 || !Number.isSafeInteger(total)) return null;

  return { installment, lastInstallment, total };
}
