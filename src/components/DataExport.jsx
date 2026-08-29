function DataExport({ habits, completions, theme = 'light' }) {
  const exportData = () => {
    const data = {
      habits,
      completions,
      exportDate: new Date().toISOString(),
      version: "1.0"
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `habit-tracker-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);

        if (imported.habits && imported.completions) {
          alert("Data imported successfully! Refresh to apply.");
          console.log(imported);
        } else {
          alert("Invalid file format.");
        }
      } catch {
        alert("Error reading file.");
      }
    };
    reader.readAsText(file);
  };

  const clearAllData = () => {
    if (confirm("Clear all data? This cannot be undone.")) {
      localStorage.removeItem("habits");
      localStorage.removeItem("completions");
      alert("Data cleared. Refresh now.");
    }
  };

  return (
    <div className={`mb-6 p-6 glass neon-border shadow-xl ${
      theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
    }`}>
      <div className="flex items-center mb-6">
        <div className="text-2xl mr-3">💾</div>
        <h2 className={`text-2xl font-semibold ${
          theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
        }`}>Data Management</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Export */}
        <div className="text-center">
          <button
            onClick={exportData}
            className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-semibold py-3 px-6 rounded-lg transition transform hover:scale-105 shadow-lg"
          >
            📤 Export Data
          </button>
          <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            Download your data as a JSON file
          </p>
        </div>

        {/* Import */}
        <div className="text-center">
          <label className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition transform hover:scale-105 shadow-lg cursor-pointer block">
            📥 Import Data
            <input
              type="file"
              accept=".json"
              onChange={importData}
              className="hidden"
            />
          </label>
          <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            Upload a backup JSON file
          </p>
        </div>

        {/* Clear */}
        <div className="text-center">
          <button
            onClick={clearAllData}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-6 rounded-lg transition transform hover:scale-105 shadow-lg"
          >
            🗑️ Clear All Data
          </button>
          <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            Permanently remove all data
          </p>
        </div>
      </div>

      {/* Tips Card */}
      <div className={`mt-6 p-4 glass neon-border rounded-lg ${
        theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
      }`}>
        <h3 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-sky-300' : 'text-sky-600'}`}>💡 Data Tips</h3>
        <ul className={`text-sm space-y-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
          <li>• Export backups regularly</li>
          <li>• Import merges with existing data</li>
          <li>• Clearing data cannot be undone</li>
          <li>• All data is stored locally in your browser</li>
        </ul>
      </div>
    </div>
  );
}

export default DataExport;
