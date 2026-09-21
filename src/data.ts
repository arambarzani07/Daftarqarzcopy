export type Transaction = {
  id: string;
  amount: number;
  kind: 'credit' | 'debt';
  note: string;
  at: string;
  currency: string;
};

export type Person = {
  id: number;
  name: string;
  phone?: string;
  latin?: string;
  balance: number;
  transactions: Transaction[];
};

export const formatMoney = (value: number, currency = 'IQD') => {
  const suffix = currency.toUpperCase() === 'USD' ? '$' : 'دینار';
  return `${Math.abs(value).toLocaleString('en-US')} ${suffix}`;
};
