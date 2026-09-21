import { CapacitorHttp } from '@capacitor/core';
import type { Person, Transaction } from './data';

const DAFTAR_API = 'https://api-daftar-qarz.kasbkar.net/api/v1';
const CREDIT_CHECK = 'https://hsoyfbtpvwfmjokudznx.supabase.co/functions/v1/daftar-credit-check';
const USER_ID = 28;

type ContactRow = {
  id: number;
  user_id: number;
  name: string;
  phone?: string | null;
};

type TransactionRow = {
  id: number;
  user_id: number;
  contact_id: number;
  transaction_type: 'LOAN' | 'PAYMENT';
  amount: number | string;
  currency?: string | null;
  transaction_date?: string | null;
  note?: string | null;
  created_at?: string | null;
};

type ApiEnvelope<T> = { success: boolean; data: T };

export type CreditCheckResult = {
  allowed: boolean;
  enforced?: boolean;
  debt_limit?: number;
  current_balance?: number | null;
  projected_balance?: number | null;
  remaining_capacity?: number | null;
  error?: string | null;
};

function baghdadTimestamp(date = new Date()): string {
  const baghdad = new Date(date.getTime() + 3 * 60 * 60 * 1000);
  const p2 = (v: number) => String(v).padStart(2, '0');
  const p3 = (v: number) => String(v).padStart(3, '0');
  return [
    baghdad.getUTCFullYear(), '-', p2(baghdad.getUTCMonth() + 1), '-', p2(baghdad.getUTCDate()),
    ' ', p2(baghdad.getUTCHours()), ':', p2(baghdad.getUTCMinutes()), ':', p2(baghdad.getUTCSeconds()),
    '.', p3(baghdad.getUTCMilliseconds()), '000',
  ].join('');
}

async function requestJson<T>(
  url: string,
  method: 'GET' | 'POST' = 'GET',
  data?: Record<string, unknown>,
): Promise<T> {
  const response = await CapacitorHttp.request({
    url,
    method,
    headers: {
      accept: 'application/json',
      ...(method === 'POST' ? { 'content-type': 'application/json' } : {}),
    },
    data,
    connectTimeout: 15000,
    readTimeout: 30000,
  });

  if (response.status < 200 || response.status >= 300) {
    const detail = typeof response.data === 'string'
      ? response.data
      : JSON.stringify(response.data ?? {});
    throw new Error(`HTTP_${response.status}:${detail.slice(0, 500)}`);
  }
  return response.data as T;
}

export async function loadDaftarPeople(): Promise<Person[]> {
  const [contactsResponse, transactionsResponse] = await Promise.all([
    requestJson<ApiEnvelope<ContactRow[]>>(`${DAFTAR_API}/contacts?user_id=${USER_ID}`),
    requestJson<ApiEnvelope<TransactionRow[]>>(`${DAFTAR_API}/transactions?user_id=${USER_ID}`),
  ]);

  if (contactsResponse?.success !== true || !Array.isArray(contactsResponse.data)) {
    throw new Error('INVALID_CONTACTS_RESPONSE');
  }
  if (transactionsResponse?.success !== true || !Array.isArray(transactionsResponse.data)) {
    throw new Error('INVALID_TRANSACTIONS_RESPONSE');
  }

  const byContact = new Map<number, Transaction[]>();
  const netIqd = new Map<number, number>();

  for (const row of transactionsResponse.data) {
    if (Number(row.user_id) !== USER_ID) continue;
    const contactId = Number(row.contact_id);
    const amount = Math.abs(Number(row.amount ?? 0));
    if (!Number.isFinite(contactId) || !Number.isFinite(amount)) continue;

    const kind: 'credit' | 'debt' = row.transaction_type === 'PAYMENT' ? 'credit' : 'debt';
    const currency = String(row.currency ?? 'IQD').toUpperCase();
    const tx: Transaction = {
      id: String(row.id),
      amount,
      kind,
      note: String(row.note ?? ''),
      at: String(row.transaction_date ?? row.created_at ?? ''),
      currency,
    };
    const current = byContact.get(contactId) ?? [];
    current.push(tx);
    byContact.set(contactId, current);

    if (currency === 'IQD') {
      netIqd.set(contactId, (netIqd.get(contactId) ?? 0) + (kind === 'debt' ? amount : -amount));
    }
  }

  for (const txs of byContact.values()) {
    txs.sort((a, b) => {
      const ad = Date.parse(a.at.replace(' ', 'T')) || Number(a.id) || 0;
      const bd = Date.parse(b.at.replace(' ', 'T')) || Number(b.id) || 0;
      return bd - ad;
    });
  }

  return contactsResponse.data
    .filter(row => Number(row.user_id) === USER_ID)
    .map(row => ({
      id: Number(row.id),
      name: String(row.name ?? '').trim(),
      phone: String(row.phone ?? '').trim(),
      balance: netIqd.get(Number(row.id)) ?? 0,
      transactions: byContact.get(Number(row.id)) ?? [],
    }))
    .sort((a, b) => b.balance - a.balance || a.name.localeCompare(b.name));
}

export async function checkCreditLimit(
  contactId: number,
  amount: number,
  currency = 'IQD',
): Promise<CreditCheckResult> {
  try {
    const response = await CapacitorHttp.request({
      url: CREDIT_CHECK,
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      data: {
        user_id: USER_ID,
        contact_id: contactId,
        amount,
        currency,
      },
      connectTimeout: 10000,
      readTimeout: 20000,
    });

    const body = (response.data ?? {}) as CreditCheckResult;
    if (response.status === 422 && body.error === 'credit_limit_exceeded') {
      return { ...body, allowed: false };
    }
    if (response.status < 200 || response.status >= 300) {
      return { allowed: false, error: body.error || `credit_check_http_${response.status}` };
    }
    return body;
  } catch {
    return { allowed: false, error: 'credit_check_unavailable' };
  }
}

export async function createDaftarTransaction(input: {
  contactId: number;
  kind: 'debt' | 'credit';
  amount: number;
  note: string;
  currency?: string;
}): Promise<void> {
  const response = await requestJson<ApiEnvelope<{ id?: number | string }> | { id?: number | string }>(
    `${DAFTAR_API}/transactions`,
    'POST',
    {
      user_id: USER_ID,
      contact_id: input.contactId,
      transaction_type: input.kind === 'debt' ? 'LOAN' : 'PAYMENT',
      amount: input.amount,
      currency: String(input.currency ?? 'IQD').toUpperCase(),
      transaction_date: baghdadTimestamp(),
      note: input.note,
    },
  );

  const ok = (response as ApiEnvelope<unknown>)?.success === true
    || Boolean((response as { id?: unknown })?.id)
    || Boolean((response as ApiEnvelope<{ id?: unknown }>)?.data?.id);
  if (!ok) throw new Error('TRANSACTION_WRITE_NOT_CONFIRMED');
}

export async function createDaftarContact(name: string, phone: string): Promise<void> {
  const timestamp = baghdadTimestamp();
  const response = await requestJson<ApiEnvelope<{ id?: number | string }> | { id?: number | string }>(
    `${DAFTAR_API}/contacts`,
    'POST',
    {
      user_id: USER_ID,
      name: name.trim(),
      phone: phone.trim(),
      created_at: timestamp,
      updated_at: timestamp,
    },
  );
  const ok = (response as ApiEnvelope<unknown>)?.success === true
    || Boolean((response as { id?: unknown })?.id)
    || Boolean((response as ApiEnvelope<{ id?: unknown }>)?.data?.id);
  if (!ok) throw new Error('CONTACT_WRITE_NOT_CONFIRMED');
}
