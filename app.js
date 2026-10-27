(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const screens = $$(".screen");
  let currentScreen = "scan";
  let currentImage = null;
  let currentFileName = "";
  let currentResult = null;
  let lastSavedId = null;
  let toastTimeout = null;

  const binLabels = { Green: "Hijau", Blue: "Biru", Yellow: "Kuning", Red: "Merah", Grey: "Abu-abu" };
  const categoryLabels = {
    "Organic Waste": "Sampah Organik", "Paper & Cardboard": "Kertas & Kardus",
    Plastic: "Plastik", Glass: "Kaca", Metal: "Logam", "E-Waste": "Limbah Elektronik",
    "Hazardous Waste": "Limbah Berbahaya", Textile: "Tekstil", Rubber: "Karet",
    "Composite/Mixed": "Komposit / Campuran", "Medical Waste": "Limbah Medis",
    "Residual/Other": "Residu / Lainnya"
  };

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function navigate(screenName) {
    if (!screens.some(screen => screen.dataset.screen === screenName)) return;
    if (currentScreen === "camera" && screenName !== "camera") {
      SWCCamera.stop($("#cameraVideo"));
      $("#cameraPlaceholder").hidden = false;
    }
    currentScreen = screenName;
    screens.forEach(screen => screen.classList.toggle("active", screen.dataset.screen === screenName));
    $$(".nav-item").forEach(button => {
      const active = button.dataset.go === screenName;
      button.classList.toggle("active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (screenName === "history") renderHistory();
    if (screenName === "profile") renderStats();
  }

  function getHistory() { return SWCStorage.getHistory(); }
  function getSettings() { return SWCStorage.getSettings(); }

  function setTheme(isDark) {
    document.body.classList.toggle("dark", isDark);
    $("#themeSwitch").setAttribute("aria-checked", String(isDark));
    SWCStorage.saveSettings({ ...getSettings(), darkMode: isDark });
  }

  function renderStats() {
    const history = getHistory();
    const settings = getSettings();
    $("#statScans").textContent = String(settings.scanCount || history.length);
    $("#statSaved").textContent = String(history.length);
    $("#statCorrections").textContent = String((settings.corrections || []).length);
    $("#themeSwitch").setAttribute("aria-checked", String(settings.darkMode));
  }

  function renderCategoryFilter() {
    const select = $("#historyCategory");
    const current = select.value;
    const categories = [...new Set(getHistory().map(item => item.category))];
    select.innerHTML = '<option value="all">Semua kategori</option>' + categories.map(category =>
      `<option value="${escapeHTML(category)}">${escapeHTML(categoryLabels[category] || category)}</option>`).join("");
    if (categories.includes(current)) select.value = current;
  }

  function renderHistory() {
    renderCategoryFilter();
    const category = $("#historyCategory").value;
    const bin = $("#historyBin").value;
    const items = getHistory().filter(item =>
      (category === "all" || item.category === category) &&
      (bin === "all" || item.bin_color === bin)
    );
    const container = $("#historyList");
    if (!items.length) {
      container.innerHTML = `<div class="empty-state"><span>◷</span><strong>${getHistory().length ? "Tidak ada hasil yang cocok" : "Belum ada hasil pindai"}</strong><p>${getHistory().length ? "Coba ubah filter kategori atau warna." : "Simpan hasil pertama setelah memindai satu objek."}</p></div>`;
      return;
    }
    container.innerHTML = items.map(item => `
      <article class="history-card">
        <div class="history-thumb">${item.thumbnail ? `<img src="${item.thumbnail}" alt="">` : "♻"}</div>
        <div><h3>${escapeHTML(item.object_name)}</h3>
          <p>${escapeHTML(categoryLabels[item.category] || item.category)} · ${formatDate(item.createdAt)}</p>
          <div class="history-meta"><span class="pill"><span class="bin-dot ${item.bin_color.toLowerCase()}"></span>${binLabels[item.bin_color] || item.bin_color}</span><span class="pill">${item.confidence}%</span></div>
          <button class="text-button" data-open-history="${item.id}">Lihat detail</button>
          <button class="text-button" data-delete-history="${item.id}" style="margin-left:12px;color:#b91c1c">Hapus</button>
        </div>
      </article>`).join("");
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
  }

  function formatDate(value) {
    try { return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
    catch { return "Tanggal tidak diketahui"; }
  }

  function renderResult(result) {
    currentResult = result;
    const confidenceLabel = result.confidence >= 80 ? "Keyakinan tinggi" : result.confidence >= 50 ? "Cukup yakin — periksa kembali" : "Keyakinan rendah — pilih manual";
    const confidenceIcon = result.confidence >= 80 ? "✓" : result.confidence >= 50 ? "!" : "?";
    const ideas = result.recycling_ideas.slice(0, 3);
    $("#resultContent").innerHTML = `
      <article class="result-card">
        <div class="result-top"><div style="flex:1"><h2>${escapeHTML(result.object_name)}</h2><p>${escapeHTML(result.material)}</p><span class="confidence">${confidenceIcon} ${confidenceLabel} · ${result.confidence}%</span></div><span class="explore-icon green-bg" aria-hidden="true">♻</span></div>
        <div class="bin-result ${result.bin_color.toLowerCase()}" aria-label="Tempat sampah ${binLabels[result.bin_color]} untuk kategori ${categoryLabels[result.category] || result.category}"><span class="bin-dot ${result.bin_color.toLowerCase()}"></span><div><small>MASUK KE TEMPAT SAMPAH</small><strong>${binLabels[result.bin_color]} · ${escapeHTML(categoryLabels[result.category] || result.category)}</strong><small>${result.is_recyclable ? "Dapat didaur ulang bila fasilitas lokal menerimanya" : "Periksa jalur pembuangan yang sesuai"}</small></div></div>
        ${result.confidence < 50 ? `<div class="result-section"><p class="safety-note">Hasil belum meyakinkan. Pilih kategori secara manual atau coba foto yang lebih dekat dan terang.</p><button class="button secondary full" id="manualResultBtn">Pilih kategori manual</button></div>` : ""}
        <div class="result-section"><h3>✓ Persiapan sebelum memilah</h3><ul class="tip-list">${result.preparation_tips.slice(0, 3).map(tip => `<li>${escapeHTML(tip)}</li>`).join("")}</ul></div>
        <div class="result-section"><h3>✦ Fakta singkat</h3><p>${escapeHTML(result.fun_fact)}</p></div>
        <div class="result-section"><h3>↗ Ide pemanfaatan / langkah aman</h3><ul class="idea-list">${ideas.map(idea => `<li>${escapeHTML(idea)}</li>`).join("")}</ul></div>
        ${result.safety_note ? `<div class="result-section"><p class="safety-note"><strong>Catatan keselamatan:</strong> ${escapeHTML(result.safety_note)}</p></div>` : ""}
        <div class="result-section"><p><strong>Catatan transparansi:</strong> hasil ini berasal dari simulasi lokal, bukan pengenalan gambar oleh AI. Periksa material sebenarnya dan aturan pengelolaan sampah setempat.</p></div>
        <div class="result-actions"><button class="button primary" id="saveResultBtn">Simpan hasil</button><button class="button secondary" id="scanAgainBtn">Pindai lagi</button><button class="button secondary" id="correctResultBtn">Bukan ini?</button><button class="button secondary" id="shareResultBtn">Bagikan teks</button></div>
      </article>`;
    $("#saveResultBtn").addEventListener("click", saveCurrentResult);
    $("#scanAgainBtn").addEventListener("click", () => { clearCurrentPhoto(); navigate("scan"); });
    $("#correctResultBtn").addEventListener("click", openCorrection);
    $("#shareResultBtn").addEventListener("click", shareResult);
    $("#manualResultBtn")?.addEventListener("click", openCorrection);
    navigate("result");
  }

  function saveCurrentResult() {
    if (!currentResult) return;
    const history = getHistory();
    if (lastSavedId && history.some(item => item.id === lastSavedId)) {
      showToast("Hasil ini sudah disimpan.");
      return;
    }
    const item = {
      ...currentResult, id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      createdAt: new Date().toISOString(), thumbnail: currentImage || null
    };
    history.unshift(item);
    const saved = SWCStorage.saveHistory(history.slice(0, 80));
    if (saved) {
      lastSavedId = item.id;
      showToast("Hasil disimpan di perangkat ini.");
      renderStats();
    } else {
      showToast("Penyimpanan gagal. Ruang browser mungkin penuh.");
    }
  }

  function openCorrection() {
    if (!currentResult) return;
    $("#correctionCategory").value = currentResult.category;
    $("#correctionNote").value = "";
    $("#correctionDialog").showModal();
  }

  function submitCorrection(event) {
    event.preventDefault();
    if (!currentResult) return;
    const category = $("#correctionCategory").value;
    const note = $("#correctionNote").value.trim();
    const corrected = SWCClassification.classifyManual(category);
    const settings = getSettings();
    settings.corrections = settings.corrections || [];
    settings.corrections.push({ at: new Date().toISOString(), from: currentResult.category, to: category, note });
    SWCStorage.saveSettings(settings);
    currentResult = { ...corrected, object_name: currentResult.object_name, demo_mode: true };
    lastSavedId = null;
    $("#correctionDialog").close();
    renderResult(currentResult);
    showToast("Koreksi dicatat secara lokal.");
  }

  async function shareResult() {
    if (!currentResult) return;
    const text = `Smart Waste Classifier (simulasi)\nObjek: ${currentResult.object_name}\nMaterial: ${currentResult.material}\nKategori: ${categoryLabels[currentResult.category] || currentResult.category}\nTempat sampah: ${binLabels[currentResult.bin_color]}\nKeyakinan: ${currentResult.confidence}%\nCatatan: hasil simulasi lokal, bukan analisis AI sungguhan. Periksa aturan setempat.`;
    try {
      if (navigator.share) await navigator.share({ title: "Hasil Smart Waste Classifier", text });
      else if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); showToast("Ringkasan disalin."); }
      else showToast("Fitur berbagi tidak didukung browser ini.");
    } catch (error) {
      if (error.name !== "AbortError") showToast("Tidak dapat membagikan hasil saat ini.");
    }
  }

  function clearCurrentPhoto() {
    currentImage = null; currentFileName = ""; currentResult = null; lastSavedId = null;
    SWCCamera.releaseImage();
    $("#galleryInput").value = "";
    $("#reviewImage").removeAttribute("src");
  }

  function setPhotoFromFile(file) {
    if (!file || !file.type.startsWith("image/")) {
      showToast("Pilih file gambar yang valid.");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      showToast("Ukuran foto maksimal 12 MB untuk demo ini.");
      return;
    }
    currentFileName = file.name || "";
    currentImage = SWCCamera.setImage(file);
    lastSavedId = null;
    $("#reviewImage").src = currentImage;
    navigate("review");
  }

  function openCorrectionFromHistory(item) {
    currentResult = item;
    currentImage = item.thumbnail || null;
    currentFileName = "";
    renderResult(item);
  }

  function capturePhoto() {
    const dataUrl = SWCCamera.capture($("#cameraVideo"), $("#captureCanvas"));
    if (!dataUrl) {
      showToast("Kamera belum siap. Tunggu sebentar lalu coba lagi.");
      return;
    }
    currentImage = dataUrl;
    currentFileName = "";
    lastSavedId = null;
    $("#reviewImage").src = dataUrl;
    SWCCamera.stop($("#cameraVideo"));
    $("#cameraPlaceholder").hidden = false;
    navigate("review");
  }

  function analyzeCurrentPhoto() {
    const button = $("#analyzeBtn");
    button.disabled = true;
    button.textContent = "Menganalisis…";
    const settings = getSettings();
    settings.scanCount = (settings.scanCount || 0) + 1;
    SWCStorage.saveSettings(settings);
    window.setTimeout(() => {
      const result = SWCClassification.classifyByFilename(currentFileName);
      renderResult(result);
      button.disabled = false;
      button.textContent = "Analisis objek";
    }, 650);
  }

  $("#openCameraBtn").addEventListener("click", async () => {
    navigate("camera");
    await SWCCamera.start($("#cameraVideo"), $("#cameraPlaceholder"), $("#cameraError"));
  });
  $("#cancelCameraBtn").addEventListener("click", () => { SWCCamera.stop($("#cameraVideo")); navigate("scan"); });
  $("#captureBtn").addEventListener("click", capturePhoto);
  $("#galleryInput").addEventListener("change", event => setPhotoFromFile(event.target.files?.[0]));
  $("#retakeBtn").addEventListener("click", () => {
    clearCurrentPhoto();
    navigate("camera");
    SWCCamera.start($("#cameraVideo"), $("#cameraPlaceholder"), $("#cameraError"));
  });
  $("#analyzeBtn").addEventListener("click", analyzeCurrentPhoto);
  $("#historyCategory").addEventListener("change", renderHistory);
  $("#historyBin").addEventListener("change", renderHistory);
  $("#themeToggle").addEventListener("click", () => setTheme(!document.body.classList.contains("dark")));
  $("#themeSwitch").addEventListener("click", () => setTheme(!document.body.classList.contains("dark")));
  $("#clearHistoryBtn").addEventListener("click", () => {
    if (!confirm("Hapus semua riwayat pindai dari perangkat ini? Tindakan ini tidak dapat dibatalkan.")) return;
    SWCStorage.clearHistory();
    renderHistory(); renderStats(); showToast("Riwayat telah dihapus dari perangkat ini.");
  });
  $("#correctionForm").addEventListener("submit", submitCorrection);
  $("#historyList").addEventListener("click", event => {
    const openButton = event.target.closest("[data-open-history]");
    const deleteButton = event.target.closest("[data-delete-history]");
    if (openButton) {
      const item = getHistory().find(entry => entry.id === openButton.dataset.openHistory);
      if (item) openCorrectionFromHistory(item);
    }
    if (deleteButton) {
      const history = getHistory().filter(entry => entry.id !== deleteButton.dataset.deleteHistory);
      SWCStorage.saveHistory(history); renderHistory(); renderStats(); showToast("Item riwayat dihapus.");
    }
  });
  $$(".nav-item").forEach(button => button.addEventListener("click", () => navigate(button.dataset.go)));

  const initialSettings = getSettings();
  setTheme(Boolean(initialSettings.darkMode));
  renderStats();
  renderHistory();
})();
