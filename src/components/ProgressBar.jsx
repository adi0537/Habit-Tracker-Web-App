// ProgressBar.jsx
import { useEffect, useMemo, useState } from 'react';

console.log('DEBUG: ProgressBar.jsx — edited file loaded', { time: new Date().toISOString() });


/**
 * ProgressBar (backwards-compatible)
 *
 * Props supported:
 * - completed (number) and total (number) -> original behavior (single-day values)
 * - OR completions (array or object) -> rolling average over last `daysToAverage` days (default 14)
 *     - array items: { date: "YYYY-MM-DD" | Date, completedCount: number, possibleCount: number }
 *     - object: { "YYYY-MM-DD": { completedCount, possibleCount }, ... }
 * - daysToAverage (number) optional, default 14
 *
 * Behavior: when `completions` is provided, we compute a rolling average for the last N days
 * ending today (inclusive) **using local calendar days**. If `completed`+`total` are provided
 * (and completions is falsy), original single-day behavior is used.
 */

function toISODateLocal(d) {
  const date = d instanceof Date ? d : new Date(d);
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const dd = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function buildMapFromArray(completionsArray) {
  const map = new Map();
  (completionsArray || []).forEach((item) => {
    if (!item) return;
    const dateObj = item.date instanceof Date ? item.date : new Date(item.date);
    if (Number.isNaN(dateObj.getTime())) return;
    const key = toISODateLocal(dateObj);
    map.set(key, {
      completedCount: Number.isFinite(Number(item.completedCount)) ? Number(item.completedCount) : 0,
      possibleCount: Number.isFinite(Number(item.possibleCount)) ? Number(item.possibleCount) : 0,
    });
  });
  return map;
}

function buildMapFromObject(obj) {
  const map = new Map();
  if (!obj || typeof obj !== 'object') return map;
  Object.keys(obj).forEach((k) => {
    try {
      const entry = obj[k] || {};
      map.set(k, {
        completedCount: Number.isFinite(Number(entry.completedCount)) ? Number(entry.completedCount) : 0,
        possibleCount: Number.isFinite(Number(entry.possibleCount)) ? Number(entry.possibleCount) : 0,
      });
    } catch (e) {
      // ignore
    }
  });
  return map;
}

/**
 * Compute rolling daily-average-of-rates for last `daysToAverage` days (inclusive).
 * Day rate = completed / possible (0 if possible === 0). Average across days (equal weight).
 * Returns { percentage: 0..100, totalCompleted, totalPossible }
 */
function computeRollingDailyAverage(completionsInput, daysToAverage = 14) {
  const completionsMap = Array.isArray(completionsInput)
    ? buildMapFromArray(completionsInput)
    : buildMapFromObject(completionsInput);

  const today = new Date();
  let sumRates = 0;
  let daysConsidered = 0;
  let totalCompleted = 0;
  let totalPossible = 0;

  for (let i = daysToAverage - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i); // local calendar arithmetic
    const key = toISODateLocal(d);
    const entry = completionsMap.get(key) || { completedCount: 0, possibleCount: 0 };

    const completed = Number.isFinite(Number(entry.completedCount)) ? Number(entry.completedCount) : 0;
    const possible = Number.isFinite(Number(entry.possibleCount)) ? Number(entry.possibleCount) : 0;

    const dayRate = possible > 0 ? Math.min(1, completed / possible) : 0; // treat zero-possible as 0 rate
    sumRates += dayRate;
    daysConsidered += 1;

    totalCompleted += completed;
    totalPossible += possible;
  }

  const avgRate = daysConsidered > 0 ? sumRates / daysConsidered : 0;
  return {
    percentage: Math.round(Math.max(0, Math.min(1, avgRate)) * 100),
    totalCompleted,
    totalPossible,
  };
}

/**
 * Alternative weighted computation (totalCompleted / totalPossible) — available if you want later.
 * Not used by default, but provided for reference.
 */
