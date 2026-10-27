/* Penyimpanan lokal: tidak ada data yang dikirim ke server. */
(() => {
  const HISTORY_KEY = "swc_history_v1";
  const SETTINGS_KEY = "swc_settings_v1";

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.warn("Tidak dapat membaca penyimpanan lokal:", error);
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn("Tidak dapat menyimpan data. Penyimpanan mungkin penuh:", error);
      return false;
    }
  }

  window.SWCStorage = {
    getHistory: () => readJSON(HISTORY_KEY, []),
    saveHistory(items) { return writeJSON(HISTORY_KEY, items); },
    getSettings: () => readJSON(SETTINGS_KEY, { darkMode: false, corrections: [] }),
    saveSettings(settings) { return writeJSON(SETTINGS_KEY, settings); },
    clearHistory() {
      try { localStorage.removeItem(HISTORY_KEY); return true; }
      catch (error) { return false; }
    }
  };
})();
