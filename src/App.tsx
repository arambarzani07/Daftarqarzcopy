import { useEffect, useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';
import { seedPeople, formatMoney, type Person, type Transaction } from './data';
import { Icon } from './icons';

type Modal = 'none' | 'filter' | 'addPerson' | 'settings' | 'pin' | 'transaction';

const loadPeople = (): Person[] => {
  try { return JSON.parse(localStorage.getItem('dq-people') || '') as Person[]; } catch { return seedPeople; }
};

export default function App() {
  const [people, setPeople] = useState<Person[]>(loadPeople);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [modal, setModal] = useState<Modal>('none');
  const [drawer, setDrawer] = useState(false);
  const [light, setLight] = useState(() => localStorage.getItem('dq-theme') === 'light');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (Capacitor.isNativePlatform()) void StatusBar.hide();
  }, []);

  useEffect(() => localStorage.setItem('dq-people', JSON.stringify(people)), [people]);
  useEffect(() => { localStorage.setItem('dq-theme', light ? 'light' : 'dark'); }, [light]);

  const filtered = useMemo(() => people.filter(p => `${p.name} ${p.latin || ''}`.toLowerCase().includes(query.toLowerCase())), [people, query]);
  const selected = people.find(p => p.id === selectedId) || null;
  const total = 47508250;
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 1700); };

  const addPerson = (name: string, latin: string) => {
    const next = Math.max(0, ...people.map(p => p.id)) + 1;
    setPeople([...people, { id: next, name, latin, balance: 0, transactions: [] }]);
    setModal('none');
  };

  const addTransaction = (amount: number, kind: 'debt' | 'credit', note: string) => {
    if (!selected) return;
    const transaction: Transaction = { id: crypto.randomUUID(), amount, kind, note, at: new Date().toLocaleString('en-GB', { hour12: false }).replace(',', '') };
    setPeople(people.map(p => p.id === selected.id ? { ...p, balance: p.balance + (kind === 'debt' ? amount : -amount), transactions: [...p.transactions, transaction] } : p));
    setModal('none');
  };

  return <div className={light ? 'app light' : 'app'} dir="rtl">
    <header className="status"><strong>4:08</strong><span className="island"><i /></span><span className="status-right"><span className="signal">▮▮▮▮</span><span>LTE</span><span className="battery">94</span></span></header>

    {selected ? <LedgerHeader person={selected} onBack={() => setSelectedId(null)} onAdd={() => setModal('transaction')} /> : <MainHeader searching={searching} query={query} setQuery={setQuery} setSearching={setSearching} onFilter={() => setModal('filter')} onMenu={() => setDrawer(true)} onAdd={() => setModal('addPerson')} onRefresh={() => notify('نوێ کرایەوە')} />}

    <main className={selected ? 'ledger-main' : ''}>
      {selected ? <Ledger person={selected} /> : <>
        <Summary total={total} />
        <section className="people-list">
          {filtered.map((person, index) => <button className="person-row" key={person.id} onClick={() => setSelectedId(person.id)}>
            <span className="person-name"><b>{index + 1} :</b> {person.name} <strong>{person.latin}</strong></span>
            {person.balance !== 0 && <span className="person-balance">{formatMoney(person.balance)}</span>}
          </button>)}
        </section>
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
  return <nav className="ledger-head"><button onClick={onBack}><Icon name="back" /></button><h1>{person.name} <small>{person.latin}</small></h1><button onClick={onAdd}><Icon name="plus" /></button></nav>;
}

function Summary({ total }: { total: number }) {
  return <section className="summary"><p>لەقەرزدارە : <strong>{formatMoney(total)}</strong></p><hr/><p>قەرزی گشتی ئێستا : <b>{formatMoney(total)}</b></p></section>;
}

function Ledger({ person }: { person: Person }) {
  const debt = person.transactions.filter(t => t.kind === 'debt').reduce((s, t) => s + t.amount, 0);
  const credit = person.transactions.filter(t => t.kind === 'credit').reduce((s, t) => s + t.amount, 0);
  return <>
    <section className="transactions">
      {person.transactions.map(t => <article key={t.id} className={`transaction ${t.kind}`}>
        <strong>{formatMoney(t.amount)}</strong><span>{t.note}</span><small>{t.at}</small>
      </article>)}
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

function AddPersonModal({ onClose, onAdd }: { onClose: () => void; onAdd: (name: string, latin: string) => void }) {
  const [name, setName] = useState(''); const [latin, setLatin] = useState('');
  return <Backdrop onClose={onClose} sheet><button className="modal-close" onClick={onClose}><Icon name="close" /></button><h2>زیادکردنی قەرزدار</h2>
    <input className="field" autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="ناوی قەرزدار" />
    <input className="field" value={latin} onChange={e => setLatin(e.target.value)} placeholder="ناو بە لاتینی" dir="ltr" />
    <button className="outline-wide" disabled={!name.trim()} onClick={() => onAdd(name.trim(), latin.trim())}>زیادکردن</button>
  </Backdrop>;
}

function TransactionModal({ name, onClose, onAdd }: { name: string; onClose: () => void; onAdd: (amount: number, kind: 'debt' | 'credit', note: string) => void }) {
  const [amount, setAmount] = useState(''); const [note, setNote] = useState(''); const [kind, setKind] = useState<'debt' | 'credit'>('debt');
  return <Backdrop onClose={onClose} sheet><button className="modal-close" onClick={onClose}><Icon name="close" /></button><h2>{name}</h2>
    <div className="segment"><button className={kind === 'debt' ? 'active' : ''} onClick={() => setKind('debt')}>قەرز</button><button className={kind === 'credit' ? 'active green-bg' : ''} onClick={() => setKind('credit')}>گەڕاندنەوە</button></div>
    <input className="field" inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value.replace(/\D/g, ''))} placeholder="بڕی پارە بە دینار" />
    <textarea className="field" value={note} onChange={e => setNote(e.target.value)} placeholder="تێبینی" />
    <button className="outline-wide" disabled={!Number(amount)} onClick={() => onAdd(Number(amount), kind, note)}>تۆمارکردن</button>
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
