import { useCallback, useEffect, useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';
import { formatMoney, type Person } from './data';
import {
  checkCreditLimit,
  createDaftarContact,
  createDaftarTransaction,
  loadDaftarPeople,
} from './daftarApi';
import { Icon } from './icons';

type Modal = 'none' | 'filter' | 'addPerson' | 'settings' | 'pin' | 'transaction';
type SubmitResult = { ok: boolean; message?: string };

export default function App() {
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [modal, setModal] = useState<Modal>('none');
  const [drawer, setDrawer] = useState(false);
  const [light, setLight] = useState(() => localStorage.getItem('dq-theme') === 'light');
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (Capacitor.isNativePlatform()) void StatusBar.hide();
  }, []);

  useEffect(() => { localStorage.setItem('dq-theme', light ? 'light' : 'dark'); }, [light]);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2200);
  };

  const refresh = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setLoadError('');
    try {
      const live = await loadDaftarPeople();
      setPeople(live);
      setSelectedId(current => current !== null && live.some(p => p.id === current) ? current : null);
      if (quiet) notify('داتا نوێ کرایەوە');
    } catch (error) {
      console.error('Daftar load failed', error);
      setLoadError('نەتوانرا داتای Daftar Qarz وەربگیرێت. پەیوەندیی ئینتەرنێت بپشکنە و دووبارە هەوڵ بدەوە.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const filtered = useMemo(
    () => people.filter(p => `${p.name} ${p.latin || ''} ${p.phone || ''}`.toLowerCase().includes(query.toLowerCase())),
    [people, query],
  );
  const selected = people.find(p => p.id === selectedId) || null;
  const total = useMemo(() => people.reduce((sum, person) => sum + person.balance, 0), [people]);

  const addPerson = async (name: string, phone: string): Promise<SubmitResult> => {
    try {
      await createDaftarContact(name, phone);
      await refresh();
      setModal('none');
      notify('قەرزدار زیاد کرا');
      return { ok: true };
    } catch (error) {
      console.error('Daftar contact create failed', error);
      return { ok: false, message: 'زیادکردنی قەرزدار سەرکەوتوو نەبوو. هیچ داتایەک بە ناڕوونی تۆمار نەکرا.' };
    }
  };

  const addTransaction = async (
    amount: number,
    kind: 'debt' | 'credit',
    note: string,
  ): Promise<SubmitResult> => {
    if (!selected) return { ok: false, message: 'قەرزدار دیاری نەکراوە.' };

    if (kind === 'debt') {
      const check = await checkCreditLimit(selected.id, amount, 'IQD');
      if (!check.allowed) {
        if (check.error === 'credit_limit_exceeded') {
          const limit = formatMoney(Number(check.debt_limit ?? 0));
          const current = formatMoney(Number(check.current_balance ?? selected.balance));
          const remaining = formatMoney(Number(check.remaining_capacity ?? 0));
          return {
            ok: false,
            message: `سنووری قەرز تێدەپەڕێت. سنوور: ${limit} — قەرزی ئێستا: ${current} — بۆشایی ماوە: ${remaining}`,
          };
        }
        return {
          ok: false,
          message: 'نەتوانرا سنووری قەرز پشتڕاست بکرێتەوە؛ بۆ پاراستنی هەژمار قەرز تۆمار نەکرا.',
        };
      }
    }

    try {
      await createDaftarTransaction({
        contactId: selected.id,
        kind,
        amount,
        note,
        currency: 'IQD',
      });
      await refresh();
      setModal('none');
      notify(kind === 'debt' ? 'قەرز تۆمار کرا' : 'پارەدان تۆمار کرا');
      return { ok: true };
    } catch (error) {
      console.error('Daftar transaction create failed', error);
      return {
        ok: false,
        message: 'تۆمارکردنی مامەڵە سەرکەوتوو نەبوو. دووبارە هەوڵ بدەوە.',
      };
    }
  };

  return <div className={light ? 'app light' : 'app'} dir="rtl">
    <header className="status"><strong>{new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false })}</strong><span className="island"><i /></span><span className="status-right"><span className="signal">▮▮▮▮</span><span>LTE</span><span className="battery">●</span></span></header>

    {selected
      ? <LedgerHeader person={selected} onBack={() => setSelectedId(null)} onAdd={() => setModal('transaction')} />
      : <MainHeader
          searching={searching}
          query={query}
          setQuery={setQuery}
          setSearching={setSearching}
          onFilter={() => setModal('filter')}
          onMenu={() => setDrawer(true)}
          onAdd={() => setModal('addPerson')}
          onRefresh={() => void refresh(true)}
        />}

    <main className={selected ? 'ledger-main' : ''}>
      {selected ? <Ledger person={selected} /> : <>
        <Summary total={total} />
        {loading ? <section className="state-card">داتا بار دەکرێت...</section> : loadError ? <section className="state-card error-state"><p>{loadError}</p><button className="outline-wide" onClick={() => void refresh()}>دووبارە هەوڵدانەوە</button></section> : <section className="people-list">
          {filtered.map((person, index) => <button className="person-row" key={person.id} onClick={() => setSelectedId(person.id)}>
            <span className="person-name"><b>{index + 1} :</b> {person.name} {person.latin && <strong>{person.latin}</strong>}</span>
            {person.balance !== 0 && <span className="person-balance">{formatMoney(person.balance)}</span>}
          </button>)}
          {filtered.length === 0 && <div className="state-card">هیچ قەرزدارێک نەدۆزرایەوە.</div>}
        </section>}
      </>}
    </main>

    {selected && <button className="fab" aria-label="زیادکردنی مامەڵە" onClick={() => setModal('transaction')}><Icon name="plus" /></button>}
    {drawer && <Drawer light={light} onTheme={setLight} onClose={() => setDrawer(false)} onPin={() => { setDrawer(false); setModal('pin'); }} />}
    {modal === 'filter' && <FilterModal onClose={() => setModal('none')} />}
    {modal === 'addPerson' && <AddPersonModal onClose={() => setModal('none')} onAdd={addPerson} />}
    {modal === 'pin' && <PinModal onClose={() => setModal('none')} onDone={() => { setModal('none'); notify('پین کۆد هەڵگیرا'); }} />}
    {modal === 'transaction' && selected && <TransactionModal name={selected.name} onClose={() => setModal('none')} onAdd={addTransaction} />}
    {toast && <div className="toast">{toast}</div>}
  </div>;
}

