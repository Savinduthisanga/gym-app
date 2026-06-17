import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function StatCard({ icon, label, value, color, to }) {
  return (
    <Link to={to} className={`bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition group`}>
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-2xl mb-4`}>
        {icon}
      </div>
      <p className="text-3xl font-bold text-white group-hover:text-orange-400 transition">{value}</p>
      <p className="text-gray-400 text-sm mt-1">{label}</p>
    </Link>
  );
}

function QuickAction({ icon, label, desc, to, color }) {
  return (
    <Link
      to={to}
      className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4 hover:border-orange-500/50 hover:bg-gray-800 transition"
    >
      <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center text-xl flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-white text-sm font-medium">{label}</p>
        <p className="text-gray-500 text-xs">{desc}</p>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

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

    return {
      totalWorkouts: workouts.length,
      totalMembers: members.length,
      todayCalories,
      monthRevenue,
    };
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
        <h1 className="text-white text-3xl font-bold">{user?.name} 👋</h1>
        <p className="text-orange-100 mt-2 text-sm">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🏋️" label="Total Workouts" value={stats.totalWorkouts} color="bg-blue-500/20" to="/workouts" />
        <StatCard icon="👥" label="Total Members" value={stats.totalMembers} color="bg-green-500/20" to="/members" />
        <StatCard icon="🔥" label="Today's Calories" value={`${stats.todayCalories} kcal`} color="bg-orange-500/20" to="/diet" />
        <StatCard icon="💰" label="Revenue This Month" value={`$${stats.monthRevenue.toFixed(2)}`} color="bg-emerald-500/20" to="/payments" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h2 className="text-white font-semibold text-lg">Quick Actions</h2>
          <div className="grid gap-3">
            <QuickAction icon="➕" label="Log Workout" desc="Track your session" to="/workouts" color="bg-blue-500/20" />
            <QuickAction icon="👤" label="Add Member" desc="Register new member" to="/members" color="bg-green-500/20" />
            <QuickAction icon="🥗" label="Log Meal" desc="Track your nutrition" to="/diet" color="bg-yellow-500/20" />
            <QuickAction icon="💳" label="Record Payment" desc="Log member payments" to="/payments" color="bg-emerald-500/20" />
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-white font-semibold text-lg">Recent Workouts</h2>
          {recentWorkouts.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center text-gray-500 text-sm">
              No workouts logged yet.{' '}
              <Link to="/workouts" className="text-orange-400 hover:underline">Add one!</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentWorkouts.map(w => (
                <div key={w.id} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">{w.exercise}</p>
                    <p className="text-gray-500 text-xs">{w.sets} sets × {w.reps} reps · {w.weight}kg</p>
                  </div>
                  <span className="text-gray-600 text-xs">{w.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {recentMembers.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-white font-semibold text-lg">Recent Members</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {recentMembers.map(m => (
              <div key={m.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold mb-3">
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <p className="text-white text-sm font-medium truncate">{m.name}</p>
                <p className="text-gray-500 text-xs mt-0.5">{m.membershipType}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
