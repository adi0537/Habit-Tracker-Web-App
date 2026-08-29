import { useState, useMemo } from 'react';

function CalendarView({ completions, habits, theme = 'light' }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const localDateKey = (date = new Date()) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const normalizeDateString = (s) => {
    if (!s && s !== 0) return s;
    if (s instanceof Date) return localDateKey(s);
    if (typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : localDateKey(d);
  };

  const completionSets = useMemo(() => {
    const map = {};
    for (const id of Object.keys(completions || {})) {
      map[id] = new Set(
        (completions[id] || [])
          .map(normalizeDateString)
          .filter((v) => typeof v === 'string')
      );
    }
    return map;
  }, [completions]);

  const getDaysInMonth = (date) => {
    const y = date.getFullYear();
    const m = date.getMonth();

    const firstDay = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0);

    const days = [];

    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let day = 1; day <= lastDay.getDate(); day++)
      days.push(new Date(y, m, day));

    return days;
  };

  const getCompletionStatus = (date) => {
    if (!date) return null;

    const key = localDateKey(date);
    const total = habits.length;

    let completed = 0;
    for (const h of habits) {
      if ((completionSets[h.id] || new Set()).has(key)) completed++;
    }

    if (completed === 0) return 'none';
    if (completed === total) return 'full';
    return 'partial';
  };

  const navigateMonth = (dir) => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + dir);
      return d;
    });
  };

  const goToToday = () => setCurrentDate(new Date());

  const days = getDaysInMonth(currentDate);

  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

  return (
    <div className={`mb-6 p-6 glass neon-border shadow-xl ${
      theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="text-2xl mr-3">📅</div>
          <h2 className={`text-2xl font-semibold ${
            theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
          }`}>Calendar View</h2>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateMonth(-1)}
            className={`p-2 rounded-lg ${
              theme === 'dark' 
                ? 'hover:bg-slate-700/40 text-slate-300' 
                : 'hover:bg-slate-200/40 text-slate-600'
            }`}
          >
            ←
          </button>

          <button
            onClick={goToToday}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm"
          >
            Today
          </button>

          <button
            onClick={() => navigateMonth(1)}
            className={`p-2 rounded-lg ${
              theme === 'dark' 
                ? 'hover:bg-slate-700/40 text-slate-300' 
                : 'hover:bg-slate-200/40 text-slate-600'
            }`}
          >
            →
          </button>
        </div>
      </div>

      {/* Month Title */}
      <div className="mb-4 text-center">
        <h3 className={`text-xl font-semibold ${
          theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
        }`}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className={`p-2 text-center text-sm font-medium ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
          }`}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, idx) => {
          const status = getCompletionStatus(date);
          const isToday =
            date && date.toDateString() === new Date().toDateString();

          return (
            <div
              key={idx}
              className={`aspect-square flex items-center justify-center rounded-lg relative ${
                date ? `${theme === 'dark' ? 'hover:bg-slate-700/40' : 'hover:bg-slate-200/40'} cursor-pointer` : ""
              }`}
            >
              {date && (
                <>
                  <span
                    className={`font-medium ${
                      isToday 
                        ? "text-sky-400" 
                        : theme === 'dark' 
                          ? 'text-slate-200' 
                          : 'text-slate-900'
                    }`}
                  >
                    {date.getDate()}
                  </span>

                  {status && (
                    <div
                      className={`absolute bottom-1 right-1 w-2 h-2 rounded-full ${
                        status === "full"
                          ? "bg-emerald-400"
                          : status === "partial"
                            ? "bg-yellow-400"
                            : "bg-slate-600"
                      }`}
                    />
                  )}

                  {isToday && (
                    <div className="absolute inset-0 border-2 border-sky-400 rounded-lg"></div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className={`flex items-center justify-center space-x-6 text-sm mt-4 ${
        theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
      }`}>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-emerald-400 rounded-full mr-2"></div>
          <span>All habits completed</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
          <span>Some habits completed</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-slate-600 rounded-full mr-2"></div>
          <span>No habits completed</span>
        </div>
      </div>

    </div>
  );
}

export default CalendarView;
