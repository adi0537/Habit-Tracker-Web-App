// StatisticsBoard.jsx
import React from "react";

function StatisticsDashboard({ habits, completions, theme = 'light' }) {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const totalHabits = Array.isArray(habits) ? habits.length : 0;
  const activeHabits = habits.filter(h => (completions[h.id] || []).length > 0).length;

  // -----------------------------
  // Helper: normalize to local YYYY-MM-DD (avoid timezone shifts)
  // -----------------------------
  function toLocalDateKey(dateLike) {
    if (!dateLike && dateLike !== 0) return null;
    // If it's already yyyy-mm-dd, return it
    if (typeof dateLike === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateLike)) return dateLike;
    const d = (dateLike instanceof Date) ? new Date(dateLike) : new Date(dateLike);
    if (isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function buildDateSet(arr = [], accessor) {
    const set = new Set();
    for (const item of arr) {
      let raw = item;
      if (typeof accessor === 'function') raw = accessor(item);
      // If item is an object with common fields:
      if (raw && typeof raw === 'object') {
        raw = raw.date ?? raw.createdAt ?? raw.timestamp ?? JSON.stringify(raw);
      }
      const key = toLocalDateKey(raw);
      if (key) set.add(key);
    }
    return set;
  }

  // Precompute per-habit date sets for fast lookups
  const completionSets = {};
  for (const h of habits) {
    completionSets[h.id] = buildDateSet(completions[h.id] || [], (it) => {
      // If completion entries are objects, pick common fields:
      if (it && typeof it === 'object') return it.date ?? it.completedAt ?? it.timestamp ?? it;
      return it;
    });
  }

  // -----------------------------
  // STREAKS (use local-day keys)
  // -----------------------------
  const todayKey = toLocalDateKey(today);

  const currentStreaks = habits.map(habit => {
    const set = completionSets[habit.id] || new Set();
    if (set.size === 0) return 0;

    // --- Minimal change: start counting from YESTERDAY (day before today) ---
    const d = new Date();
    d.setDate(d.getDate() - 1);
    let streak = 0;
    while (true) {
      const key = toLocalDateKey(d);
      if (set.has(key)) {
        streak += 1;
        d.setDate(d.getDate() - 1); // previous day
      } else {
        break;
      }
    }
    return streak;
  });

  const longestCurrentStreak = currentStreaks.length ? Math.max(...currentStreaks) : 0;

  // -----------------------------
  // MONTHLY COMPLETION RATE (count normalized days)
  // -- (kept intact per your request)
  // -----------------------------
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthlyCompletions = [];

  // For each day of this month, build the YYYY-MM-DD (use local construction so local day matches)
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = toLocalDateKey(new Date(currentYear, currentMonth, d)); // local day
    const completed = habits.filter(h => (completionSets[h.id] || new Set()).has(dateKey)).length;
    monthlyCompletions.push(completed);
  }

  const avgMonthly = monthlyCompletions.reduce((s, c) => s + c, 0) / daysInMonth;
  const monthlyRate = totalHabits ? Math.round((avgMonthly / totalHabits) * 100) : 0;

  // -----------------------------
  // LAST 14-DAY COMPLETION RATE (rolling window ending today)
  // -----------------------------
  const DAYS_WINDOW = 14;
  const last14Dates = [];
  const last14Completions = [];

  // Build array of the last 14 local day keys (oldest -> newest)
  for (let i = DAYS_WINDOW - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i); // local arithmetic
    last14Dates.push(toLocalDateKey(d));
  }

  // Count completed habits for each of those days
  for (const dateKey of last14Dates) {
    const completedCount = habits.filter(h => (completionSets[h.id] || new Set()).has(dateKey)).length;
    last14Completions.push(completedCount);
  }

  // Average across the window (equal-weight per day)
  const avgLast14 = last14Completions.reduce((s, c) => s + c, 0) / DAYS_WINDOW;
  const last14Rate = totalHabits ? Math.round((avgLast14 / totalHabits) * 100) : 0;

  // -----------------------------
  // TOP HABITS (Improved)
  // -----------------------------
  function daysBetween(start, end) {
    const s = new Date(start), e = new Date(end);
    s.setHours(0,0,0,0); e.setHours(0,0,0,0);
    return Math.floor((e - s) / (1000 * 60 * 60 * 24)) + 1;
  }

  const habitStats = habits.map(h => {
    const raw = completions[h.id] || [];

    const uniqueDays = [...new Set(raw.map(r => {
      // Use same accessor as above
      const val = (r && typeof r === 'object') ? (r.date ?? r.completedAt ?? r.timestamp ?? r) : r;
      return toLocalDateKey(val);
    }).filter(Boolean))];

    const created = h.createdAt ? new Date(h.createdAt) : today;
    const daysAlive = Math.max(1, daysBetween(created, today));

    const expected = daysAlive * (h.frequencyPerDay ?? 1);
    const percent = Math.min(100, Math.round((uniqueDays.length / expected) * 100));

    return {
      ...h,
      completionCount: uniqueDays.length,
      completionRate: percent,
    };
  }).sort((a, b) => b.completionRate - a.completionRate);

  const topHabits = habitStats.slice(0, 3);

  // -----------------------------
  // UI — DARK GLASS THEME
  // -----------------------------
  return (
    <div className={`glass neon-border p-6 shadow-xl animate-fade-in-up ${
      theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
    }`}>
      <div className="flex items-center mb-6">
        <div className="text-2xl mr-3">📊</div>
        <h2 className={`text-2xl font-semibold ${
          theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
        }`}>Statistics Dashboard</h2>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

        <div className={`glass neon-border p-4 text-center ${
          theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
        }`}>
          <div className="text-3xl font-bold text-sky-400">{totalHabits}</div>
          <div className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Total Habits</div>
        </div>

        <div className={`glass neon-border p-4 text-center ${
          theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
        }`}>
          <div className="text-3xl font-bold text-emerald-400">{activeHabits}</div>
          <div className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Active Habits</div>
        </div>

        <div className={`glass neon-border p-4 text-center ${
          theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
        }`}>
          <div className="text-3xl font-bold text-orange-400">{longestCurrentStreak}</div>
          <div className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Longest Streak</div>
        </div>

        <div className={`glass neon-border p-4 text-center ${
          theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
        }`}>
          <div className="text-3xl font-bold text-purple-400">{monthlyRate}%</div>
          <div className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Monthly Avg</div>
        </div>
      </div>

      {/* TOP HABITS */}
      <div className="mb-6">
        <h3 className={`text-lg font-semibold mb-3 ${
          theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
        }`}>🏆 Top Performing Habits</h3>

        <div className="space-y-3">
          {topHabits.map((h) => (
            <div key={h.id}
              className={`glass neon-border p-3 flex items-center justify-between hover:scale-[1.02] transition ${
                theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
              }`}>

              <div className="flex items-center">
                <div className="text-xl mr-3">{h.icon || "🔥"}</div>
                <div>
                  <div className={`font-medium ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>{h.name}</div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{h.completionCount} completions</div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-lg font-bold text-emerald-300">{h.completionRate}%</div>
                <div className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'}`}>completion rate</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LAST 14-DAY CHART (rolling window) */}
      <div>
        <h3 className={`text-lg font-semibold mb-3 ${
          theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
        }`}>📈 Recent Progress (last 14 days)</h3>

        <div className={`glass neon-border p-4 overflow-x-auto ${
          theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
        }`}>
          <div className="flex items-end gap-2 h-24">

            {last14Completions.map((c, idx, arr) => {
              const height = totalHabits ? (c / totalHabits) * 100 : 0;
              const isToday = idx === arr.length - 1;

              // local day number label for that specific date
              const dateKey = last14Dates[idx] || '';
              const dayNumber = dateKey ? Number(dateKey.split('-')[2]) : '';

              return (
                <div key={idx} className="flex flex-col items-center flex-1 gap-1">
                  <div
                    className={`w-full rounded-t transition-all duration-500 ${
                      isToday
                        ? "bg-gradient-to-t from-emerald-400 to-sky-400"
                        : "bg-gradient-to-t from-sky-700 to-sky-400"
                    }`}
                    style={{ height: `${Math.max(height, 6)}%` }}
                  />

                  <div className={`text-xs sm:text-sm font-bold px-1 py-1 rounded-md w-full flex items-center justify-center flex-shrink-0 ${isToday ? "bg-emerald-400/30 text-emerald-400" : theme === 'dark' ? "bg-slate-700 text-slate-200" : "bg-slate-200 text-slate-900"}`}>
                    {dayNumber}
                  </div>
                </div>
              );
            })}

          </div>

          <div className={`text-center text-sm sm:text-base font-semibold mt-3 overflow-x-auto ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
            Last 14 days • <span className="text-lg font-bold text-cyan-400">{last14Rate}%</span> average completion rate
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatisticsDashboard;
