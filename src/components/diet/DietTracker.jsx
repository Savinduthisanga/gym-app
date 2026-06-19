import { useState, useEffect, useMemo } from 'react';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Pre-Workout', 'Post-Workout'];

const INITIAL_FORM = {
  name: '',
  mealType: 'Breakfast',
  calories: '',
  protein: '',
  carbs: '',
  fat: '',
  date: new Date().toISOString().split('T')[0],
};

function Modal({ onClose, onSave }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Required';
    if (!form.calories || form.calories < 0) errs.calories = 'Required';
    if (form.protein === '' || form.protein < 0) errs.protein = 'Required';
    if (form.carbs === '' || form.carbs < 0) errs.carbs = 'Required';
    if (form.fat === '' || form.fat < 0) errs.fat = 'Required';
    if (!form.date) errs.date = 'Required';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({ ...form, id: Date.now().toString() });
    onClose();
  };

  const field = (name, label, placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
      <input
        type="number"
        value={form[name]}
        onChange={e => { setForm(p => ({ ...p, [name]: e.target.value })); setErrors(p => ({ ...p, [name]: '' })); }}
        placeholder={placeholder}
        min="0"
        className={`w-full bg-gray-100 border rounded-lg px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm ${errors[name] ? 'border-red-500' : 'border-gray-300'}`}
      />
      {errors[name] && <p className="text-red-600 text-xs mt-0.5">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-gray-900 font-bold text-lg">Log Meal</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Meal Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: '' })); }}
              placeholder="e.g. Grilled Chicken"
              className={`w-full bg-gray-100 border rounded-lg px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.name && <p className="text-red-600 text-xs mt-0.5">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Meal Type</label>
            <select
              value={form.mealType}
              onChange={e => setForm(p => ({ ...p, mealType: e.target.value }))}
              className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
            >
              {MEAL_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {field('calories', 'Calories (kcal)', '350')}
            {field('protein', 'Protein (g)', '30')}
            {field('carbs', 'Carbs (g)', '40')}
            {field('fat', 'Fat (g)', '10')}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={e => { setForm(p => ({ ...p, date: e.target.value })); setErrors(p => ({ ...p, date: '' })); }}
              className={`w-full bg-gray-100 border rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm ${errors.date ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.date && <p className="text-red-600 text-xs mt-0.5">{errors.date}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-2.5 rounded-lg text-sm transition">Cancel</button>
            <button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-lg text-sm transition">Log Meal</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const MACRO_COLORS = { protein: 'bg-blue-500', carbs: 'bg-yellow-500', fat: 'bg-red-500' };

const MEAL_TYPE_ICON = {
  Breakfast: '🌅', Lunch: '☀️', Dinner: '🌙', Snack: '🍎',
  'Pre-Workout': '⚡', 'Post-Workout': '💪',
};

export default function DietTracker() {
  const [meals, setMeals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    setMeals(JSON.parse(localStorage.getItem('gym_meals') || '[]'));
  }, []);

  const saveMeal = (meal) => {
    const updated = [meal, ...meals];
    setMeals(updated);
    localStorage.setItem('gym_meals', JSON.stringify(updated));
  };

  const removeMeal = (id) => {
    const updated = meals.filter(m => m.id !== id);
    setMeals(updated);
    localStorage.setItem('gym_meals', JSON.stringify(updated));
  };

  const todayMeals = useMemo(() => meals.filter(m => m.date === selectedDate), [meals, selectedDate]);

  const totals = useMemo(() => todayMeals.reduce(
    (acc, m) => ({
      calories: acc.calories + Number(m.calories || 0),
      protein: acc.protein + Number(m.protein || 0),
      carbs: acc.carbs + Number(m.carbs || 0),
      fat: acc.fat + Number(m.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  ), [todayMeals]);

  const CALORIE_GOAL = 2500;
  const caloriePercent = Math.min((totals.calories / CALORIE_GOAL) * 100, 100);

  const allDates = [...new Set(meals.map(m => m.date))].sort((a, b) => b.localeCompare(a));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nutrition Tracker</h1>
          <p className="text-gray-500 text-sm mt-0.5">{meals.length} meals logged total</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 transition"
        >
          <span>+</span> Log Meal
        </button>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-gray-500 text-sm">View date:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-gray-900 font-semibold">Daily Summary — {selectedDate}</h2>
          <span className={`text-sm font-bold ${caloriePercent >= 100 ? 'text-red-600' : 'text-orange-600'}`}>
            {totals.calories} / {CALORIE_GOAL} kcal
          </span>
        </div>

        <div className="w-full bg-gray-100 rounded-full h-3 mb-6">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${caloriePercent >= 100 ? 'bg-red-500' : 'bg-orange-500'}`}
            style={{ width: `${caloriePercent}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { key: 'protein', label: 'Protein', unit: 'g', color: 'text-blue-700' },
            { key: 'carbs', label: 'Carbs', unit: 'g', color: 'text-yellow-700' },
            { key: 'fat', label: 'Fat', unit: 'g', color: 'text-red-600' },
          ].map(({ key, label, unit, color }) => (
            <div key={key} className="text-center">
              <div className={`text-2xl font-bold ${color}`}>{totals[key]}<span className="text-sm ml-1">{unit}</span></div>
              <div className="text-gray-500 text-xs mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-gray-900 font-semibold text-lg">
          Meals on {selectedDate}
          {todayMeals.length > 0 && <span className="text-gray-500 font-normal text-sm ml-2">({todayMeals.length} entries)</span>}
        </h2>

        {todayMeals.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl text-center py-12 text-gray-500">
            <div className="text-4xl mb-3">🥗</div>
            <p>No meals logged for this date.</p>
            <button onClick={() => setShowModal(true)} className="text-orange-600 text-sm mt-2 hover:underline">Log a meal</button>
          </div>
        ) : (
          <div className="space-y-3">
            {todayMeals.map(m => (
              <div key={m.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4 hover:border-gray-300 transition group">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl">{MEAL_TYPE_ICON[m.mealType] || '🍽️'}</span>
                  <div className="min-w-0">
                    <p className="text-gray-900 font-medium truncate">{m.name}</p>
                    <p className="text-gray-500 text-xs">{m.mealType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 flex-shrink-0">
                  <div className="hidden sm:flex gap-4 text-xs">
                    <span className="text-blue-700"><span className="font-bold">{m.protein}g</span> protein</span>
                    <span className="text-yellow-700"><span className="font-bold">{m.carbs}g</span> carbs</span>
                    <span className="text-red-600"><span className="font-bold">{m.fat}g</span> fat</span>
                  </div>
                  <div className="text-center">
                    <p className="text-orange-600 font-bold">{m.calories}</p>
                    <p className="text-gray-600 text-xs">kcal</p>
                  </div>
                  <button onClick={() => removeMeal(m.id)} className="text-gray-700 hover:text-red-600 transition text-lg opacity-0 group-hover:opacity-100">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {allDates.length > 1 && (
        <div className="space-y-3">
          <h2 className="text-gray-900 font-semibold text-lg">History by Day</h2>
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left border-b border-gray-200">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Meals</th>
                  <th className="px-4 py-3 font-medium">Calories</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">Protein</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">Carbs</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">Fat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allDates.map(date => {
                  const dayMeals = meals.filter(m => m.date === date);
                  const cal = dayMeals.reduce((s, m) => s + Number(m.calories || 0), 0);
                  const prot = dayMeals.reduce((s, m) => s + Number(m.protein || 0), 0);
                  const carb = dayMeals.reduce((s, m) => s + Number(m.carbs || 0), 0);
                  const fat = dayMeals.reduce((s, m) => s + Number(m.fat || 0), 0);
                  return (
                    <tr
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      className={`hover:bg-gray-50 transition cursor-pointer ${date === selectedDate ? 'bg-orange-50 border-l-2 border-orange-500' : ''}`}
                    >
                      <td className="px-4 py-3 text-gray-900 font-medium">{date}</td>
                      <td className="px-4 py-3 text-gray-600">{dayMeals.length}</td>
                      <td className="px-4 py-3 text-orange-600 font-medium">{cal} kcal</td>
                      <td className="px-4 py-3 text-blue-700 hidden sm:table-cell">{prot}g</td>
                      <td className="px-4 py-3 text-yellow-700 hidden sm:table-cell">{carb}g</td>
                      <td className="px-4 py-3 text-red-600 hidden sm:table-cell">{fat}g</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && <Modal onClose={() => setShowModal(false)} onSave={saveMeal} />}
    </div>
  );
}
