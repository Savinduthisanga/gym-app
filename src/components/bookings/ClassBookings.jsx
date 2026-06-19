import { useState, useEffect, useMemo } from 'react';

// ── Constants ─────────────────────────────────────────────────────────────────

const CLASS_TYPES = ['General Workout', 'Yoga', 'Zumba', 'Cardio', 'Strength Training'];

const CLASS_ICON = {
  'General Workout':  '🏋️',
  'Yoga':             '🧘',
  'Zumba':            '💃',
  'Cardio':           '🏃',
  'Strength Training': '💪',
};

const CLASS_COLOR = {
  'General Workout':  'bg-blue-100 text-blue-700',
  'Yoga':             'bg-purple-100 text-purple-700',
  'Zumba':            'bg-pink-100 text-pink-700',
  'Cardio':           'bg-orange-100 text-orange-600',
  'Strength Training': 'bg-red-100 text-red-600',
};

const DATE_FILTERS = ['Upcoming', 'Today', 'Tomorrow', 'This Week', 'All'];

// ── Helpers ───────────────────────────────────────────────────────────────────

const todayStr = () => new Date().toISOString().split('T')[0];

function addDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function slotStatus(booked, max) {
  if (max === 0) return { label: 'Available', pct: 0, badge: 'bg-green-100 text-green-700 border border-green-200', bar: 'bg-green-500' };
  const pct = booked / max;
  if (pct >= 1)   return { label: 'Full',        pct: 1,   badge: 'bg-red-100 text-red-600 border border-red-200',           bar: 'bg-red-500'    };
  if (pct >= 0.7) return { label: 'Almost Full', pct,      badge: 'bg-yellow-100 text-yellow-700 border border-yellow-200',   bar: 'bg-yellow-400' };
  return              { label: 'Available',   pct,      badge: 'bg-green-100 text-green-700 border border-green-200',   bar: 'bg-green-500'  };
}

function fmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function fmtDate(d) {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// ── Add Slot Modal ────────────────────────────────────────────────────────────

function AddSlotModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    className: 'General Workout', trainerName: '',
    date: todayStr(), startTime: '', endTime: '', maxCapacity: '10',
  });
  const [errors, setErrors] = useState({});

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.trainerName.trim())  e.trainerName = 'Required';
    if (!form.date)                e.date = 'Required';
    if (!form.startTime)           e.startTime = 'Required';
    if (!form.endTime)             e.endTime = 'Required';
    else if (form.endTime <= form.startTime) e.endTime = 'Must be after start time';
    if (!form.maxCapacity || Number(form.maxCapacity) < 1) e.maxCapacity = 'Min 1';
    return e;
  };

  const submit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({ id: Date.now().toString(), ...form, maxCapacity: Number(form.maxCapacity) });
    onClose();
  };

  const cls = (k) =>
    `w-full bg-gray-100 border rounded-lg px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm ${errors[k] ? 'border-red-500' : 'border-gray-300'}`;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-gray-900 font-bold text-lg">Create Class Slot</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 text-xl">✕</button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* Class type */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Class Type</label>
            <div className="grid grid-cols-2 gap-2">
              {CLASS_TYPES.map(t => (
                <button key={t} type="button" onClick={() => set('className', t)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition ${
                    form.className === t
                      ? `${CLASS_COLOR[t]} border-current`
                      : 'border-gray-300 text-gray-500 hover:border-gray-300 hover:text-gray-600'
                  }`}>
                  <span>{CLASS_ICON[t]}</span>{t}
                </button>
              ))}
            </div>
          </div>

          {/* Trainer */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Trainer Name</label>
            <input type="text" value={form.trainerName} onChange={e => set('trainerName', e.target.value)}
              placeholder="e.g. Sarah Johnson" className={cls('trainerName')} />
            {errors.trainerName && <p className="text-red-600 text-xs mt-0.5">{errors.trainerName}</p>}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Date</label>
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className={cls('date')} />
            {errors.date && <p className="text-red-600 text-xs mt-0.5">{errors.date}</p>}
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Start Time</label>
              <input type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)} className={cls('startTime')} />
              {errors.startTime && <p className="text-red-600 text-xs mt-0.5">{errors.startTime}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">End Time</label>
              <input type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)} className={cls('endTime')} />
              {errors.endTime && <p className="text-red-600 text-xs mt-0.5">{errors.endTime}</p>}
            </div>
          </div>

          {/* Capacity */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Max Capacity</label>
            <input type="number" min="1" max="200" value={form.maxCapacity}
              onChange={e => set('maxCapacity', e.target.value)} className={cls('maxCapacity')} />
            {errors.maxCapacity && <p className="text-red-600 text-xs mt-0.5">{errors.maxCapacity}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-2.5 rounded-lg text-sm transition">Cancel</button>
            <button type="submit"
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-lg text-sm transition">Create Slot</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Manage Bookings Modal ─────────────────────────────────────────────────────

function ManageBookingsModal({ slot, bookings, members, onClose, onAddBooking, onCancelBooking }) {
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [bookErr, setBookErr] = useState('');

  const activeBookings = bookings.filter(b => b.slotId === slot.id && b.status === 'active');
  const status = slotStatus(activeBookings.length, slot.maxCapacity);

  const unbookedMembers = members.filter(m => !activeBookings.some(b => b.memberEmail === m.email));

  const handleBook = () => {
    if (!selectedMemberId) { setBookErr('Select a member'); return; }
    if (status.label === 'Full') { setBookErr('Slot is full'); return; }
    const member = members.find(m => m.id === selectedMemberId);
    if (!member) return;
    onAddBooking(slot.id, member);
    setSelectedMemberId('');
    setBookErr('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-lg max-h-[85vh] flex flex-col">
        {/* Slot header */}
        <div className="flex items-start justify-between mb-4 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{CLASS_ICON[slot.className]}</span>
              <h2 className="text-gray-900 font-bold text-lg">{slot.className}</h2>
            </div>
            <p className="text-gray-500 text-xs">
              {fmtDate(slot.date)} · {fmtTime(slot.startTime)} – {fmtTime(slot.endTime)} · {slot.trainerName}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 text-xl flex-shrink-0">✕</button>
        </div>

        {/* Capacity bar */}
        <div className="flex-shrink-0 mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-gray-500 text-xs">{activeBookings.length} / {slot.maxCapacity} spots filled</span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${status.badge}`}>{status.label}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full ${status.bar} rounded-full transition-all`}
              style={{ width: `${Math.min(status.pct * 100, 100)}%` }} />
          </div>
        </div>

        {/* Bookings list */}
        <div className="flex-1 overflow-y-auto min-h-0 space-y-2 mb-4">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">
            Active Bookings ({activeBookings.length})
          </p>
          {activeBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-600 text-sm">No bookings yet for this slot</div>
          ) : (
            activeBookings.map(b => (
              <div key={b.id} className="flex items-center justify-between bg-gray-100 rounded-xl px-4 py-3 gap-3">
                <div className="min-w-0">
                  <p className="text-gray-900 text-sm font-medium truncate">{b.memberName}</p>
                  <p className="text-gray-500 text-xs truncate">{b.memberEmail}</p>
                </div>
                <button onClick={() => onCancelBooking(b.id)}
                  className="flex-shrink-0 text-gray-600 hover:text-red-600 text-xs bg-gray-200 hover:bg-red-50 border border-gray-300 hover:border-red-200 px-2.5 py-1 rounded-lg transition">
                  Cancel
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add booking */}
        <div className="flex-shrink-0 border-t border-gray-200 pt-4">
          {status.label === 'Full' ? (
            <p className="text-center text-red-600 text-sm py-1">This slot is at full capacity</p>
          ) : members.length === 0 ? (
            <p className="text-center text-gray-600 text-sm py-1">No members found — add members first</p>
          ) : unbookedMembers.length === 0 ? (
            <p className="text-center text-gray-600 text-sm py-1">All members have already booked this slot</p>
          ) : (
            <>
              <p className="text-gray-500 text-xs font-medium mb-2">Book a Member</p>
              <div className="flex gap-2">
                <select value={selectedMemberId} onChange={e => { setSelectedMemberId(e.target.value); setBookErr(''); }}
                  className="flex-1 bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm">
                  <option value="">Select member...</option>
                  {unbookedMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <button onClick={handleBook}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                  Book
                </button>
              </div>
              {bookErr && <p className="text-red-600 text-xs mt-1">{bookErr}</p>}
            </>
          )}
        </div>

        <button onClick={onClose}
          className="mt-4 flex-shrink-0 w-full bg-gray-100 hover:bg-gray-200 text-gray-600 py-2.5 rounded-xl text-sm transition">
          Close
        </button>
      </div>
    </div>
  );
}

// ── Slot Card ─────────────────────────────────────────────────────────────────

function SlotCard({ slot, bookedCount, onManage, onDelete }) {
  const today    = todayStr();
  const status   = slotStatus(bookedCount, slot.maxCapacity);
  const isPast   = slot.date < today;
  const isToday  = slot.date === today;
  const catBg    = CLASS_COLOR[slot.className]?.split(' ')[0] || 'bg-gray-200';

  return (
    <div className={`bg-white rounded-2xl p-5 border transition ${
      isPast                     ? 'border-gray-200 opacity-60' :
      status.label === 'Full'        ? 'border-red-200' :
      status.label === 'Almost Full' ? 'border-yellow-200' :
                                       'border-gray-200 hover:border-gray-300'
    }`}>
      {/* Top row */}
      <div className="flex items-start gap-2.5 mb-3">
        <div className={`w-10 h-10 ${catBg} rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>
          {CLASS_ICON[slot.className]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-gray-900 font-semibold text-sm truncate">{slot.className}</p>
          <p className="text-gray-500 text-xs truncate">{slot.trainerName}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isToday && !isPast && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 font-medium">Today</span>
          )}
          {isPast && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Past</span>}
          <button onClick={onDelete} className="text-gray-700 hover:text-red-600 transition text-lg" title="Delete slot">🗑️</button>
        </div>
      </div>

      {/* Date + time */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
        <span>📅 {fmtDate(slot.date)}</span>
        <span>⏰ {fmtTime(slot.startTime)} – {fmtTime(slot.endTime)}</span>
      </div>

      {/* Capacity */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-500">{bookedCount} / {slot.maxCapacity} spots</span>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${status.badge}`}>{status.label}</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full ${status.bar} rounded-full transition-all`}
            style={{ width: `${Math.min(status.pct * 100, 100)}%` }} />
        </div>
      </div>

      <button onClick={onManage}
        className="w-full bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-600 hover:text-gray-900 py-2 rounded-xl text-xs font-medium transition">
        Manage Bookings ({bookedCount})
      </button>
    </div>
  );
}

// ── Member View ───────────────────────────────────────────────────────────────

function MemberView({ slots, bookings, members, onBook, onCancel }) {
  const [selectedId, setSelectedId] = useState('');
  const today = todayStr();

  const member = members.find(m => m.id === selectedId);

  const upcomingBookings = useMemo(() => {
    if (!member) return [];
    return bookings
      .filter(b => b.memberEmail === member.email && b.status === 'active')
      .map(b => ({ ...b, slot: slots.find(s => s.id === b.slotId) }))
      .filter(b => b.slot && b.slot.date >= today)
      .sort((a, b) => a.slot.date.localeCompare(b.slot.date) || a.slot.startTime.localeCompare(b.slot.startTime));
  }, [member, bookings, slots, today]);

  const availableSlots = useMemo(() => {
    if (!member) return [];
    return slots.filter(s => {
      if (s.date < today) return false;
      const active = bookings.filter(b => b.slotId === s.id && b.status === 'active');
      return !active.some(b => b.memberEmail === member.email) && active.length < s.maxCapacity;
    }).sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  }, [member, bookings, slots, today]);

  return (
    <div className="space-y-6">
      {/* Member picker */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <label className="block text-sm font-medium text-gray-600 mb-2">Select Member</label>
        {members.length === 0 ? (
          <p className="text-gray-600 text-sm">No members found — add members in Member Management first.</p>
        ) : (
          <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
            className="w-full bg-gray-100 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm">
            <option value="">Choose a member to view their bookings...</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name} — {m.membershipType}</option>
            ))}
          </select>
        )}
      </div>

      {member && (
        <>
          {/* Upcoming bookings */}
          <div className="space-y-3">
            <h3 className="text-gray-900 font-semibold text-base">
              {member.name}'s Upcoming Bookings
              <span className="text-gray-500 font-normal text-sm ml-2">({upcomingBookings.length})</span>
            </h3>
            {upcomingBookings.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-5 text-center text-gray-500 text-sm">
                No upcoming bookings
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingBookings.map(b => {
                  const bookedCnt = bookings.filter(x => x.slotId === b.slot.id && x.status === 'active').length;
                  const st = slotStatus(bookedCnt, b.slot.maxCapacity);
                  return (
                    <div key={b.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3">
                      <span className="text-xl flex-shrink-0">{CLASS_ICON[b.slot.className]}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 text-sm font-medium">{b.slot.className}</p>
                        <p className="text-gray-500 text-xs">
                          {fmtDate(b.slot.date)} · {fmtTime(b.slot.startTime)} – {fmtTime(b.slot.endTime)} · {b.slot.trainerName}
                        </p>
                      </div>
                      {b.slot.date === today && (
                        <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full flex-shrink-0">Today</span>
                      )}
                      <button onClick={() => onCancel(b.id)}
                        className="flex-shrink-0 text-gray-600 hover:text-red-600 text-xs bg-gray-100 border border-gray-300 hover:border-red-200 px-2.5 py-1 rounded-lg transition">
                        Cancel
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Available slots */}
          <div className="space-y-3">
            <h3 className="text-gray-900 font-semibold text-base">
              Available Slots to Book
              <span className="text-gray-500 font-normal text-sm ml-2">({availableSlots.length})</span>
            </h3>
            {availableSlots.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-5 text-center text-gray-500 text-sm">
                No available slots (all booked or slot is full)
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableSlots.map(s => {
                  const active = bookings.filter(b => b.slotId === s.id && b.status === 'active');
                  const st = slotStatus(active.length, s.maxCapacity);
                  const catBg = CLASS_COLOR[s.className]?.split(' ')[0] || 'bg-gray-200';
                  return (
                    <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className={`w-9 h-9 ${catBg} rounded-lg flex items-center justify-center text-lg flex-shrink-0`}>
                          {CLASS_ICON[s.className]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 text-sm font-medium truncate">{s.className}</p>
                          <p className="text-gray-500 text-xs">{s.trainerName}</p>
                        </div>
                        {s.date === today && (
                          <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded-full flex-shrink-0">Today</span>
                        )}
                      </div>
                      <p className="text-gray-500 text-xs mb-3">
                        {fmtDate(s.date)} · {fmtTime(s.startTime)} – {fmtTime(s.endTime)}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.badge}`}>
                          {active.length}/{s.maxCapacity} · {st.label}
                        </span>
                        <button onClick={() => onBook(s.id, member)}
                          className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition">
                          Book
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ClassBookings() {
  const [slots, setSlots]         = useState([]);
  const [bookings, setBookings]   = useState([]);
  const [members, setMembers]     = useState([]);
  const [showAdd, setShowAdd]     = useState(false);
  const [managingSlot, setManagingSlot] = useState(null);
  const [activeTab, setActiveTab] = useState('admin');
  const [dateFilter, setDateFilter] = useState('Upcoming');
  const [search, setSearch]       = useState('');

  useEffect(() => {
    setSlots(JSON.parse(localStorage.getItem('gym_slots') || '[]'));
    setBookings(JSON.parse(localStorage.getItem('gym_bookings') || '[]'));
    setMembers(JSON.parse(localStorage.getItem('gym_members') || '[]'));
  }, []);

  const persistSlots    = (list) => { setSlots(list);    localStorage.setItem('gym_slots',    JSON.stringify(list)); };
  const persistBookings = (list) => { setBookings(list); localStorage.setItem('gym_bookings', JSON.stringify(list)); };

  const addSlot = (slot) => persistSlots([...slots, slot]);

  const deleteSlot = (id) => {
    persistSlots(slots.filter(s => s.id !== id));
    persistBookings(bookings.map(b => b.slotId === id ? { ...b, status: 'cancelled' } : b));
  };

  const addBooking = (slotId, member) => {
    persistBookings([...bookings, {
      id: Date.now().toString(),
      slotId,
      memberName:  member.name,
      memberEmail: member.email,
      bookedAt:    new Date().toISOString(),
      status:      'active',
    }]);
  };

  const cancelBooking = (id) =>
    persistBookings(bookings.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));

  const getBookedCount = (slotId) =>
    bookings.filter(b => b.slotId === slotId && b.status === 'active').length;

  const today = todayStr();

  const filtered = useMemo(() => {
    let r = [...slots];
    if      (dateFilter === 'Today')     r = r.filter(s => s.date === today);
    else if (dateFilter === 'Tomorrow')  r = r.filter(s => s.date === addDays(1));
    else if (dateFilter === 'This Week') { const end = addDays(7); r = r.filter(s => s.date >= today && s.date <= end); }
    else if (dateFilter === 'Upcoming')  r = r.filter(s => s.date >= today);
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(s => s.className.toLowerCase().includes(q) || s.trainerName.toLowerCase().includes(q));
    }
    return r.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  }, [slots, dateFilter, search, today]);

  const stats = useMemo(() => {
    const todaySlots     = slots.filter(s => s.date === today);
    const todayBookings  = bookings.filter(b => b.status === 'active' && todaySlots.some(s => s.id === b.slotId)).length;
    const totalActive    = bookings.filter(b => b.status === 'active').length;
    return { todayClasses: todaySlots.length, todayBookings, totalActive };
  }, [slots, bookings, today]);

  const liveManagingSlot = managingSlot ? slots.find(s => s.id === managingSlot.id) : null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Class Bookings</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {slots.length} class slots · {stats.totalActive} active bookings
          </p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 transition">
          + Add Class
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: '📅', label: "Today's Classes",  value: stats.todayClasses,  color: 'bg-blue-100'   },
          { icon: '👥', label: "Today's Bookings", value: stats.todayBookings, color: 'bg-green-100'  },
          { icon: '📋', label: 'Total Bookings',   value: stats.totalActive,   color: 'bg-orange-100' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className={`w-10 h-10 ${s.color} rounded-lg flex items-center justify-center text-xl mb-3`}>{s.icon}</div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* View tabs */}
      <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit">
        {[{ key: 'admin', label: 'Admin View' }, { key: 'member', label: 'Member View' }].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === t.key ? 'bg-orange-500 text-white' : 'text-gray-500 hover:text-gray-900'
            }`}>{t.label}</button>
        ))}
      </div>

      {activeTab === 'admin' ? (
        <>
          {/* Date filters + search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 flex-wrap">
              {DATE_FILTERS.map(f => (
                <button key={f} onClick={() => setDateFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    dateFilter === f ? 'bg-orange-500 text-white' : 'text-gray-500 hover:text-gray-900'
                  }`}>{f}</button>
              ))}
            </div>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search class or trainer..."
              className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" />
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            {[
              { dot: 'bg-green-500',  label: 'Available (< 70% full)' },
              { dot: 'bg-yellow-400', label: 'Almost Full (≥ 70%)' },
              { dot: 'bg-red-500',    label: 'Full' },
            ].map(l => (
              <span key={l.label} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${l.dot}`} />
                {l.label}
              </span>
            ))}
          </div>

          {/* Slot grid */}
          {filtered.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl text-center py-16 text-gray-500">
              <div className="text-4xl mb-3">📅</div>
              <p className="text-sm">{search ? 'No matching classes found' : `No class slots for "${dateFilter}"`}</p>
              {!search && (
                <button onClick={() => setShowAdd(true)} className="text-orange-600 text-sm mt-2 hover:underline">
                  Create your first class
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(slot => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  bookedCount={getBookedCount(slot.id)}
                  onManage={() => setManagingSlot(slot)}
                  onDelete={() => deleteSlot(slot.id)}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <MemberView
          slots={slots}
          bookings={bookings}
          members={members}
          onBook={addBooking}
          onCancel={cancelBooking}
        />
      )}

      {/* Modals */}
      {showAdd && (
        <AddSlotModal onClose={() => setShowAdd(false)} onSave={addSlot} />
      )}
      {managingSlot && liveManagingSlot && (
        <ManageBookingsModal
          slot={liveManagingSlot}
          bookings={bookings}
          members={members}
          onClose={() => setManagingSlot(null)}
          onAddBooking={addBooking}
          onCancelBooking={cancelBooking}
        />
      )}
    </div>
  );
}
