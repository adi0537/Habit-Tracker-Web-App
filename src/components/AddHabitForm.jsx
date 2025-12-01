import { useState } from 'react';

function AddHabitForm({ onAddHabit }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onAddHabit({ name: name.trim(), description: description.trim() });
      setName('');
      setDescription('');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 p-6 glass neon-border shadow-xl transition-shadow duration-300"
    >
      <div className="flex items-center mb-4">
        <div className="text-2xl mr-3">✨</div>
        <h2 className="text-xl font-semibold text-slate-200">Add New Habit</h2>
      </div>

      <div className="mb-4">
        <label className="block text-slate-300 text-sm font-medium mb-2" htmlFor="name">
          Habit Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 bg-slate-800/60 text-slate-100 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
          placeholder="e.g., Drink water, Exercise, Read books"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-slate-300 text-sm font-medium mb-2" htmlFor="description">
          Description (optional)
        </label>
        <input
          type="text"
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-3 bg-slate-800/60 text-slate-100 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
          placeholder="e.g., 8 glasses a day, 30 minutes daily"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-gradient-to-r from-sky-500 to-purple-600 hover:from-sky-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
      >
        ➕ Add Habit
      </button>
    </form>
  );
}

export default AddHabitForm;
