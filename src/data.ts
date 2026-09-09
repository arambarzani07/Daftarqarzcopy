export type Transaction = {
  id: string;
  amount: number;
  kind: 'credit' | 'debt';
  note: string;
  at: string;
};

export type Person = {
  id: number;
  name: string;
  latin?: string;
  balance: number;
  transactions: Transaction[];
};

const tx = (id: string, amount: number, kind: 'credit' | 'debt', note: string, at: string): Transaction => ({ id, amount, kind, note, at });

export const seedPeople: Person[] = [
  { id: 1, name: 'ئەمیر سیامەند', latin: 'Amir', balance: 0, transactions: [
    tx('a1', 16000, 'debt', 'kart korak azad', '14:27 22/09/2025'),
    tx('a2', 40500, 'debt', 'N/17764', '16:00 28/09/2025'),
    tx('a3', 6500, 'debt', 'کارت', '09:26 15/10/2025'),
    tx('a4', 16000, 'debt', 'kart korakN', '22:34 21/10/2025'),
    tx('a5', 56500, 'credit', 'firaz/ amram rash vanakrdbu', '10:08 23/10/2025'),
  ]},
  { id: 2, name: 'ئارەش فکری', latin: 'Arash', balance: 70000, transactions: [] },
  { id: 3, name: 'ئەسکەندەر ئەحمەد', latin: 'Askandar', balance: 132500, transactions: [] },
  { id: 4, name: 'ئارمان ئالی', latin: 'Arman', balance: 37500, transactions: [] },
  { id: 5, name: 'ئەژکان شوکری', latin: 'Arkan', balance: 652500, transactions: [] },
  { id: 6, name: 'ئەردەڵان غازی', latin: 'Ardalan', balance: 0, transactions: [] },
  { id: 7, name: 'بێنهاد ئەحمەد', latin: 'Inhad', balance: 76000, transactions: [] },
  { id: 8, name: 'ئیسمائیل حوسێن', latin: 'Ismail', balance: 0, transactions: [] },
  { id: 9, name: 'ئەحمەد مستەفا', latin: 'Ahmad', balance: 0, transactions: [] },
  { id: 10, name: 'فەرهاد سەعید', latin: 'Azad', balance: 0, transactions: [] },
  { id: 11, name: 'دیار سیامەند', latin: 'Diyar', balance: 3000, transactions: [] },
  { id: 12, name: 'سالم پیرانی', latin: 'Salm', balance: 1000, transactions: [] },
  { id: 13, name: 'سەمیر عەزیز', latin: 'Samir', balance: 14250, transactions: [] },
  { id: 14, name: 'فەرید نەجات', latin: 'Farid', balance: 21000, transactions: [] },
  { id: 15, name: 'شەهاب ئەحمەد', latin: 'Shahabd', balance: 41000, transactions: [] },
  { id: 16, name: 'نیهان عەلی', latin: 'Nihan', balance: 6000, transactions: [] },
  { id: 17, name: 'هاوژار عەبدولڕەحمان', latin: 'Hawzhar', balance: 1000, transactions: [] },
  { id: 18, name: 'پەریخان حوسێن', latin: 'Parikhan', balance: 15000, transactions: [] },
];

export const formatMoney = (value: number) => `${Math.abs(value).toLocaleString('en-US')} دینار`;
