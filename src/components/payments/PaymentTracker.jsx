import { useState, useEffect, useMemo } from 'react';

const MEMBERSHIP_TYPES = ['Basic', 'Standard', 'Premium', 'VIP'];

const today = () => new Date().toISOString().split('T')[0];

function getStatus(payment) {
  if (payment.isPaid) return 'Paid';
  return payment.dueDate < today() ? 'Overdue' : 'Pending';
}

const STATUS_STYLE = {
  Paid:    { badge: 'bg-green-500/15 text-green-400 border border-green-500/30',  dot: 'bg-green-400' },
  Pending: { badge: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30', dot: 'bg-yellow-400' },
  Overdue: { badge: 'bg-red-500/15 text-red-400 border border-red-500/30',        dot: 'bg-red-400' },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

// ─── Add Payment Modal ──────────────────────────────────────────────────────

function Modal({ onClose, onSave }) {
  const members = JSON.parse(localStorage.getItem('gym_members') || '[]');

  const [form, setForm] = useState({
    memberId: '',
    memberName: '',
    amount: '',
    membershipType: 'Basic',
    paymentDate: today(),
    dueDate: '',
    isPaid: true,
  });
  const [errors, setErrors] = useState({});

  const set = (key, val) => {
    setForm(p => ({ ...p, [key]: val }));
    setErrors(p => ({ ...p, [key]: '' }));
  };

  const handleMemberSelect = (e) => {
    const id = e.target.value;
    const member = members.find(m => m.id === id);
    setForm(p => ({
      ...p,
      memberId: id,
      memberName: member?.name || '',
      membershipType: member?.membershipType || 'Basic',
    }));
    setErrors(p => ({ ...p, memberId: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.memberId) errs.memberId = 'Select a member';
    if (!form.amount || Number(form.amount) <= 0) errs.amount = 'Enter a valid amount';
    if (!form.paymentDate) errs.paymentDate = 'Required';
    if (!form.dueDate) errs.dueDate = 'Required';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({ ...form, amount: Number(form.amount), id: Date.now().toString() });
    onClose();
  };

  const inputCls = (key) =>
    `w-full bg-gray-800 border rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm ${errors[key] ? 'border-red-500' : 'border-gray-700'}`;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-bold text-lg">Record Payment</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Member select */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Member</label>
            {members.length === 0 ? (
              <p className="text-yellow-400 text-xs bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2">
                No members found. Add members first.
              </p>
            ) : (
              <select
                value={form.memberId}
                onChange={handleMemberSelect}
                className={inputCls('memberId')}
              >
                <option value="">— Select member —</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            )}
            {errors.memberId && <p className="text-red-400 text-xs mt-0.5">{errors.memberId}</p>}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Amount ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={e => set('amount', e.target.value)}
              placeholder="0.00"
              className={inputCls('amount')}
            />
            {errors.amount && <p className="text-red-400 text-xs mt-0.5">{errors.amount}</p>}
          </div>

          {/* Membership type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Membership Type</label>
            <select
              value={form.membershipType}
              onChange={e => set('membershipType', e.target.value)}
              className={inputCls('membershipType')}
            >
              {MEMBERSHIP_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Payment Date</label>
              <input
                type="date"
                value={form.paymentDate}
                onChange={e => set('paymentDate', e.target.value)}
                className={inputCls('paymentDate')}
              />
              {errors.paymentDate && <p className="text-red-400 text-xs mt-0.5">{errors.paymentDate}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Due Date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={e => set('dueDate', e.target.value)}
                className={inputCls('dueDate')}
              />
              {errors.dueDate && <p className="text-red-400 text-xs mt-0.5">{errors.dueDate}</p>}
            </div>
          </div>

          {/* Paid toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => set('isPaid', !form.isPaid)}
              className={`relative w-10 h-6 rounded-full transition-colors ${form.isPaid ? 'bg-green-500' : 'bg-gray-700'}`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.isPaid ? 'translate-x-4' : 'translate-x-0'}`}
              />
            </div>
            <span className="text-sm text-gray-300">Mark as <span className={form.isPaid ? 'text-green-400 font-medium' : 'text-yellow-400 font-medium'}>{form.isPaid ? 'Paid' : 'Pending'}</span></span>
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-lg text-sm transition">
              Cancel
            </button>
            <button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-lg text-sm transition">
              Save Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

const FILTER_TABS = ['All', 'Paid', 'Pending', 'Overdue'];

export default function PaymentTracker() {
  const [payments, setPayments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setPayments(JSON.parse(localStorage.getItem('gym_payments') || '[]'));
  }, []);

  const persist = (list) => {
    setPayments(list);
    localStorage.setItem('gym_payments', JSON.stringify(list));
  };

  const addPayment = (payment) => persist([payment, ...payments]);

  const remove = (id) => persist(payments.filter(p => p.id !== id));

  const markPaid = (id) => {
    persist(payments.map(p =>
      p.id === id ? { ...p, isPaid: true, paymentDate: today() } : p
    ));
  };

  // Derived lists
  const enriched = useMemo(() =>
    payments.map(p => ({ ...p, status: getStatus(p) })),
    [payments]
  );

  const overdue = useMemo(() => enriched.filter(p => p.status === 'Overdue'), [enriched]);

  const filtered = useMemo(() => {
    return enriched.filter(p => {
      const matchTab = activeTab === 'All' || p.status === activeTab;
      const matchSearch = p.memberName.toLowerCase().includes(search.toLowerCase());
      return matchTab && matchSearch;
    });
  }, [enriched, activeTab, search]);

  // Stats
  const stats = useMemo(() => {
    const t = today();
    const [ym, mm] = t.slice(0, 7).split('-');
    const monthRevenue = enriched
      .filter(p => p.isPaid && p.paymentDate?.slice(0, 7) === `${ym}-${mm}`)
      .reduce((s, p) => s + p.amount, 0);
    const totalRevenue = enriched.filter(p => p.isPaid).reduce((s, p) => s + p.amount, 0);
    const pending = enriched.filter(p => p.status === 'Pending').length;
    return { monthRevenue, totalRevenue, pending, overdue: overdue.length };
  }, [enriched, overdue]);

  const tabCount = (tab) => tab === 'All' ? enriched.length : enriched.filter(p => p.status === tab).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Payment Tracker</h1>
          <p className="text-gray-400 text-sm mt-0.5">{payments.length} total records</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 transition"
        >
          + Record Payment
        </button>
      </div>

      {/* Overdue alert */}
      {overdue.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-red-400 text-xl mt-0.5">⚠️</span>
            <div>
              <p className="text-red-400 font-semibold text-sm">
                {overdue.length} overdue payment{overdue.length > 1 ? 's' : ''}
              </p>
              <p className="text-red-300/70 text-xs mt-1">
                {overdue.map(p => p.memberName).join(', ')}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {overdue.map(p => (
              <div key={p.id} className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1.5">
                <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center text-red-400 text-xs font-bold">
                  {p.memberName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-red-300 text-xs font-medium">{p.memberName}</p>
                  <p className="text-red-400/60 text-xs">Due {p.dueDate} · ${p.amount.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => markPaid(p.id)}
                  className="ml-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs px-2 py-0.5 rounded-md transition"
                >
                  Mark Paid
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: '💰', label: 'This Month Revenue', value: `$${stats.monthRevenue.toFixed(2)}`, color: 'bg-green-500/20 text-green-400' },
          { icon: '📊', label: 'Total Revenue', value: `$${stats.totalRevenue.toFixed(2)}`, color: 'bg-blue-500/20 text-blue-400' },
          { icon: '⏳', label: 'Pending', value: stats.pending, color: 'bg-yellow-500/20 text-yellow-400' },
          { icon: '🚨', label: 'Overdue', value: stats.overdue, color: 'bg-red-500/20 text-red-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className={`w-10 h-10 ${s.color.split(' ')[0]} rounded-lg flex items-center justify-center text-xl mb-3`}>
              {s.icon}
            </div>
            <p className={`text-2xl font-bold ${s.color.split(' ')[1]}`}>{s.value}</p>
            <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 flex-wrap">
          {FILTER_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                activeTab === tab
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab ? 'bg-orange-400/30' : 'bg-gray-800'}`}>
                {tabCount(tab)}
              </span>
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by member name..."
          className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <div className="text-4xl mb-3">💳</div>
            <p>{search || activeTab !== 'All' ? 'No matching payments' : 'No payments recorded yet'}</p>
            {!search && activeTab === 'All' && (
              <button onClick={() => setShowModal(true)} className="text-orange-400 text-sm mt-2 hover:underline">
                Record the first payment
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-left border-b border-gray-800">
                  <th className="px-4 py-3 font-medium">Member</th>
                  <th className="px-4 py-3 font-medium">Membership</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">Payment Date</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">Due Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map(p => (
                  <tr
                    key={p.id}
                    className={`transition ${
                      p.status === 'Overdue'
                        ? 'bg-red-500/5 hover:bg-red-500/10'
                        : 'hover:bg-gray-800/50'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {p.memberName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-white font-medium">{p.memberName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{p.membershipType}</td>
                    <td className="px-4 py-3 text-white font-semibold">${Number(p.amount).toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">{p.paymentDate}</td>
                    <td className={`px-4 py-3 hidden sm:table-cell font-medium ${p.status === 'Overdue' ? 'text-red-400' : 'text-gray-400'}`}>
                      {p.dueDate}
                      {p.status === 'Overdue' && <span className="ml-1 text-xs">⚠️</span>}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {!p.isPaid && (
                          <button
                            onClick={() => markPaid(p.id)}
                            className="text-green-400 hover:text-green-300 text-xs bg-green-500/10 hover:bg-green-500/20 px-2 py-1 rounded-md transition whitespace-nowrap"
                          >
                            ✓ Paid
                          </button>
                        )}
                        <button
                          onClick={() => remove(p.id)}
                          className="text-gray-600 hover:text-red-400 transition text-base"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && <Modal onClose={() => setShowModal(false)} onSave={addPayment} />}
    </div>
  );
}
