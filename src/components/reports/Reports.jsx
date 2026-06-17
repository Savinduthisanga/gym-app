import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line,
  PieChart, Pie, Legend,
  AreaChart, Area,
} from 'recharts';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getLast12Months() {
  const now = new Date();
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    months.push({ key, label });
  }
  return months;
}

const CURRENT_MONTH = (() => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
})();

const METHOD_COLORS = { Cash: '#22c55e', Card: '#3b82f6', 'Bank Transfer': '#a855f7' };
const METHOD_ICONS  = { Cash: '💵', Card: '💳', 'Bank Transfer': '🏦' };

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

function RevenueTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm shadow-xl">
      <p className="text-gray-400 mb-2 font-medium">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} className="font-bold" style={{ color: p.color }}>
          ${Number(p.value).toFixed(2)}
        </p>
      ))}
    </div>
  );
}

function MemberTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm shadow-xl">
      <p className="text-gray-400 mb-2 font-medium">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm shadow-xl">
      <p className="font-medium mb-1" style={{ color: p.payload.fill }}>{p.name}</p>
      <p className="text-white font-bold">${Number(p.value).toFixed(2)}</p>
      <p className="text-gray-400 text-xs">{(p.payload.percent * 100).toFixed(1)}% of total</p>
    </div>
  );
}

// ─── Shared chart axis styles ────────────────────────────────────────────────

const AXIS_STYLE = { fill: '#6b7280', fontSize: 11 };
const GRID_STYLE = { stroke: '#1f2937', strokeDasharray: '3 3' };

// ─── Section card wrapper ────────────────────────────────────────────────────

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="mb-5">
        <h2 className="text-white font-semibold text-base">{title}</h2>
        {subtitle && <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// ─── Stat card ───────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, iconBg }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center text-xl mb-4`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-white leading-tight">{value}</p>
      <p className="text-gray-400 text-sm mt-1">{label}</p>
      {sub && <p className="text-gray-600 text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function Empty({ icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-gray-600">
      <span className="text-3xl mb-2">{icon}</span>
      <p className="text-sm">{text}</p>
    </div>
  );
}

// ─── Custom pie label ────────────────────────────────────────────────────────

