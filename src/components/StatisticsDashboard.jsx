import React from "react";

function StatisticsDashboard({ habits, completions }) {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const totalHabits = habits.length;
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
    <div className="glass neon-border p-6 shadow-xl animate-fade-in-up text-slate-100">
      <div className="flex items-center mb-6">
        <div className="text-2xl mr-3">📊</div>
        <h2 className="text-2xl font-semibold text-slate-200">Statistics Dashboard</h2>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

        <div className="glass neon-border p-4 text-center text-slate-100">
          <div className="text-3xl font-bold text-sky-300">{totalHabits}</div>
          <div className="text-sm text-slate-300">Total Habits</div>
        </div>

        <div className="glass neon-border p-4 text-center text-slate-100">
          <div className="text-3xl font-bold text-emerald-300">{activeHabits}</div>
          <div className="text-sm text-slate-300">Active Habits</div>
        </div>

        <div className="glass neon-border p-4 text-center text-slate-100">
          <div className="text-3xl font-bold text-orange-300">{longestCurrentStreak}</div>
          <div className="text-sm text-slate-300">Longest Streak</div>
        </div>

        <div className="glass neon-border p-4 text-center text-slate-100">
          <div className="text-3xl font-bold text-purple-300">{monthlyRate}%</div>
          <div className="text-sm text-slate-300">Monthly Avg</div>
        </div>
      </div>

      {/* TOP HABITS */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-200 mb-3">🏆 Top Performing Habits</h3>

        <div className="space-y-3">
          {topHabits.map((h) => (
            <div key={h.id}
              className="glass neon-border p-3 flex items-center justify-between hover:scale-[1.02] transition">

              <div className="flex items-center">
                <div className="text-xl mr-3">{h.icon || "🔥"}</div>
                <div>
                  <div className="font-medium text-slate-200">{h.name}</div>
                  <div className="text-sm text-slate-400">{h.completionCount} completions</div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-lg font-bold text-emerald-300">{h.completionRate}%</div>
                <div className="text-xs text-slate-500">completion rate</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MONTHLY CHART */}
      <div>
        <h3 className="text-lg font-semibold text-slate-200 mb-3">📈 Monthly Progress</h3>

        <div className="glass neon-border p-4">
          <div className="flex items-end space-x-1 h-20">

            {monthlyCompletions.slice(-14).map((c, idx, arr) => {
              const height = totalHabits ? (c / totalHabits) * 100 : 0;
              const isToday = idx === arr.length - 1;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div
                    className={`w-full rounded-t transition-all duration-500 ${
                      isToday
                        ? "bg-gradient-to-t from-emerald-400 to-sky-400"
                        : "bg-gradient-to-t from-sky-700 to-sky-400"
                    }`}
                    style={{ height: `${Math.max(height, 6)}%` }}
                  />

                  <div className={`text-xs mt-1 ${
                    isToday ? "text-emerald-300" : "text-slate-500"
                  }`}>
                    {/* label day number for last 14 days — we keep your original approach */}
                    {new Date(Date.UTC(currentYear, currentMonth, idx + (daysInMonth - 13))).getUTCDate()}
                  </div>
                </div>
              );
            })}

          </div>

          <div className="text-center text-sm text-slate-400 mt-2">
            Last 14 days • {monthlyRate}% average completion rate
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatisticsDashboard;
