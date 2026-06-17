import { useState, useEffect, useMemo } from 'react';

const CATEGORIES       = ['Cardio', 'Strength', 'Flexibility', 'Accessories'];
const MAINTENANCE_TYPES = ['Routine Check', 'Repair', 'Replacement'];
const STATUSES         = ['Working', 'Under Maintenance', 'Out of Order'];
const FILTER_TABS      = ['All', ...CATEGORIES];

const CATEGORY_ICON = {
  Cardio: '🏃', Strength: '💪', Flexibility: '🤸', Accessories: '🎯',
};
const CATEGORY_COLOR = {
  Cardio:       'bg-blue-500/20 text-blue-400',
  Strength:     'bg-orange-500/20 text-orange-400',
  Flexibility:  'bg-purple-500/20 text-purple-400',
  Accessories:  'bg-teal-500/20 text-teal-400',
};
const STATUS_STYLE = {
  'Working':           { badge: 'bg-green-500/15 text-green-400 border border-green-500/30',   dot: 'bg-green-400'  },
  'Under Maintenance': { badge: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30', dot: 'bg-yellow-400' },
  'Out of Order':      { badge: 'bg-red-500/15 text-red-400 border border-red-500/30',          dot: 'bg-red-400'    },
};
const TYPE_COLOR = {
  'Routine Check': 'bg-blue-500/15 text-blue-400',
  'Repair':        'bg-red-500/15 text-red-400',
  'Replacement':   'bg-purple-500/15 text-purple-400',
};
const NEXT_DAYS = { 'Routine Check': 30, 'Repair': 7, 'Replacement': 90 };

const todayStr = () => new Date().toISOString().split('T')[0];

function maintAlert(equip) {
  if (!equip.nextMaintenanceDate) return 'none';
  const days = Math.ceil((new Date(equip.nextMaintenanceDate) - new Date()) / 86400000);
  if (days < 0)  return 'overdue';
  if (days <= 7) return 'soon';
  return 'ok';
}

function lastMaintDate(equip) {
  if (!equip.maintenanceRecords?.length) return null;
  return [...equip.maintenanceRecords].map(r => r.date).sort().at(-1);
}

// ── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE['Working'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

// ── Add Equipment Modal ───────────────────────────────────────────────────────

function AddEquipmentModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    name: '', category: 'Cardio', brand: '',
    purchaseDate: todayStr(), purchasePrice: '',
    status: 'Working', nextMaintenanceDate: '',
  });
  const [errors, setErrors] = useState({});

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name = 'Required';
    if (!form.brand.trim()) e.brand = 'Required';
    if (!form.purchaseDate) e.purchaseDate = 'Required';
    if (form.purchasePrice === '' || Number(form.purchasePrice) < 0) e.purchasePrice = 'Enter a valid price';
    return e;
  };

  const submit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({ id: Date.now().toString(), ...form, purchasePrice: Number(form.purchasePrice), maintenanceRecords: [] });
    onClose();
  };

  const cls = (k) =>
    `w-full bg-gray-800 border rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm ${errors[k] ? 'border-red-500' : 'border-gray-700'}`;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-bold text-lg">Add Equipment</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">✕</button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Equipment Name</label>
            <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="e.g. Treadmill Pro 3000" className={cls('name')} />
            {errors.name && <p className="text-red-400 text-xs mt-0.5">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className={cls('category')}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Brand</label>
              <input type="text" value={form.brand} onChange={e => set('brand', e.target.value)}
                placeholder="e.g. Life Fitness" className={cls('brand')} />
              {errors.brand && <p className="text-red-400 text-xs mt-0.5">{errors.brand}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Purchase Date</label>
              <input type="date" value={form.purchaseDate} onChange={e => set('purchaseDate', e.target.value)} className={cls('purchaseDate')} />
              {errors.purchaseDate && <p className="text-red-400 text-xs mt-0.5">{errors.purchaseDate}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Purchase Price ($)</label>
              <input type="number" min="0" step="0.01" value={form.purchasePrice}
                onChange={e => set('purchasePrice', e.target.value)} placeholder="0.00" className={cls('purchasePrice')} />
              {errors.purchasePrice && <p className="text-red-400 text-xs mt-0.5">{errors.purchasePrice}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Initial Status</label>
            <div className="flex gap-2">
              {STATUSES.map(s => (
                <button key={s} type="button" onClick={() => set('status', s)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition ${
                    form.status === s ? STATUS_STYLE[s].badge : 'border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-300'
                  }`}>
                  {s === 'Under Maintenance' ? 'Maint.' : s.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Next Maintenance Date <span className="text-gray-600 font-normal">(optional)</span>
            </label>
            <input type="date" value={form.nextMaintenanceDate} onChange={e => set('nextMaintenanceDate', e.target.value)}
              className={cls('nextMaintenanceDate')} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-lg text-sm transition">Cancel</button>
            <button type="submit"
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-lg text-sm transition">Add Equipment</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Log Maintenance Modal ─────────────────────────────────────────────────────

function LogMaintenanceModal({ equipment, onClose, onSave }) {
  const [type, setType]       = useState('Routine Check');
  const [date, setDate]       = useState(todayStr());
  const [cost, setCost]       = useState('');
  const [notes, setNotes]     = useState('');
  const [costErr, setCostErr] = useState('');

  const suggestNext = (t, d) => {
    const base = new Date(d || new Date());
    base.setDate(base.getDate() + (NEXT_DAYS[t] || 30));
    return base.toISOString().split('T')[0];
  };

  const [nextDate, setNextDate] = useState(() => suggestNext('Routine Check', todayStr()));

  const handleType = (t) => { setType(t); setNextDate(suggestNext(t, date)); };
  const handleDate = (d) => { setDate(d); setNextDate(suggestNext(type, d)); };

  const submit = (e) => {
    e.preventDefault();
    if (cost === '' || Number(cost) < 0) { setCostErr('Enter a valid cost'); return; }
    onSave({
      record: { id: Date.now().toString(), date, type, cost: Number(cost), notes },
      nextMaintenanceDate: nextDate,
    });
    onClose();
  };

  const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-white font-bold text-lg">Log Maintenance</h2>
            <p className="text-gray-500 text-xs mt-0.5">{equipment.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">✕</button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
            <div className="flex gap-2">
              {MAINTENANCE_TYPES.map(t => (
                <button key={t} type="button" onClick={() => handleType(t)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition ${
                    type === t
                      ? 'bg-orange-500/20 text-orange-400 border-orange-500/50'
                      : 'border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-300'
                  }`}>{t}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
              <input type="date" value={date} onChange={e => handleDate(e.target.value)} className={inputCls} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Cost ($)</label>
              <input type="number" min="0" step="0.01" value={cost}
                onChange={e => { setCost(e.target.value); setCostErr(''); }}
                placeholder="0.00"
                className={`${inputCls} ${costErr ? 'border-red-500' : ''}`} />
              {costErr && <p className="text-red-400 text-xs mt-0.5">{costErr}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Notes <span className="text-gray-600 font-normal">(optional)</span>
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="What was done, parts replaced, observations..."
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Schedule Next Maintenance</label>
            <input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)} className={inputCls} />
            <p className="text-gray-600 text-xs mt-1">Auto-suggested based on type · adjust as needed</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-lg text-sm transition">Cancel</button>
            <button type="submit"
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-lg text-sm transition">Save Record</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Maintenance History Modal ─────────────────────────────────────────────────

function HistoryModal({ equipment, onClose }) {
  const records   = [...(equipment.maintenanceRecords || [])].sort((a, b) => b.date.localeCompare(a.date));
  const totalCost = records.reduce((s, r) => s + Number(r.cost || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-white font-bold text-lg">{equipment.name}</h2>
            <p className="text-gray-500 text-xs mt-0.5">
              {records.length} record{records.length !== 1 ? 's' : ''} · ${totalCost.toFixed(2)} total spent
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl flex-shrink-0">✕</button>
        </div>

        {records.length === 0 ? (
          <div className="text-center py-12 flex-1">
            <div className="text-4xl mb-2">🔧</div>
            <p className="text-gray-500 text-sm">No maintenance records yet</p>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 space-y-3 pr-1">
            {records.map(r => (
              <div key={r.id} className="bg-gray-800 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLOR[r.type] || 'bg-gray-700 text-gray-300'}`}>
                        {r.type}
                      </span>
                      <span className="text-gray-500 text-xs">{r.date}</span>
                    </div>
                    {r.notes && <p className="text-gray-400 text-xs leading-relaxed break-words">{r.notes}</p>}
                  </div>
                  <span className="text-white font-semibold text-sm flex-shrink-0">${Number(r.cost).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={onClose}
          className="mt-4 w-full bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-xl text-sm transition">
          Close
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function EquipmentManagement() {
  const [equipment, setEquipment] = useState([]);
  const [showAdd, setShowAdd]     = useState(false);
  const [logTarget, setLogTarget] = useState(null);
  const [histTarget, setHistTarget] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch]       = useState('');
  const [view, setView]           = useState('grid');

  useEffect(() => {
    setEquipment(JSON.parse(localStorage.getItem('gym_equipment') || '[]'));
  }, []);

  const persist = (list) => {
    setEquipment(list);
    localStorage.setItem('gym_equipment', JSON.stringify(list));
  };

  const addEquipment    = (item) => persist([item, ...equipment]);
  const deleteEquipment = (id)   => persist(equipment.filter(e => e.id !== id));
  const updateStatus    = (id, st) => persist(equipment.map(e => e.id === id ? { ...e, status: st } : e));
  const logMaintenance  = (id, data) => persist(equipment.map(e =>
    e.id === id ? {
      ...e,
      maintenanceRecords: [...(e.maintenanceRecords || []), data.record],
      nextMaintenanceDate: data.nextMaintenanceDate || e.nextMaintenanceDate,
    } : e
  ));

  const enriched = useMemo(() => equipment.map(e => ({
    ...e,
    lastMaint: lastMaintDate(e),
    alert: maintAlert(e),
  })), [equipment]);

  const alertItems = useMemo(() =>
    enriched.filter(e => e.alert === 'overdue' || e.alert === 'soon'),
  [enriched]);

  const stats = useMemo(() => ({
    total:      enriched.length,
    working:    enriched.filter(e => e.status === 'Working').length,
    maintenance: enriched.filter(e => e.status === 'Under Maintenance').length,
    outOfOrder: enriched.filter(e => e.status === 'Out of Order').length,
    totalValue: enriched.reduce((s, e) => s + Number(e.purchasePrice || 0), 0),
    maintCost:  enriched.flatMap(e => e.maintenanceRecords || []).reduce((s, r) => s + Number(r.cost || 0), 0),
  }), [enriched]);

  const filtered = useMemo(() => enriched.filter(e => {
    const matchTab    = activeTab === 'All' || e.category === activeTab;
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
                        e.brand.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  }), [enriched, activeTab, search]);

  const liveEquip = (id) => equipment.find(e => e.id === id);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Equipment Management</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {stats.total} items · ${stats.totalValue.toLocaleString()} total value
          </p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 transition">
          + Add Equipment
        </button>
      </div>

      {/* Maintenance alert banner */}
      {alertItems.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4">
          <div className="flex items-start gap-3 mb-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-yellow-400 font-semibold text-sm">
                {alertItems.length} item{alertItems.length !== 1 ? 's' : ''} need maintenance attention
              </p>
              <p className="text-yellow-400/60 text-xs mt-0.5">
                {alertItems.filter(e => e.alert === 'overdue').length} overdue ·{' '}
                {alertItems.filter(e => e.alert === 'soon').length} due within 7 days
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {alertItems.map(e => {
              const days = Math.ceil((new Date(e.nextMaintenanceDate) - new Date()) / 86400000);
              return (
                <div key={e.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${
                  e.alert === 'overdue'
                    ? 'bg-red-500/10 border-red-500/20 text-red-300'
                    : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300'
                }`}>
                  <span>{CATEGORY_ICON[e.category]}</span>
                  <span className="font-medium">{e.name}</span>
                  <span className={e.alert === 'overdue' ? 'text-red-400' : 'text-yellow-500'}>
                    {e.alert === 'overdue' ? `${Math.abs(days)}d overdue` : `due in ${days}d`}
                  </span>
                  <button onClick={() => setLogTarget(e)}
                    className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 px-2 py-0.5 rounded-md transition">
                    Log
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: '🏋️', label: 'Total Equipment',  value: stats.total,                          color: 'bg-blue-500/20'   },
          { icon: '✅', label: 'Working',           value: stats.working,                        color: 'bg-green-500/20'  },
          { icon: '⚠️', label: 'Needs Attention',  value: stats.maintenance + stats.outOfOrder,  color: 'bg-yellow-500/20' },
          { icon: '🔧', label: 'Maintenance Cost', value: `$${stats.maintCost.toFixed(2)}`,     color: 'bg-orange-500/20' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className={`w-10 h-10 ${s.color} rounded-lg flex items-center justify-center text-xl mb-3`}>{s.icon}</div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters + search */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 flex-wrap">
          {FILTER_TABS.map(tab => {
            const cnt = tab === 'All' ? enriched.length : enriched.filter(e => e.category === tab).length;
            return (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1 ${
                  activeTab === tab ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
                }`}>
                {tab !== 'All' && <span>{CATEGORY_ICON[tab]}</span>}
                {tab}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab ? 'bg-orange-400/30' : 'bg-gray-800'}`}>{cnt}</span>
              </button>
            );
          })}
        </div>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or brand..."
          className="flex-1 min-w-48 bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" />
        <div className="flex gap-2">
          {['grid', 'table'].map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-4 py-2 rounded-xl text-sm capitalize transition ${
                view === v ? 'bg-orange-500 text-white' : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'
              }`}>{v}</button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl text-center py-16 text-gray-500">
          <div className="text-4xl mb-3">🏋️</div>
          <p className="text-sm">{search || activeTab !== 'All' ? 'No matching equipment' : 'No equipment added yet'}</p>
          {!search && activeTab === 'All' && (
            <button onClick={() => setShowAdd(true)} className="text-orange-400 text-sm mt-2 hover:underline">
              Add your first item
            </button>
          )}
        </div>
      )}

      {/* Grid view */}
      {filtered.length > 0 && view === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(e => {
            const days        = e.nextMaintenanceDate ? Math.ceil((new Date(e.nextMaintenanceDate) - new Date()) / 86400000) : null;
            const records     = e.maintenanceRecords || [];
            const maintTotal  = records.reduce((s, r) => s + Number(r.cost || 0), 0);
            const catBg       = CATEGORY_COLOR[e.category]?.split(' ')[0] || 'bg-gray-700';

            return (
              <div key={e.id} className={`bg-gray-900 rounded-2xl p-5 border transition ${
                e.alert === 'overdue' ? 'border-red-500/40' :
                e.alert === 'soon'   ? 'border-yellow-500/40' :
                                       'border-gray-800 hover:border-gray-700'
              }`}>
                {/* Top row */}
                <div className="flex items-start gap-2.5 mb-3">
                  <div className={`w-10 h-10 ${catBg} rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>
                    {CATEGORY_ICON[e.category]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-semibold text-sm truncate">{e.name}</p>
                    <p className="text-gray-500 text-xs truncate">{e.brand}</p>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLOR[e.category]}`}>{e.category}</span>
                  <StatusBadge status={e.status} />
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-xs mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Purchase price</span>
                    <span className="text-white font-medium">${Number(e.purchasePrice).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Purchased</span>
                    <span className="text-gray-400">{e.purchaseDate}</span>
                  </div>
                  {e.lastMaint && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Last maintenance</span>
                      <span className="text-gray-400">{e.lastMaint}</span>
                    </div>
                  )}
                  {e.nextMaintenanceDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Next due</span>
                      <span className={
                        e.alert === 'overdue' ? 'text-red-400 font-semibold' :
                        e.alert === 'soon'    ? 'text-yellow-400 font-semibold' :
                                               'text-gray-400'
                      }>
                        {e.nextMaintenanceDate}
                        {e.alert === 'overdue' && ` (${Math.abs(days)}d overdue)`}
                        {e.alert === 'soon'    && ` (${days}d)`}
                      </span>
                    </div>
                  )}
                  {records.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Maint. cost total</span>
                      <span className="text-gray-400">${maintTotal.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Status selector */}
                <div className="flex gap-1 mb-3">
                  {STATUSES.map(s => (
                    <button key={s} onClick={() => updateStatus(e.id, s)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition ${
                        e.status === s
                          ? STATUS_STYLE[s].badge
                          : 'border-gray-700 text-gray-600 hover:text-gray-400 hover:border-gray-600'
                      }`}>
                      {s === 'Under Maintenance' ? 'Maint.' : s.split(' ')[0]}
                    </button>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button onClick={() => setLogTarget(e)}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white py-2 rounded-lg text-xs font-medium transition">
                    🔧 Log Maintenance
                  </button>
                  {records.length > 0 && (
                    <button onClick={() => setHistTarget(e)}
                      className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-500 hover:text-white px-3 py-2 rounded-lg text-xs transition"
                      title="View history">📋</button>
                  )}
                  <button onClick={() => deleteEquipment(e.id)}
                    className="bg-gray-800 hover:bg-red-500/10 border border-gray-700 hover:border-red-500/30 text-gray-600 hover:text-red-400 px-3 py-2 rounded-lg text-xs transition"
                    title="Delete">🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table view */}
      {filtered.length > 0 && view === 'table' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-left border-b border-gray-800">
                  <th className="px-4 py-3 font-medium">Equipment</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">Category</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">Brand</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Last Maint.</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Next Due</th>
                  <th className="px-4 py-3 font-medium hidden lg:table-cell">Price</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map(e => (
                  <tr key={e.id} className={`transition ${
                    e.alert === 'overdue' ? 'bg-red-500/5 hover:bg-red-500/10' :
                    e.alert === 'soon'    ? 'bg-yellow-500/5 hover:bg-yellow-500/10' :
                                           'hover:bg-gray-800/50'
                  }`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{CATEGORY_ICON[e.category]}</span>
                        <span className="text-white font-medium">{e.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLOR[e.category]}`}>{e.category}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">{e.brand}</td>
                    <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">{e.lastMaint || '—'}</td>
                    <td className={`px-4 py-3 text-xs font-medium hidden md:table-cell ${
                      e.alert === 'overdue' ? 'text-red-400' :
                      e.alert === 'soon'    ? 'text-yellow-400' :
                                             'text-gray-400'
                    }`}>
                      {e.nextMaintenanceDate
                        ? `${e.nextMaintenanceDate}${e.alert === 'overdue' ? ' ⚠️' : e.alert === 'soon' ? ' 🔔' : ''}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-300 hidden lg:table-cell">
                      ${Number(e.purchasePrice).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setLogTarget(e)}
                          className="text-gray-500 hover:text-orange-400 bg-gray-800 border border-gray-700 hover:border-orange-500/30 px-2 py-1 rounded-lg text-xs transition">🔧</button>
                        {(e.maintenanceRecords || []).length > 0 && (
                          <button onClick={() => setHistTarget(e)}
                            className="text-gray-500 hover:text-blue-400 bg-gray-800 border border-gray-700 px-2 py-1 rounded-lg text-xs transition">📋</button>
                        )}
                        <button onClick={() => deleteEquipment(e.id)}
                          className="text-gray-600 hover:text-red-400 text-lg transition">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAdd && (
        <AddEquipmentModal onClose={() => setShowAdd(false)} onSave={addEquipment} />
      )}
      {logTarget && (
        <LogMaintenanceModal
          equipment={logTarget}
          onClose={() => setLogTarget(null)}
          onSave={(data) => { logMaintenance(logTarget.id, data); setLogTarget(null); }}
        />
      )}
      {histTarget && (
        <HistoryModal
          equipment={liveEquip(histTarget.id) || histTarget}
          onClose={() => setHistTarget(null)}
        />
      )}
    </div>
  );
}