function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.05) return null;
  const RAD = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RAD);
  const y = cy + r * Math.sin(-midAngle * RAD);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      fontSize={12} fontWeight="700">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function Reports() {
  const months = useMemo(() => getLast12Months(), []);

  // ── Revenue by month ────────────────────────────────────────────────────────
  const revenueData = useMemo(() => {
    const payments = JSON.parse(localStorage.getItem('gym_payments') || '[]');
    return months.map(({ key, label }) => ({
      month: label,
      key,
      revenue: payments
        .filter(p => p.isPaid && p.paymentDate?.slice(0, 7) === key)
        .reduce((s, p) => s + Number(p.amount || 0), 0),
      isCurrent: key === CURRENT_MONTH,
    }));
  }, [months]);

  // ── Member growth ───────────────────────────────────────────────────────────
  const memberData = useMemo(() => {
    const members = JSON.parse(localStorage.getItem('gym_members') || '[]');
    const windowStart = months[0].key;
    let cumulative = members.filter(m => (m.joinDate || '') < windowStart + '-32').length;
    // Subtract those in the window — we'll add them back month by month
    const inWindow = members.filter(m => (m.joinDate || '') >= windowStart).length;
    cumulative -= inWindow;

    return months.map(({ key, label }) => {
      const added = members.filter(m => m.joinDate?.slice(0, 7) === key).length;
      cumulative += added;
      return { month: label, 'New Members': added, 'Total Members': cumulative };
    });
  }, [months]);

  // ── Payment method breakdown ────────────────────────────────────────────────
  const methodData = useMemo(() => {
    const payments = JSON.parse(localStorage.getItem('gym_payments') || '[]');
    const paid = payments.filter(p => p.isPaid);
    return ['Cash', 'Card', 'Bank Transfer']
      .map(name => ({
        name,
        value: paid.filter(p => p.paymentMethod === name).reduce((s, p) => s + Number(p.amount || 0), 0),
        fill: METHOD_COLORS[name],
      }))
      .filter(m => m.value > 0);
  }, []);

  // ── Key stats ───────────────────────────────────────────────────────────────
  const keyStats = useMemo(() => {
    const payments = JSON.parse(localStorage.getItem('gym_payments') || '[]');
    const members  = JSON.parse(localStorage.getItem('gym_members') || '[]');
    const workouts = JSON.parse(localStorage.getItem('gym_workouts') || '[]');

    const totalRevenue = payments.filter(p => p.isPaid).reduce((s, p) => s + Number(p.amount || 0), 0);
    const totalMembers = members.length;
    const avgRevenue   = totalMembers > 0 ? totalRevenue / totalMembers : 0;
    const overdueCount = payments.filter(p => !p.isPaid && p.dueDate < CURRENT_MONTH + '-32').length;

    const typeCounts = members.reduce((acc, m) => {
      acc[m.membershipType] = (acc[m.membershipType] || 0) + 1;
      return acc;
    }, {});
    const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];

    const thisMonthRevenue = payments
      .filter(p => p.isPaid && p.paymentDate?.slice(0, 7) === CURRENT_MONTH)
      .reduce((s, p) => s + Number(p.amount || 0), 0);

    return {
      totalRevenue, totalMembers, avgRevenue, overdueCount,
      topType: topType ? `${topType[0]} (${topType[1]})` : 'N/A',
      totalWorkouts: workouts.length,
      thisMonthRevenue,
    };
  }, []);

  // ── Membership type distribution (for mini bar chart) ──────────────────────
  const membershipDist = useMemo(() => {
    const members = JSON.parse(localStorage.getItem('gym_members') || '[]');
    const counts  = { Basic: 0, Standard: 0, Premium: 0, VIP: 0 };
    members.forEach(m => { if (counts[m.membershipType] !== undefined) counts[m.membershipType]++; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, []);

  const TYPE_COLORS = { Basic: '#6b7280', Standard: '#3b82f6', Premium: '#a855f7', VIP: '#f97316' };

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          Insights calculated from your stored data · {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="💰" iconBg="bg-orange-500/20"
          label="Total Revenue" value={`$${keyStats.totalRevenue.toFixed(2)}`}
          sub={`$${keyStats.thisMonthRevenue.toFixed(2)} this month`}
        />
        <StatCard
          icon="👥" iconBg="bg-green-500/20"
          label="Total Members" value={keyStats.totalMembers}
          sub={`Most popular: ${keyStats.topType}`}
        />
        <StatCard
          icon="📈" iconBg="bg-blue-500/20"
          label="Avg Revenue / Member" value={`$${keyStats.avgRevenue.toFixed(2)}`}
          sub="All-time"
        />
        <StatCard
          icon="🏋️" iconBg="bg-purple-500/20"
          label="Total Workouts" value={keyStats.totalWorkouts}
          sub={keyStats.overdueCount > 0 ? `⚠️ ${keyStats.overdueCount} overdue payments` : 'No overdue payments'}
        />
      </div>

      {/* Revenue bar chart */}
      <ChartCard
        title="Monthly Revenue"
        subtitle="Total revenue collected per month (last 12 months) · current month highlighted"
      >
        {revenueData.every(d => d.revenue === 0) ? (
          <Empty icon="💰" text="No payment data yet" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid {...GRID_STYLE} vertical={false} />
              <XAxis dataKey="month" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
              <YAxis
                tick={AXIS_STYLE}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `$${v}`}
                width={54}
              />
              <Tooltip content={<RevenueTooltip />} cursor={{ fill: 'rgba(249,115,22,0.08)' }} />
              <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                {revenueData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.isCurrent ? '#f97316' : '#374151'}
                    stroke={entry.isCurrent ? '#fb923c' : 'transparent'}
                    strokeWidth={1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-3 rounded-sm bg-orange-500 inline-block" /> Current month
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-3 rounded-sm bg-gray-700 inline-block" /> Past months
          </div>
        </div>
      </ChartCard>

      {/* Member growth area chart */}
      <ChartCard
        title="Member Growth"
        subtitle="New members joined and cumulative total (last 12 months)"
      >
        {keyStats.totalMembers === 0 ? (
          <Empty icon="👥" text="No member data yet" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={memberData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="newGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...GRID_STYLE} vertical={false} />
              <XAxis dataKey="month" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} width={34} allowDecimals={false} />
              <Tooltip content={<MemberTooltip />} cursor={{ stroke: '#374151', strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="Total Members"
                stroke="#f97316"
                strokeWidth={2}
                fill="url(#totalGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#f97316', stroke: '#1f2937', strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="New Members"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#newGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#3b82f6', stroke: '#1f2937', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-0.5 bg-orange-500 inline-block" /> Total Members
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-0.5 bg-blue-500 inline-block" /> New Members
          </div>
        </div>
      </ChartCard>

      {/* Bottom row: Pie + membership dist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Payment method pie */}
        <ChartCard
          title="Payment Method Breakdown"
          subtitle="Revenue share by payment method (paid only)"
        >
          {methodData.length === 0 ? (
            <Empty icon="💳" text="No payment data yet" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={methodData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    labelLine={false}
                    label={PieLabel}
                  >
                    {methodData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 mt-2">
                {methodData.map(m => {
                  const total = methodData.reduce((s, x) => s + x.value, 0);
                  const pct   = total > 0 ? ((m.value / total) * 100).toFixed(1) : 0;
                  return (
                    <div key={m.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: m.fill }} />
                        <span className="text-gray-400">{METHOD_ICONS[m.name]} {m.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-white font-semibold text-sm">${m.value.toFixed(2)}</span>
                        <span className="text-gray-600 text-xs ml-1.5">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </ChartCard>

        {/* Membership type distribution */}
        <ChartCard
          title="Membership Type Distribution"
          subtitle="Number of members per plan"
        >
          {keyStats.totalMembers === 0 ? (
            <Empty icon="🏅" text="No member data yet" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={membershipDist}
                  layout="vertical"
                  margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid {...GRID_STYLE} horizontal={false} />
                  <XAxis type="number" tick={AXIS_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={AXIS_STYLE} axisLine={false} tickLine={false} width={60} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                    content={({ active, payload, label }) =>
                      active && payload?.length ? (
                        <div className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm">
                          <p className="text-gray-400">{label}</p>
                          <p className="text-white font-bold">{payload[0].value} member{payload[0].value !== 1 ? 's' : ''}</p>
                        </div>
                      ) : null
                    }
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {membershipDist.map((entry, i) => (
                      <Cell key={i} fill={TYPE_COLORS[entry.name]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {membershipDist.map(m => (
                  <div key={m.name} className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: TYPE_COLORS[m.name] }} />
                    {m.name}
                    <span className="text-white font-semibold ml-auto">{m.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </ChartCard>

      </div>
    </div>
  );
}
