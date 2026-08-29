import { useState } from 'react';

function HabitItem({ habit, isCompletedToday, streak, onToggleComplete, onEdit, onDelete, theme = 'light' }) {
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
      className={`p-6 glass neon-border rounded-xl shadow-xl transition-all duration-300 mb-4 ${
        theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
      } ${
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
            className={`w-full p-3 mb-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 ${
              theme === 'dark' 
                ? 'bg-slate-700 text-slate-100 border-slate-600' 
                : 'bg-slate-100 text-slate-900 border-slate-300'
            }`}
            required
          />

          {/* Description input */}
          <input
            type="text"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            className={`w-full p-3 mb-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 ${
              theme === 'dark' 
                ? 'bg-slate-700 text-slate-100 border-slate-600' 
                : 'bg-slate-100 text-slate-900 border-slate-300'
            }`}
            placeholder="Description"
          />

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-lg transition w-full sm:w-auto"
            >
              ✓ Save
            </button>

            <button
              type="button"
              onClick={handleEditCancel}
              className="bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg transition w-full sm:w-auto"
            >
              ✕ Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Left side */}
            <div className="flex items-center flex-1 min-w-0">
              {/* Completion button */}
              <button
                onClick={() => onToggleComplete(habit.id)}
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-2xl transition-all duration-300 mr-4 ${
                  isCompletedToday
                    ? 'bg-emerald-500 border-emerald-500 text-white scale-110 shadow-lg'
                    : `border-${theme === 'dark' ? 'slate-600' : 'slate-400'} ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'} hover:border-sky-400 hover:scale-105`
                }`}
              >
                {isCompletedToday ? '✓' : habit.icon || '○'}
              </button>

              {/* Name + Description */}
              <div className="flex-1">
                <h3
                  className={`text-lg font-semibold ${
                    isCompletedToday
                      ? `${theme === 'dark' ? 'line-through text-slate-500' : 'line-through text-slate-500'}`
                      : `${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`
                  }`}
                >
                  {habit.name}
                </h3>

                {habit.description && (
                  <p
                    className={`text-sm ${
                      isCompletedToday 
                        ? 'text-slate-500' 
                        : `${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`
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
            <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
              <button
                onClick={() => setIsEditing(true)}
                className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-2 sm:px-3 rounded-lg text-xs sm:text-sm transition flex-1 sm:flex-none"
                title="Edit habit"
              >
                <span className="hidden sm:inline">✏️ Edit</span>
                <span className="sm:hidden">✏️</span>
              </button>

              <button
                onClick={() => onDelete(habit.id)}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-2 sm:px-3 rounded-lg text-xs sm:text-sm transition flex-1 sm:flex-none"
                title="Delete habit"
              >
                <span className="hidden sm:inline">🗑️ Delete</span>
                <span className="sm:hidden">🗑️</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default HabitItem;
