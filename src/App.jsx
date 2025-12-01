// App.jsx (drop-in replacement)
import { useState, useEffect, useCallback } from 'react';
import useApi from './hooks/useApi';
import AddHabitForm from './components/AddHabitForm';
import HabitList from './components/HabitList';
import ProgressBar from './components/ProgressBar';
import CalendarView from './components/CalendarView';
import StatisticsDashboard from './components/StatisticsDashboard';
import DataExport from './components/DataExport';

function toLocalDateKey(d = new Date()) {
  // local yyyy-mm-dd. 'en-CA' is stable ISO-like format (YYYY-MM-DD) in the user's locale.
  try {
    if (!(d instanceof Date)) d = new Date(d);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-CA');
  } catch (e) {
    // fallback
    const dt = new Date(d);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}

function App() {
  // FORCE DARK MODE ONCE
  useEffect(() => {
    document.body.classList.add('dark');
  }, []);

  const [habits, setHabits] = useApi('habits', []);
  const [completions, setCompletions] = useApi('completions', {});

  const [activeTab, setActiveTab] = useState('habits');

  // Use local date key instead of UTC iso date
  const today = toLocalDateKey(new Date());

  const addHabit = (newHabit) => {
    const habit = {
      id: Date.now().toString(),
      ...newHabit,
      createdAt: new Date().toISOString(),
      color: getRandomColor(),
      icon: getRandomIcon(),
    };
    setHabits([...habits, habit]);
  };

  const editHabit = (id, updatedHabit) => {
    setHabits(habits.map((h) => (h.id === id ? { ...h, ...updatedHabit } : h)));
  };

  const deleteHabit = (id) => {
    setHabits(habits.filter((h) => h.id !== id));
    const newCompletions = { ...completions };
    delete newCompletions[id];
    setCompletions(newCompletions);
  };

  /**
   * toggleComplete(habitId, dateKey?)
   * - dateKey should be 'YYYY-MM-DD' local (HabitList will pass todayKey if it's updated)
   * - If not supplied, falls back to the local today
   */
  const toggleComplete = useCallback((id, dateKey) => {
    const date = dateKey ?? toLocalDateKey(new Date());
    const habitCompletions = Array.isArray(completions[id]) ? completions[id] : [];

    const isCompleted = habitCompletions.includes(date);

    if (isCompleted) {
      setCompletions({
        ...completions,
        [id]: habitCompletions.filter((d) => d !== date),
      });
    } else {
      setCompletions({
        ...completions,
        [id]: [...habitCompletions, date],
      });
    }

    // NOTE: If you have a backend, send the date key in the request body:
    // fetch('/api/habit-completions', { method: 'PUT', body: JSON.stringify({ habitId: id, date }) })
    // This ensures the server stores the local yyyy-mm-dd string and prevents UTC shifts.
  }, [completions, setCompletions]);

  const completedToday = habits.filter((habit) =>
    (Array.isArray(completions[habit.id]) ? completions[habit.id] : []).includes(today)
  ).length;

  const getMotivationalMessage = () => {
    const percentage = habits.length > 0 ? Math.round((completedToday / habits.length) * 100) : 0;
    if (percentage === 100 && habits.length > 0) return '🎉 Amazing! All habits completed today!';
    if (percentage >= 75) return '🚀 Great progress! Keep it up!';
    if (percentage >= 50) return "💪 You're doing well! Stay consistent!";
    if (percentage >= 25) return '🌟 Good start! Every step counts!';
    return '🌱 Every journey begins with a single step!';
  };

  const tabs = [
    { id: 'habits', label: 'Habits', icon: '🎯' },
    { id: 'calendar', label: 'Calendar', icon: '📅' },
    { id: 'statistics', label: 'Statistics', icon: '📊' },
    { id: 'data', label: 'Data', icon: '💾' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 py-8 text-slate-200">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Title */}
        <div className="text-center mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-400 to-purple-400 bg-clip-text text-transparent mb-2">
            🌟 HabitFlow
          </h1>
          <p className="text-slate-300 text-lg">{getMotivationalMessage()}</p>
        </div>

        {/* TABS */}
        <div className="glass neon-border rounded-xl p-2 mb-6">
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-sky-500 to-purple-600 text-white shadow-md scale-105'
                    : 'text-slate-300 hover:bg-slate-700/40'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {activeTab === 'habits' && (
            <>
              <AddHabitForm onAddHabit={addHabit} />
              <ProgressBar completed={completedToday} total={habits.length} />
              <HabitList
                habits={habits}
                completions={completions}
                onToggleComplete={toggleComplete}
                onEditHabit={editHabit}
                onDeleteHabit={deleteHabit}
              />
            </>
          )}

          {activeTab === 'calendar' && <CalendarView habits={habits} completions={completions} />}

          {activeTab === 'statistics' && (
            <StatisticsDashboard habits={habits} completions={completions} />
          )}

          {activeTab === 'data' && <DataExport habits={habits} completions={completions} />}
        </div>

        {/* Empty State */}
        {habits.length === 0 && activeTab === 'habits' && (
          <div className="text-center mt-12 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="text-6xl mb-4 animate-pulse-gentle">🎯</div>
            <h3 className="text-xl font-semibold text-slate-200 mb-2">Ready to build better habits?</h3>
            <p className="text-slate-400">Start by adding your first habit above!</p>
          </div>
        )}
      </div>
    </div>
  );
}

function getRandomColor() {
  return 'bg-sky-500';
}

function getRandomIcon() {
  const icons = ['💧', '🏃', '📚', '🎵', '🍎', '🧘', '💻', '🎨', '🏋️', '🛏️'];
  return icons[Math.floor(Math.random() * icons.length)];
}

export default App;
