import HabitItem from './HabitItem';
import React from 'react';

// Robust HabitList with universal completion parsing + debug output
function HabitList({ habits, completions, onToggleComplete, onEditHabit, onDeleteHabit }) {

  // Normalize any date-like input to local YYYY-MM-DD
  const toLocalDateKey = (dateLike) => {
    if (!dateLike && dateLike !== 0) return null;
    if (typeof dateLike === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateLike)) return dateLike;

    // if it's a number (unix ms or secs)
    if (typeof dateLike === 'number') {
      const ms = dateLike < 1e12 ? dateLike * 1000 : dateLike;
      const dnum = new Date(ms);
      if (!isNaN(dnum)) {
        const y = dnum.getFullYear();
        const m = String(dnum.getMonth() + 1).padStart(2, '0');
        const day = String(dnum.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      }
      return null;
    }

    const d = (dateLike instanceof Date) ? new Date(dateLike) : new Date(dateLike);
    if (isNaN(d.getTime())) return null;

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Universal extractor: given a completion entry, try to pull the habitId and a date value
  const extractFromEntry = (entry) => {
    if (!entry) return { habitId: null, dateVal: null };

    if (typeof entry === 'string' || typeof entry === 'number') {
      return { habitId: null, dateVal: entry };
    }

    const habitId = entry.habitId ?? entry.habit_id ?? entry.habit?.id ?? entry.habit ?? null;
    const dateVal = entry.date ?? entry.completedAt ?? entry.completed_at ?? entry.timestamp ?? entry.ts ?? entry.createdAt ?? entry.created_at ?? null;

    return { habitId, dateVal: dateVal ?? entry };
  };

  // Build completionSets for each habit id
  const buildAllCompletionSets = (habitsArr, completionsInput) => {
    const sets = {};

    for (const h of habitsArr) sets[h.id] = new Set();

    const add = (hid, rawDate) => {
      if (hid == null) return;
      if (!(hid in sets)) sets[hid] = new Set();
      const key = toLocalDateKey(rawDate);
      if (key) sets[hid].add(key);
    };

    if (completionsInput && typeof completionsInput === 'object' && !Array.isArray(completionsInput)) {
      try {
        const keys = Object.keys(completionsInput);
        const looksLikeMap = keys.length > 0 && keys.every(k => Array.isArray(completionsInput[k]));
        if (looksLikeMap) {
          for (const k of keys) {
            const arr = completionsInput[k] || [];
            for (const entry of arr) {
              if (typeof entry === 'string' || typeof entry === 'number') {
                add(k, entry);
              } else if (entry && typeof entry === 'object') {
                const { dateVal } = extractFromEntry(entry);
                add(k, dateVal ?? entry);
              }
            }
          }
          return sets;
        }
      } catch (e) {}
    }

    if (Array.isArray(completionsInput)) {
      for (const entry of completionsInput) {
        const { habitId, dateVal } = extractFromEntry(entry);
        if (habitId != null) add(habitId, dateVal);
      }
      return sets;
    }

    if (completionsInput && typeof completionsInput.entries === 'function') {
      for (const [k, arr] of completionsInput.entries()) {
        if (Array.isArray(arr)) {
          for (const entry of arr) {
            const { dateVal } = extractFromEntry(entry);
            add(k, dateVal ?? entry);
          }
        }
      }
      return sets;
    }

    return sets;
  };

  const completionSets = buildAllCompletionSets(habits, completions);

  // Debug summary
  try {
    const sample = habits.slice(0, 6).map(h => {
      const raw = completions && typeof completions === 'object' ? completions[h.id] : undefined;
      let flatMatches = undefined;

      if (Array.isArray(completions)) {
        flatMatches = completions.filter(e => {
          if (!e || typeof e === 'string' || typeof e === 'number') return false;
          const candidateId = e.habitId ?? e.habit_id ?? e.habit?.id ?? e.habit;
          return candidateId == h.id;
        }).slice(0, 3);
      }

      return {
        habitId: h.id,
        habitName: h.name,
        rawSampleForId: Array.isArray(raw) ? raw.slice(0, 3) : raw,
        flatMatchesSample: flatMatches,
        normalizedCount: completionSets[h.id] ? completionSets[h.id].size : 0,
        normalizedToday: completionSets[h.id]?.has(toLocalDateKey(new Date())) ?? false
      };
    });

    console.log('%cHabitList DEBUG SUMMARY', 'color: cyan; font-weight:600');
    console.log('today(local):', toLocalDateKey(new Date()));
    console.log('habits total:', habits.length);
    console.table(sample);
  } catch (e) {
    console.warn('HabitList debug logging failed', e);
  }

  const todayKey = toLocalDateKey(new Date());

  // ✅ **THE ONLY CHANGE YOU REQUESTED: streak starts from YESTERDAY**
  const getStreak = (habitId) => {
    const set = completionSets[habitId] || new Set();
    if (set.size === 0) return 0;

    // Start from the day before today
    const d = new Date();
    d.setDate(d.getDate() - 1);

    let streak = 0;

    while (true) {
      const key = toLocalDateKey(d);
      if (set.has(key)) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };
  // ✅ END CHANGE

  const totalStreaks = habits.reduce((sum, habit) => sum + getStreak(habit.id), 0);
  const longestStreak = habits.length > 0 ? Math.max(...habits.map(habit => getStreak(habit.id))) : 0;

  return (
    <div className="mb-6 glass neon-border p-6 text-slate-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="text-2xl mr-3">📋</div>
          <h2 className="text-2xl font-semibold text-slate-200">Your Habits</h2>
        </div>

        {habits.length > 0 && (
          <div className="text-right">
            <div className="text-sm text-slate-400">Total Streaks</div>
            <div className="text-lg font-bold text-orange-400">{totalStreaks} 🔥</div>
            <div className="text-xs text-slate-500">Longest: {longestStreak} days</div>
          </div>
        )}
      </div>

      {habits.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4 opacity-50">🎯</div>
          <h3 className="text-xl font-semibold text-slate-200 mb-2">No habits yet</h3>
          <p className="text-slate-400">Add your first habit above to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {habits.map((habit) => (
            <HabitItem
              key={habit.id}
              habit={habit}
              isCompletedToday={(completionSets[habit.id] || new Set()).has(todayKey)}
              streak={getStreak(habit.id)}
              onToggleComplete={onToggleComplete}
              onEdit={onEditHabit}
              onDelete={onDeleteHabit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default HabitList;
