import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

const WEEK_DAYS  = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const BOOKING_CLASS_ICON = {
  'General Workout': '🏋️', 'Yoga': '🧘', 'Zumba': '💃', 'Cardio': '🏃', 'Strength Training': '💪',
};

function fmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function slotBadge(booked, max) {
  if (max === 0) return 'bg-green-100 text-green-700 border border-green-200';
  const pct = booked / max;
  if (pct >= 1)   return 'bg-red-100 text-red-600 border border-red-200';
  if (pct >= 0.7) return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
  return 'bg-green-100 text-green-700 border border-green-200';
}

function StatCard({ icon, label, value, color, to }) {
  return (
    <Link to={to} className={`bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-300 transition group`}>
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-2xl mb-4`}>
        {icon}
      </div>
      <p className="text-3xl font-bold text-gray-900 group-hover:text-orange-600 transition">{value}</p>
      <p className="text-gray-500 text-sm mt-1">{label}</p>
    </Link>
  );
}

function QuickAction({ icon, label, desc, to, color }) {
  return (
    <Link
      to={to}
      className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:border-orange-300 hover:bg-gray-100 transition"
    >
      <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center text-xl flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-900 text-sm font-medium">{label}</p>
        <p className="text-gray-500 text-xs">{desc}</p>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { settings } = useSettings();

  const todayName = WEEK_DAYS[new Date().getDay()];
  const todayHours = settings.workingHours[todayName];
  const isOpenNow = (() => {
    if (!todayHours?.open) return false;
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const [oh, om] = todayHours.openTime.split(':').map(Number);
    const [ch, cm] = todayHours.closeTime.split(':').map(Number);
    return nowMins >= oh * 60 + om && nowMins < ch * 60 + cm;
  })();

  const stats = useMemo(() => {
    const workouts = JSON.parse(localStorage.getItem('gym_workouts') || '[]');
    const members = JSON.parse(localStorage.getItem('gym_members') || '[]');
    const meals = JSON.parse(localStorage.getItem('gym_meals') || '[]');
    const payments = JSON.parse(localStorage.getItem('gym_payments') || '[]');

    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.slice(0, 7);

    const todayCalories = meals
      .filter(m => m.date === today)
      .reduce((sum, m) => sum + Number(m.calories || 0), 0);

    const monthRevenue = payments
      .filter(p => p.isPaid && p.paymentDate?.slice(0, 7) === thisMonth)
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const equip = JSON.parse(localStorage.getItem('gym_equipment') || '[]');
    const equipAlerts = equip.filter(e => {
      if (!e.nextMaintenanceDate) return false;
      return Math.ceil((new Date(e.nextMaintenanceDate) - new Date()) / 86400000) <= 7;
    }).length;

    const gymSlots    = JSON.parse(localStorage.getItem('gym_slots')    || '[]');
    const gymBookings = JSON.parse(localStorage.getItem('gym_bookings') || '[]');
    const todaySlots  = gymSlots.filter(s => s.date === today);
    const todayBookingsCount = gymBookings.filter(
      b => b.status === 'active' && todaySlots.some(s => s.id === b.slotId)
    ).length;

    return {
      totalWorkouts: workouts.length,
      totalMembers:  members.length,
      todayCalories,
      monthRevenue,
      equipTotal:    equip.length,
      equipWorking:  equip.filter(e => e.status === 'Working').length,
      equipMaint:    equip.filter(e => e.status === 'Under Maintenance').length,
      equipOut:      equip.filter(e => e.status === 'Out of Order').length,
      equipAlerts,
      todayClasses:  todaySlots.length,
      todayBookingsCount,
    };
  }, []);

  const todaySchedule = useMemo(() => {
    const today    = new Date().toISOString().split('T')[0];
    const slots    = JSON.parse(localStorage.getItem('gym_slots')    || '[]');
    const bookings = JSON.parse(localStorage.getItem('gym_bookings') || '[]');
    return slots
      .filter(s => s.date === today)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .map(s => ({
        ...s,
        bookedCount: bookings.filter(b => b.slotId === s.id && b.status === 'active').length,
      }));
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const recentWorkouts = useMemo(() => {
    const workouts = JSON.parse(localStorage.getItem('gym_workouts') || '[]');
    return workouts.slice(-3).reverse();
  }, []);

  const recentMembers = useMemo(() => {
    const members = JSON.parse(localStorage.getItem('gym_members') || '[]');
    return members.slice(-4).reverse();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 md:p-8">
        <p className="text-orange-100 text-sm font-medium mb-1">{greeting()},</p>
        <h1 className="text-gray-900 text-3xl font-bold">{user?.name} 👋</h1>
        <p className="text-orange-100 mt-2 text-sm">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🏋️" label="Total Workouts" value={stats.totalWorkouts} color="bg-blue-100" to="/workouts" />
        <StatCard icon="👥" label="Total Members" value={stats.totalMembers} color="bg-green-100" to="/members" />
        <StatCard icon="🔥" label="Today's Calories" value={`${stats.todayCalories} kcal`} color="bg-orange-100" to="/diet" />
        <StatCard icon="💰" label="Revenue This Month" value={`$${stats.monthRevenue.toFixed(2)}`} color="bg-emerald-100" to="/payments" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h2 className="text-gray-900 font-semibold text-lg">Quick Actions</h2>
          <div className="grid gap-3">
            <QuickAction icon="➕" label="Log Workout" desc="Track your session" to="/workouts" color="bg-blue-100" />
            <QuickAction icon="👤" label="Add Member" desc="Register new member" to="/members" color="bg-green-100" />
            <QuickAction icon="🥗" label="Log Meal" desc="Track your nutrition" to="/diet" color="bg-yellow-100" />
            <QuickAction icon="💳" label="Record Payment" desc="Log member payments" to="/payments" color="bg-emerald-100" />
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-gray-900 font-semibold text-lg">Recent Workouts</h2>
          {recentWorkouts.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-gray-500 text-sm">
              No workouts logged yet.{' '}
              <Link to="/workouts" className="text-orange-600 hover:underline">Add one!</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentWorkouts.map(w => (
                <div key={w.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-gray-900 text-sm font-medium">{w.exercise}</p>
                    <p className="text-gray-500 text-xs">{w.sets} sets × {w.reps} reps · {w.weight}kg</p>
                  </div>
                  <span className="text-gray-600 text-xs">{w.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Working Hours */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-gray-900 font-semibold text-lg">Working Hours</h2>
          <Link to="/settings" className="text-gray-500 hover:text-orange-600 text-xs transition">Edit →</Link>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          {/* Today status banner */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
            <div>
              <p className="text-gray-500 text-xs mb-0.5">Today · {todayName}</p>
              <p className="text-gray-900 font-semibold">
                {todayHours?.open
                  ? `${todayHours.openTime} – ${todayHours.closeTime}`
                  : 'Closed Today'}
              </p>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              isOpenNow
                ? 'bg-green-100 text-green-700 border-green-200'
                : 'bg-gray-100 text-gray-500 border-gray-300'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOpenNow ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
              {isOpenNow ? 'Open Now' : 'Closed Now'}
            </span>
          </div>
          {/* Week grid */}
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {DAYS_ORDER.map(day => {
              const h = settings.workingHours[day];
              const isToday = day === todayName;
              return (
                <div
                  key={day}
                  className={`rounded-xl p-2.5 text-center border ${
                    isToday
                      ? 'bg-orange-50 border-orange-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <p className={`text-xs font-semibold mb-1.5 ${isToday ? 'text-orange-600' : 'text-gray-500'}`}>
                    {day.slice(0, 3)}
                  </p>
                  {h?.open ? (
                    <>
                      <p className="text-gray-900 text-xs leading-tight">{h.openTime}</p>
                      <p className="text-gray-500 text-xs leading-tight">{h.closeTime}</p>
                    </>
                  ) : (
                    <p className="text-gray-700 text-xs">Closed</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Equipment Status */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-gray-900 font-semibold text-lg">Equipment</h2>
          <Link to="/equipment" className="text-gray-500 hover:text-orange-600 text-xs transition">View all →</Link>
        </div>
        {stats.equipTotal === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-5 text-center text-gray-500 text-sm">
            No equipment added.{' '}
            <Link to="/equipment" className="text-orange-600 hover:underline">Add some!</Link>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-700">{stats.equipWorking}</p>
                <p className="text-gray-500 text-xs mt-0.5">Working</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-700">{stats.equipMaint}</p>
                <p className="text-gray-500 text-xs mt-0.5">Maintenance</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{stats.equipOut}</p>
                <p className="text-gray-500 text-xs mt-0.5">Out of Order</p>
              </div>
            </div>
            {stats.equipAlerts > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2.5 flex items-center gap-2 text-xs">
                <span>⚠️</span>
                <span className="text-yellow-700 font-medium">
                  {stats.equipAlerts} item{stats.equipAlerts !== 1 ? 's' : ''} due for maintenance
                </span>
                <Link to="/equipment" className="ml-auto text-yellow-300 hover:text-yellow-200 font-medium whitespace-nowrap">
                  View →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Today's Classes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-gray-900 font-semibold text-lg">Today's Classes</h2>
            {stats.todayBookingsCount > 0 && (
              <p className="text-gray-500 text-xs mt-0.5">{stats.todayBookingsCount} booking{stats.todayBookingsCount !== 1 ? 's' : ''} today</p>
            )}
          </div>
          <Link to="/bookings" className="text-gray-500 hover:text-orange-600 text-xs transition">View all →</Link>
        </div>
        {todaySchedule.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-5 text-center text-gray-500 text-sm">
            No classes scheduled today.{' '}
            <Link to="/bookings" className="text-orange-600 hover:underline">Add a class!</Link>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100">
            {todaySchedule.map(s => (
              <div key={s.id} className="flex items-center gap-4 px-5 py-3">
                <p className="text-gray-500 text-xs w-20 flex-shrink-0">{fmtTime(s.startTime)}</p>
                <span className="text-lg flex-shrink-0">{BOOKING_CLASS_ICON[s.className] || '📅'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 text-sm font-medium truncate">{s.className}</p>
                  <p className="text-gray-500 text-xs truncate">{s.trainerName}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${slotBadge(s.bookedCount, s.maxCapacity)}`}>
                  {s.bookedCount}/{s.maxCapacity}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {recentMembers.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-gray-900 font-semibold text-lg">Recent Members</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {recentMembers.map(m => (
              <div key={m.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-gray-900 font-bold mb-3">
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <p className="text-gray-900 text-sm font-medium truncate">{m.name}</p>
                <p className="text-gray-500 text-xs mt-0.5">{m.membershipType}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
