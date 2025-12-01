import { useState } from 'react';

function HabitItem({ habit, isCompletedToday, streak, onToggleComplete, onEdit, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(habit.name);
  const [editDescription, setEditDescription] = useState(habit.description);

  const handleEditSubmit = (e) => {
    e.preventDefault();
    onEdit(habit.id, { name: editName.trim(), description: editDescription.trim() });
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditName(habit.name);
    setEditDescription(habit.description);
    setIsEditing(false);
  };

  return (
    <div
      className={`p-6 glass neon-border rounded-xl text-slate-100 shadow-xl transition-all duration-300 mb-4 ${
        isCompletedToday ? 'ring-2 ring-emerald-400 animate-celebrate' : ''
      }`}
    >
      {isEditing ? (
        <form onSubmit={handleEditSubmit}>
          {/* Name input */}
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="w-full p-3 mb-3 bg-slate-800/60 text-slate-100 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400"
            required
          />

          {/* Description input */}
          <input
            type="text"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            className="w-full p-3 mb-3 bg-slate-800/60 text-slate-100 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400"
            placeholder="Description"
          />

          <div className="flex space-x-3">
            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              ✓ Save
            </button>

            <button
              type="button"
              onClick={handleEditCancel}
              className="bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              ✕ Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="flex items-center justify-between">
            {/* Left side */}
            <div className="flex items-center flex-1">
              {/* Completion button */}
              <button
                onClick={() => onToggleComplete(habit.id)}
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-2xl transition-all duration-300 mr-4 ${
                  isCompletedToday
                    ? 'bg-emerald-500 border-emerald-500 text-white scale-110 shadow-lg'
                    : 'border-slate-600 text-slate-300 hover:border-sky-400 hover:scale-105'
                }`}
              >
                {isCompletedToday ? '✓' : habit.icon || '○'}
              </button>

              {/* Name + Description */}
              <div className="flex-1">
                <h3
                  className={`text-lg font-semibold ${
                    isCompletedToday
                      ? 'line-through text-slate-500'
                      : 'text-slate-200'
                  }`}
                >
                  {habit.name}
                </h3>

                {habit.description && (
                  <p
                    className={`text-sm ${
                      isCompletedToday ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    {habit.description}
                  </p>
                )}

                {/* Streak */}
                <div className="flex items-center mt-2">
                  <span className="text-sm text-slate-500 mr-2">🔥</span>
                  <span className="text-sm font-medium text-orange-400">
                    {streak} day streak
                  </span>

                  {streak >= 7 && <span className="ml-2 text-yellow-300">⭐</span>}
                  {streak >= 30 && <span className="ml-1 text-purple-300">👑</span>}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditing(true)}
                className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-3 rounded-lg text-sm transition"
              >
                ✏️ Edit
              </button>

              <button
                onClick={() => onDelete(habit.id)}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 rounded-lg text-sm transition"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default HabitItem;
