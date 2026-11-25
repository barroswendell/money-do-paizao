import type { PartyMonth } from '../services/api';

export const PARTY_MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function partyToday() {
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  return ['year', 'month', 'day'].map((part) => parts.find((item) => item.type === part)?.value).join('-');
}

export function partyMonthLabel(month: string) {
  return `${PARTY_MONTH_NAMES[Number(month.slice(5, 7)) - 1]} de ${month.slice(0, 4)}`;
}

export function shiftPartyMonth(month: string, offset: number) {
  const date = new Date(`${month}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 7);
}

export function emptyPartyMonth(month: string): PartyMonth {
  return { month, eventCount: 0, totalAmount: 0, receivedAmount: 0, remainingAmount: 0 };
}
