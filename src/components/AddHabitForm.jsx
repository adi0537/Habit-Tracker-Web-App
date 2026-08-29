import { useState } from 'react';

function AddHabitForm({ onAddHabit, theme = 'light' }) {
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
      className={`mb-6 p-6 glass neon-border shadow-xl transition-shadow duration-300 ${
        theme === 'dark' ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-900'
      }`}
    >
      <div className="flex items-center mb-4">
        <div className="text-2xl mr-3">✨</div>
        <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>Add New Habit</h2>
      </div>

      <div className="mb-4">
        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`} htmlFor="name">
          Habit Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`w-full px-4 py-3 rounded-lg border card focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent ${
            theme === 'dark' ? 'bg-slate-700 text-slate-100 border-slate-600' : 'bg-white text-slate-900 border-slate-200'
          }`}
          placeholder="e.g., Drink water, Exercise, Read books"
          required
        />
      </div>

      <div className="mb-4">
        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`} htmlFor="description">
          Description (optional)
        </label>
        <input
          type="text"
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`w-full px-4 py-3 rounded-lg border card focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent ${
            theme === 'dark' ? 'bg-slate-700 text-slate-100 border-slate-600' : 'bg-white text-slate-900 border-slate-200'
          }`}
          placeholder="e.g., 8 glasses a day, 30 minutes daily"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-gradient-to-r from-teal-300 via-teal-600 to-sky-600 hover:from-teal-400 hover:via-teal-700 hover:to-sky-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
      >
        ➕ Add Habit
      </button>
    </form>
  );
}

export default AddHabitForm;