function MainHeader({ searching, query, setQuery, setSearching, onFilter, onMenu, onAdd, onRefresh }: { searching: boolean; query: string; setQuery: (v: string) => void; setSearching: (v: boolean) => void; onFilter: () => void; onMenu: () => void; onAdd: () => void; onRefresh: () => void }) {
  return <nav className="toolbar">
    <div className="tool-right"><button aria-label="نوێکردنەوە" onClick={onRefresh}><Icon name="refresh" /></button><button aria-label="زیادکردنی قەرزدار" onClick={onAdd}><Icon name="personAdd" /></button></div>
    {searching ? <div className="search-box"><input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="گەڕان بە ناوی قەرزدار"/><button aria-label="داخستنی گەڕان" onClick={() => { setQuery(''); setSearching(false); }}><Icon name="close" /></button></div> : <div className="tool-left"><button aria-label="ڕێکخستنەکان" onClick={onMenu}><Icon name="mail" /></button><button aria-label="گەڕان" onClick={() => setSearching(true)}><Icon name="search" /></button><button aria-label="فلتەر" className="calendar-short" onClick={onFilter}><Icon name="calendar" /></button></div>}
  </nav>;
}

function LedgerHeader({ person, onBack, onAdd }: { person: Person; onBack: () => void; onAdd: () => void }) {
  return <nav className="ledger-head"><button onClick={onBack}><Icon name="back" /></button><h1>{person.name} {person.latin && <small>{person.latin}</small>}</h1><button onClick={onAdd}><Icon name="plus" /></button></nav>;
}

function Summary({ total }: { total: number }) {
  return <section className="summary"><p>لەقەرزدارە : <strong>{formatMoney(total)}</strong></p><hr/><p>قەرزی گشتی ئێستا : <b>{formatMoney(total)}</b></p></section>;
}

function Ledger({ person }: { person: Person }) {
  const debt = person.transactions.filter(t => t.kind === 'debt' && t.currency === 'IQD').reduce((s, t) => s + t.amount, 0);
  const credit = person.transactions.filter(t => t.kind === 'credit' && t.currency === 'IQD').reduce((s, t) => s + t.amount, 0);
  return <>
    <section className="transactions">
      {person.transactions.map(t => <article key={t.id} className={`transaction ${t.kind}`}>
        <strong>{formatMoney(t.amount, t.currency)}</strong><span>{t.note}</span><small>{t.at}</small>
      </article>)}
      {person.transactions.length === 0 && <div className="state-card">هیچ مامەڵەیەک نییە.</div>}
    </section>
    <section className="ledger-total"><p>کۆی گشتی : {formatMoney(debt - credit)}</p><div><span className="red">قەرز: {formatMoney(debt)}</span><span className="green">گەڕاوە: {formatMoney(credit)}</span></div></section>
  </>;
}

function Backdrop({ children, onClose, sheet = false }: { children: React.ReactNode; onClose: () => void; sheet?: boolean }) {
  return <div className="backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}><section className={sheet ? 'modal sheet' : 'modal'}>{children}</section></div>;
}

function FilterModal({ onClose }: { onClose: () => void }) {
  const [from, setFrom] = useState(''); const [to, setTo] = useState('');
  return <Backdrop onClose={onClose} sheet><button className="modal-close" onClick={onClose}><Icon name="close" /></button>
    <div className="chips"><button>کەمترین قەرزی وەرگیراوە بە دینار</button><button>زۆرترین قەرزی وەرگیراوە</button><button>قەرز نەدراو</button><button>قەرز وەرگیراوە</button></div>
    <label>لە بەرواری<input type="date" value={from} onChange={e => setFrom(e.target.value)} /></label>
    <label>بۆ بەرواری<input type="date" value={to} onChange={e => setTo(e.target.value)} /></label>
    <button className="outline-wide" onClick={onClose}>گەڕان</button>
  </Backdrop>;
}

