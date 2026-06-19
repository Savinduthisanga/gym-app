import { useState, useEffect } from 'react';
import { useSettings } from '../../context/SettingsContext';

const MEMBERSHIP_TYPES = ['Basic', 'Standard', 'Premium', 'VIP'];

const INITIAL_FORM = {
  name: '', email: '', phone: '',
  membershipType: 'Basic',
  joinDate: new Date().toISOString().split('T')[0],
};

function Modal({ onClose, onSave }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const { settings } = useSettings();

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Required';
    if (!form.email) errs.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    if (!form.phone) errs.phone = 'Phone number is required';
    else if (!/^\d+$/.test(form.phone)) errs.phone = 'Only numeric digits allowed';
    else if (form.phone.length !== 10) errs.phone = `Must be exactly 10 digits (${form.phone.length} entered)`;
    if (!form.joinDate) errs.joinDate = 'Required';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({ ...form, id: Date.now().toString() });
    onClose();
  };

  const field = (name, label, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={form[name]}
        onChange={e => { setForm(p => ({ ...p, [name]: e.target.value })); setErrors(p => ({ ...p, [name]: '' })); }}
        placeholder={placeholder}
        className={`w-full bg-gray-100 border rounded-lg px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm ${errors[name] ? 'border-red-500' : 'border-gray-300'}`}
      />
      {errors[name] && <p className="text-red-600 text-xs mt-0.5">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-gray-900 font-bold text-lg">Add Member</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {field('name', 'Full Name', 'text', 'John Doe')}
          {field('email', 'Email', 'text', 'john@example.com')}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Phone Number</label>
            <input
              type="text"
              inputMode="numeric"
              value={form.phone}
              onChange={e => {
                const digits = e.target.value.replace(/\D/g, '');
                setForm(p => ({ ...p, phone: digits }));
                setErrors(p => ({ ...p, phone: '' }));
              }}
              placeholder="10-digit number"
              maxLength={10}
              className={`w-full bg-gray-100 border rounded-lg px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.phone
              ? <p className="text-red-600 text-xs mt-0.5">{errors.phone}</p>
              : <p className="text-gray-600 text-xs mt-0.5">{form.phone.length}/10 digits</p>
            }
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Membership Type</label>
            <select
              value={form.membershipType}
              onChange={e => setForm(p => ({ ...p, membershipType: e.target.value }))}
              className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
            >
              {MEMBERSHIP_TYPES.map(t => {
                const price = Number(settings.membershipPrices?.[t] || 0);
                return (
                  <option key={t} value={t}>
                    {t}{price > 0 ? `  —  $${price.toFixed(2)}/mo` : ''}
                  </option>
                );
              })}
            </select>
            {(() => {
              const price = Number(settings.membershipPrices?.[form.membershipType] || 0);
              return price > 0 ? (
                <p className="text-orange-600 text-xs mt-1">
                  💰 ${price.toFixed(2)} / month
                </p>
              ) : null;
            })()}
          </div>
          {field('joinDate', 'Join Date', 'date')}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-2.5 rounded-lg text-sm transition">Cancel</button>
            <button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-lg text-sm transition">Add Member</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const BADGE = {
  Basic: 'bg-gray-200 text-gray-600',
  Standard: 'bg-blue-100 text-blue-700',
  Premium: 'bg-purple-100 text-purple-700',
  VIP: 'bg-orange-100 text-orange-600',
};

const AVATAR_COLORS = [
  'from-red-400 to-red-600', 'from-blue-400 to-blue-600', 'from-green-400 to-green-600',
  'from-purple-400 to-purple-600', 'from-pink-400 to-pink-600', 'from-teal-400 to-teal-600',
];

export default function MemberManagement() {
  const [members, setMembers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [view, setView] = useState('grid');

  useEffect(() => {
    setMembers(JSON.parse(localStorage.getItem('gym_members') || '[]'));
  }, []);

  const save = (member) => {
    const updated = [member, ...members];
    setMembers(updated);
    localStorage.setItem('gym_members', JSON.stringify(updated));
  };

  const remove = (id) => {
    const updated = members.filter(m => m.id !== id);
    setMembers(updated);
    localStorage.setItem('gym_members', JSON.stringify(updated));
  };

  const filtered = members.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'All' || m.membershipType === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Member Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">{members.length} total members</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 transition"
        >
          <span>+</span> Add Member
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {['All', ...MEMBERSHIP_TYPES].map(type => {
          const count = type === 'All' ? members.length : members.filter(m => m.membershipType === type).length;
          return (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`rounded-xl p-3 text-left transition border ${filterType === type ? 'bg-orange-500 border-orange-500 text-gray-900' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}
            >
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs mt-0.5">{type}</p>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
        />
        <div className="flex gap-2">
          <button onClick={() => setView('grid')} className={`px-4 py-2.5 rounded-xl text-sm transition ${view === 'grid' ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-900'}`}>Grid</button>
          <button onClick={() => setView('table')} className={`px-4 py-2.5 rounded-xl text-sm transition ${view === 'table' ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-900'}`}>Table</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl text-center py-16 text-gray-500">
          <div className="text-4xl mb-3">👥</div>
          <p>{search || filterType !== 'All' ? 'No matching members' : 'No members yet'}</p>
          {!search && filterType === 'All' && (
            <button onClick={() => setShowModal(true)} className="text-orange-600 text-sm mt-2 hover:underline">Add your first member</button>
          )}
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((m, i) => (
            <div key={m.id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition group">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} rounded-full flex items-center justify-center text-gray-900 font-bold text-lg`}>
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <button onClick={() => remove(m.id)} className="text-gray-700 hover:text-red-600 transition opacity-0 group-hover:opacity-100 text-lg">🗑️</button>
              </div>
              <h3 className="text-gray-900 font-semibold truncate">{m.name}</h3>
              <p className="text-gray-500 text-xs truncate mt-0.5">{m.email}</p>
              <p className="text-gray-500 text-xs mt-0.5">{m.phone}</p>
              <div className="flex items-center justify-between mt-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${BADGE[m.membershipType]}`}>
                  {m.membershipType}
                </span>
                <span className="text-gray-600 text-xs">{m.joinDate}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left border-b border-gray-200">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Membership</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((m, i) => (
                  <tr key={m.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} rounded-full flex items-center justify-center text-gray-900 font-bold text-xs flex-shrink-0`}>
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-gray-900 font-medium">{m.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{m.email}</td>
                    <td className="px-4 py-3 text-gray-600">{m.phone}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${BADGE[m.membershipType]}`}>
                        {m.membershipType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{m.joinDate}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => remove(m.id)} className="text-gray-600 hover:text-red-600 transition text-lg">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && <Modal onClose={() => setShowModal(false)} onSave={save} />}
    </div>
  );
}