function computeRollingTotalBased(completionsInput, daysToAverage = 14) {
  const completionsMap = Array.isArray(completionsInput)
    ? buildMapFromArray(completionsInput)
    : buildMapFromObject(completionsInput);

  const today = new Date();
  let totalCompleted = 0;
  let totalPossible = 0;

  for (let i = daysToAverage - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = toISODateLocal(d);
    const entry = completionsMap.get(key) || { completedCount: 0, possibleCount: 0 };

    totalCompleted += Number.isFinite(Number(entry.completedCount)) ? Number(entry.completedCount) : 0;
    totalPossible += Number.isFinite(Number(entry.possibleCount)) ? Number(entry.possibleCount) : 0;
  }

  const rate = totalPossible > 0 ? totalCompleted / totalPossible : 0;
  return {
    percentage: Math.round(Math.max(0, Math.min(1, rate)) * 100),
    totalCompleted,
    totalPossible,
  };
}

function ProgressBar({ completed, total, completions, daysToAverage = 14, style }) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  // If completions provided -> compute rolling average; otherwise fall back to original completed/total
  const computed = useMemo(() => {
    if (completions) {
      // use daily-average approach (equal weight per day). This matches "average completion rate for last N days".
      return computeRollingDailyAverage(completions, daysToAverage);
    }

    // original single-day behavior (safety fixes preserved)
    const completedNum = Number.isFinite(Number(completed)) ? Number(completed) : 0;
    const totalNum = Number.isFinite(Number(total)) ? Number(total) : 0;
    const safeTotal = Math.max(0, Math.floor(totalNum));
    const safeCompleted = safeTotal > 0 ? Math.min(Math.max(0, Math.floor(completedNum)), safeTotal) : Math.max(0, Math.floor(completedNum));
    const rawRate = safeTotal > 0 ? (safeCompleted / safeTotal) * 100 : 0;
    const percentage = Math.min(100, Math.max(0, Math.round(rawRate)));
    return { percentage, totalCompleted: safeCompleted, totalPossible: safeTotal };
  }, [completed, total, completions, daysToAverage]);

  const percentage = Math.min(100, Math.max(0, Number.isFinite(Number(computed.percentage)) ? Number(computed.percentage) : 0));
  const safeCompleted = Number.isFinite(Number(computed.totalCompleted)) ? Number(computed.totalCompleted) : 0;
  const safeTotal = Number.isFinite(Number(computed.totalPossible)) ? Number(computed.totalPossible) : 0;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(percentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  const getProgressColor = () => {
    if (percentage >= 80) return 'bg-gradient-to-r from-green-400 to-green-600';
    if (percentage >= 60) return 'bg-gradient-to-r from-blue-400 to-blue-600';
    if (percentage >= 40) return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
    if (percentage >= 20) return 'bg-gradient-to-r from-orange-400 to-orange-600';
    return 'bg-gradient-to-r from-red-400 to-red-600';
  };

  const titleText = completions ? `Average completion (last ${daysToAverage} days)` : `Today's Progress`;

  return (
    <div className="mb-6 p-6 bg-white rounded-xl shadow-lg border border-gray-100" style={style}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="text-2xl mr-3" aria-hidden>📊</div>
          <h2 className="text-xl font-semibold text-gray-800">{titleText}</h2>
        </div>

        <div className="text-2xl font-bold text-gray-800" aria-live="polite">
          {percentage}%
        </div>
      </div>

      <div
        className="w-full bg-gray-200 rounded-full h-6 overflow-hidden shadow-inner"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
        aria-label={titleText}
        title={`${percentage}% complete`}
      >
        <div
          className={`h-6 rounded-full transition-all duration-1000 ease-out ${getProgressColor()}`}
          style={{ width: `${animatedPercentage}%` }}
        />
      </div>

      <div className="flex justify-between items-center mt-3">
        <p className="text-gray-600">
          <span className="font-semibold text-green-600">{safeCompleted}</span> of{' '}
          <span className="font-semibold text-blue-600">{safeTotal}</span> habits completed
        </p>

        {percentage === 100 && safeTotal > 0 && (
          <div className="text-yellow-500 animate-bounce" aria-hidden>
            🎉
          </div>
        )}
      </div>
    </div>
  );
}

export default ProgressBar;