function AddPersonModal({ onClose, onAdd }: { onClose: () => void; onAdd: (name: string, phone: string) => Promise<SubmitResult> }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    if (!name.trim() || busy) return;
    setBusy(true); setError('');
    const result = await onAdd(name.trim(), phone.trim());
    if (!result.ok) setError(result.message || 'هەڵەیەک ڕوویدا');
    setBusy(false);
  };
  return <Backdrop onClose={onClose} sheet><button className="modal-close" onClick={onClose}><Icon name="close" /></button><h2>زیادکردنی قەرزدار</h2>
    <input className="field" autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="ناوی قەرزدار" />
    <input className="field" value={phone} onChange={e => setPhone(e.target.value.replace(/[^0-9+]/g, ''))} placeholder="ژمارە مۆبایل" dir="ltr" />
    {error && <p className="form-error">{error}</p>}
    <button className="outline-wide" disabled={!name.trim() || busy} onClick={() => void submit()}>{busy ? 'تۆمار دەکرێت...' : 'زیادکردن'}</button>
  </Backdrop>;
}

function TransactionModal({ name, onClose, onAdd }: { name: string; onClose: () => void; onAdd: (amount: number, kind: 'debt' | 'credit', note: string) => Promise<SubmitResult> }) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [kind, setKind] = useState<'debt' | 'credit'>('debt');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    const numeric = Number(amount);
    if (!numeric || busy) return;
    setBusy(true);
    setError('');
    const result = await onAdd(numeric, kind, note);
    if (!result.ok) setError(result.message || 'هەڵەیەک ڕوویدا');
    setBusy(false);
  };

  return <Backdrop onClose={onClose} sheet><button className="modal-close" onClick={onClose}><Icon name="close" /></button><h2>{name}</h2>
    <div className="segment"><button className={kind === 'debt' ? 'active' : ''} onClick={() => { setKind('debt'); setError(''); }}>قەرز</button><button className={kind === 'credit' ? 'active green-bg' : ''} onClick={() => { setKind('credit'); setError(''); }}>گەڕاندنەوە</button></div>
    <input className="field" inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value.replace(/\D/g, ''))} placeholder="بڕی پارە بە دینار" />
    <textarea className="field" value={note} onChange={e => setNote(e.target.value)} placeholder="تێبینی" />
    {kind === 'debt' && <p className="limit-note">پێش تۆمارکردن سنووری قەرز خۆکار پشکنراوە.</p>}
    {error && <p className="form-error">{error}</p>}
    <button className="outline-wide" disabled={!Number(amount) || busy} onClick={() => void submit()}>{busy ? 'پشکنین و تۆمارکردن...' : 'تۆمارکردن'}</button>
  </Backdrop>;
}

function PinModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [pin, setPin] = useState('');
  return <Backdrop onClose={onClose}><button className="modal-close" onClick={onClose}><Icon name="close" /></button><h2>گۆڕینی پین کۆد</h2><p className="muted">پین کۆدی نوێ بنووسە</p><div className="pin-dots">{[0,1,2,3].map(i => <i key={i} className={pin.length > i ? 'filled' : ''}/>)}</div><input className="pin-input" inputMode="numeric" maxLength={4} autoFocus value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))}/><button className="outline-wide" disabled={pin.length !== 4} onClick={onDone}>هەڵگرتن</button></Backdrop>;
}

function Drawer({ light, onTheme, onClose, onPin }: { light: boolean; onTheme: (v: boolean) => void; onClose: () => void; onPin: () => void }) {
  const items = [
    ['person', 'ژماری هەژمار'], ['filter', 'گۆڕینی دۆخ'], ['edit', 'ڕێکخستن'], ['lock', 'پین کۆد'], ['key', 'گۆڕینی پاسۆرد'], ['clock', 'گۆڕینی زمان'], ['grid', 'پێشنیاز'], ['message', 'پەیوەندیکردن'], ['logout', 'چوونەدەرەوە'],
  ] as const;
  return <div className="drawer-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}><aside className="drawer"><button className="drawer-close" onClick={onClose}><Icon name="close" /></button><h2>ڕێکخستنەکان</h2>
    <div className="theme-switch"><button onClick={() => onTheme(false)} className={!light ? 'selected' : ''}><Icon name="moon" /></button><button onClick={() => onTheme(true)} className={light ? 'selected' : ''}><Icon name="sun" /></button></div>
    <div className="drawer-items">{items.map(([icon, label]) => <button key={label} onClick={label === 'پین کۆد' ? onPin : undefined}><Icon name={icon} /><span>{label}</span></button>)}</div>
  </aside></div>;
}
