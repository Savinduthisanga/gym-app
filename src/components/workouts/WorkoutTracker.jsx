import { useState, useEffect } from 'react';

const INITIAL_FORM = { exercise: '', sets: '', reps: '', weight: '', date: new Date().toISOString().split('T')[0] };

function Modal({ onClose, onSave }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.exercise.trim()) errs.exercise = 'Required';
    if (!form.sets || form.sets <= 0) errs.sets = 'Required';
    if (!form.reps || form.reps <= 0) errs.reps = 'Required';
    if (!form.weight || form.weight < 0) errs.weight = 'Required';
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

  const field = (name, label, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={form[name]}
        onChange={e => { setForm(p => ({ ...p, [name]: e.target.value })); setErrors(p => ({ ...p, [name]: '' })); }}
        placeholder={placeholder}
        min={type === 'number' ? 0 : undefined}
        className={`w-full bg-gray-100 border rounded-lg px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm ${errors[name] ? 'border-red-500' : 'border-gray-300'}`}
      />
      {errors[name] && <p className="text-red-600 text-xs mt-0.5">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-gray-900 font-bold text-lg">Log Workout</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {field('exercise', 'Exercise Name', 'text', 'e.g. Bench Press')}
          <div className="grid grid-cols-3 gap-3">
            {field('sets', 'Sets', 'number', '3')}
            {field('reps', 'Reps', 'number', '10')}
            {field('weight', 'Weight (kg)', 'number', '60')}
          </div>
          {field('date', 'Date', 'date')}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-2.5 rounded-lg text-sm transition">Cancel</button>
            <button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-lg text-sm transition">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function WorkoutTracker() {
  const [workouts, setWorkouts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    setWorkouts(JSON.parse(localStorage.getItem('gym_workouts') || '[]'));
  }, []);

  const save = (workout) => {
    const updated = [workout, ...workouts];
    setWorkouts(updated);
    localStorage.setItem('gym_workouts', JSON.stringify(updated));
  };

  const remove = (id) => {
    const updated = workouts.filter(w => w.id !== id);
    setWorkouts(updated);
    localStorage.setItem('gym_workouts', JSON.stringify(updated));
  };

  const filtered = workouts.filter(w =>
    w.exercise.toLowerCase().includes(filter.toLowerCase())
  );

  const totalVolume = workouts.reduce((sum, w) => sum + (w.sets * w.reps * w.weight), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workout Tracker</h1>
          <p className="text-gray-500 text-sm mt-0.5">{workouts.length} sessions logged</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 transition"
        >
          <span>+</span> Log Workout
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Sessions', value: workouts.length, icon: '📊' },
          { label: 'Total Volume (kg)', value: totalVolume.toLocaleString(), icon: '🏋️' },
          { label: 'This Week', value: workouts.filter(w => {
            const d = new Date(w.date);
            const now = new Date();
            const weekAgo = new Date(now - 7 * 86400000);
            return d >= weekAgo;
          }).length, icon: '📅' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-gray-500 text-xs">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl">
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Search exercises..."
            className="w-full sm:w-64 bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <div className="text-4xl mb-3">🏋️</div>
            <p>{filter ? 'No matching workouts' : 'No workouts logged yet'}</p>
            {!filter && <button onClick={() => setShowModal(true)} className="text-orange-600 text-sm mt-2 hover:underline">Log your first workout</button>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left">
                  <th className="px-4 py-3 font-medium">Exercise</th>
                  <th className="px-4 py-3 font-medium">Sets</th>
                  <th className="px-4 py-3 font-medium">Reps</th>
                  <th className="px-4 py-3 font-medium">Weight</th>
                  <th className="px-4 py-3 font-medium">Volume</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(w => (
                  <tr key={w.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-gray-900 font-medium">{w.exercise}</td>
                    <td className="px-4 py-3 text-gray-600">{w.sets}</td>
                    <td className="px-4 py-3 text-gray-600">{w.reps}</td>
                    <td className="px-4 py-3 text-gray-600">{w.weight} kg</td>
                    <td className="px-4 py-3 text-orange-600 font-medium">{(w.sets * w.reps * w.weight).toLocaleString()} kg</td>
                    <td className="px-4 py-3 text-gray-500">{w.date}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => remove(w.id)}
                        className="text-gray-600 hover:text-red-600 transition text-lg"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && <Modal onClose={() => setShowModal(false)} onSave={save} />}
    </div>
  );
}
