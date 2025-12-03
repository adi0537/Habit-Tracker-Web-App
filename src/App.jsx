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
  // Theme state with persistence
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    // prefer system
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    // Toggle tailwind dark class if used
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    // Set data-theme for CSS variables
    root.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

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

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <div className={`min-h-screen py-2`}>
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Theme toggle - first div */}
        <div className="flex justify-end mb-2 animate-fade-in-up">
          <button
            onClick={toggleTheme}
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border transition card ${
              theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
            }`}
            aria-label="Toggle theme"
          >
            <span className="text-lg">{theme === 'dark' ? '🌙' : '☀️'}</span>
            <span className="text-xs font-medium hidden sm:inline">{theme === 'dark' ? 'Dark' : 'Light'}</span>
          </button>
        </div>

        {/* Heading - second div */}
        <div className="mb-8 animate-fade-in-up text-center">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-teal-300 via-teal-500 to-sky-600 bg-clip-text text-transparent mb-1">
            🌟 HabitFlow
          </h1>
          <p className="text-sm muted">{getMotivationalMessage()}</p>
        </div>

        {/* TABS */}
        <div className={`glass neon-border rounded-xl p-2 mb-6 ${
          theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'
        }`}>
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 px-2 sm:px-4 rounded-lg font-medium transition text-xs sm:text-sm md:text-base whitespace-nowrap flex items-center justify-center gap-1 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-teal-300 via-teal-600 to-sky-600 text-white shadow-md scale-105'
                    : theme === 'dark'
                      ? 'text-slate-300 hover:bg-slate-700/40'
                      : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {activeTab === 'habits' && (
            <>
              <AddHabitForm onAddHabit={addHabit} theme={theme} />
              <ProgressBar completed={completedToday} total={habits.length} theme={theme} />
              <HabitList
                habits={habits}
                completions={completions}
                onToggleComplete={toggleComplete}
                onEditHabit={editHabit}
                onDeleteHabit={deleteHabit}
                theme={theme}
              />
            </>
          )}

          {activeTab === 'calendar' && <CalendarView habits={habits} completions={completions} theme={theme} />}

          {activeTab === 'statistics' && (
            <StatisticsDashboard habits={habits} completions={completions} theme={theme} />
          )}

          {activeTab === 'data' && <DataExport habits={habits} completions={completions} theme={theme} />}
        </div>

        {/* Empty State */}
        {habits.length === 0 && activeTab === 'habits' && (
          <div className="text-center mt-12 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="text-6xl mb-4 animate-pulse-gentle">🎯</div>
            <h3 className="text-xl font-semibold mb-2">Ready to build better habits?</h3>
            <p className="muted">Start by adding your first habit above!</p>
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
