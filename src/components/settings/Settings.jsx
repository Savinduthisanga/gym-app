import { useState, useRef } from 'react';
import { useSettings, DEFAULT_SETTINGS } from '../../context/SettingsContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEMBERSHIP_TYPES = ['Basic', 'Standard', 'Premium', 'VIP'];

const PRICE_COLORS = {
  Basic: 'text-gray-500', Standard: 'text-blue-700', Premium: 'text-purple-700', VIP: 'text-orange-600',
};

function SectionCard({ title, subtitle, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <div className="mb-5">
        <h2 className="text-gray-900 font-semibold text-base">{title}</h2>
        {subtitle && <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
      {children}
      {hint && <p className="text-gray-600 text-xs mt-1">{hint}</p>}
    </div>
  );
}

const INPUT_CLS = 'w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm transition';

export default function Settings() {
  const { settings, saveSettings } = useSettings();
  const [form, setForm] = useState(() => JSON.parse(JSON.stringify(settings)));
  const [saved, setSaved] = useState(false);
  const [logoError, setLogoError] = useState('');
  const fileRef = useRef(null);

  // Generic field setters
  const setField = (key, val) => setForm(p => ({ ...p, [key]: val }));
  const setPrice = (type, val) => setForm(p => ({
    ...p, membershipPrices: { ...p.membershipPrices, [type]: val },
  }));
  const setHours = (day, field, val) => setForm(p => ({
    ...p, workingHours: { ...p.workingHours, [day]: { ...p.workingHours[day], [field]: val } },
  }));

  // Logo upload
  const handleLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError('');
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('Image must be under 2 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setField('gymLogo', reader.result);
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setField('gymLogo', null);
    if (fileRef.current) fileRef.current.value = '';
  };

  // Save
  const handleSave = () => {
    saveSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    if (window.confirm('Reset all settings to defaults?')) {
      setForm(JSON.parse(JSON.stringify(DEFAULT_SETTINGS)));
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage your gym configuration</p>
        </div>
        <button
          onClick={handleReset}
          className="text-gray-500 hover:text-gray-600 text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition"
        >
          Reset defaults
        </button>
      </div>

      {/* Success toast */}
      {saved && (
        <div className="bg-green-100 border border-green-200 text-green-700 rounded-xl px-4 py-3 flex items-center gap-3 text-sm animate-pulse">
          <span className="text-lg">✅</span>
          <span className="font-medium">Settings saved successfully!</span>
        </div>
      )}

      {/* ── Gym Information ─────────────────────────────────────────────── */}
      <SectionCard title="Gym Information" subtitle="Basic details displayed throughout the app">
        {/* Logo upload */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-600 mb-2">Gym Logo</label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center flex-shrink-0 overflow-hidden bg-gray-100">
              {form.gymLogo ? (
                <img src={form.gymLogo} alt="Gym logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">🏋️</span>
              )}
            </div>
            <div className="space-y-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleLogo}
                className="hidden"
                id="logo-upload"
              />
              <label
                htmlFor="logo-upload"
                className="cursor-pointer inline-block bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-600 text-sm px-4 py-2 rounded-lg transition"
              >
                Upload Image
              </label>
              {form.gymLogo && (
                <button
                  type="button"
                  onClick={removeLogo}
                  className="block text-red-600 hover:text-red-300 text-xs transition"
                >
                  Remove logo
                </button>
              )}
              <p className="text-gray-600 text-xs">PNG, JPG, GIF · Max 2 MB</p>
              {logoError && <p className="text-red-600 text-xs">{logoError}</p>}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Field label="Gym Name">
            <input
              type="text"
              value={form.gymName}
              onChange={e => setField('gymName', e.target.value)}
              placeholder="My Gym"
              className={INPUT_CLS}
            />
          </Field>
          <Field label="Address">
            <input
              type="text"
              value={form.gymAddress}
              onChange={e => setField('gymAddress', e.target.value)}
              placeholder="123 Fitness St, City, State"
              className={INPUT_CLS}
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Phone Number">
              <input
                type="text"
                value={form.gymPhone}
                onChange={e => setField('gymPhone', e.target.value)}
                placeholder="+1 555 000 0000"
                className={INPUT_CLS}
              />
            </Field>
            <Field label="Email Address">
              <input
                type="text"
                value={form.gymEmail}
                onChange={e => setField('gymEmail', e.target.value)}
                placeholder="info@mygym.com"
                className={INPUT_CLS}
              />
            </Field>
          </div>
        </div>
      </SectionCard>

      {/* ── Membership Prices ────────────────────────────────────────────── */}
      <SectionCard
        title="Membership Prices"
        subtitle="Monthly prices shown when adding members"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {MEMBERSHIP_TYPES.map(type => (
            <div key={type} className="bg-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-sm font-semibold ${PRICE_COLORS[type]}`}>{type}</span>
                <span className="text-gray-600 text-xs">per month</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.membershipPrices[type]}
                  onChange={e => setPrice(type, e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-gray-200 border border-gray-300 rounded-lg pl-7 pr-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── Working Hours ─────────────────────────────────────────────────── */}
      <SectionCard
        title="Working Hours"
        subtitle="Set opening and closing times for each day"
      >
        <div className="space-y-2">
          {DAYS.map(day => {
            const h = form.workingHours[day];
            return (
              <div
                key={day}
                className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border transition ${
                  h.open ? 'border-gray-200 bg-gray-50' : 'border-gray-200/50 bg-gray-100/10'
                }`}
              >
                {/* Day name */}
                <span className={`w-24 text-sm font-medium flex-shrink-0 ${h.open ? 'text-gray-900' : 'text-gray-600'}`}>
                  {day.slice(0, 3)}
                  <span className="hidden sm:inline">{day.slice(3)}</span>
                </span>

                {/* Open/Closed toggle */}
                <button
                  type="button"
                  onClick={() => setHours(day, 'open', !h.open)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition flex-shrink-0 w-24 justify-center ${
                    h.open
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-gray-200 text-gray-500 border border-gray-300'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${h.open ? 'bg-green-400' : 'bg-gray-600'}`} />
                  {h.open ? 'Open' : 'Closed'}
                </button>

                {/* Time inputs */}
                <div className={`flex items-center gap-2 flex-1 transition ${!h.open ? 'opacity-30 pointer-events-none' : ''}`}>
                  <input
                    type="time"
                    value={h.openTime}
                    onChange={e => setHours(day, 'openTime', e.target.value)}
                    disabled={!h.open}
                    className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 flex-1 min-w-0"
                  />
                  <span className="text-gray-600 text-sm flex-shrink-0">—</span>
                  <input
                    type="time"
                    value={h.closeTime}
                    onChange={e => setHours(day, 'closeTime', e.target.value)}
                    disabled={!h.open}
                    className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 flex-1 min-w-0"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Save */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-6 py-4">
        <p className="text-gray-500 text-sm">Changes apply immediately after saving.</p>
        <button
          onClick={handleSave}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition flex items-center gap-2"
        >
          {saved ? '✓ Saved' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
