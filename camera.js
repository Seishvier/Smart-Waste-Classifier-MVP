/* Pengelolaan kamera dan foto. Kamera biasanya memerlukan HTTPS atau localhost. */
(() => {
  let stream = null;
  let currentImageUrl = null;

  async function start(video, placeholder, errorEl) {
    stop(video);
    errorEl.textContent = "";
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      errorEl.textContent = "Browser tidak mendukung akses kamera atau halaman belum memakai HTTPS/localhost. Pilih foto dari galeri.";
      return false;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } }, audio: false
      });
      video.srcObject = stream;
      video.classList.add("ready");
      placeholder.hidden = true;
      await video.play();
      return true;
    } catch (error) {
      console.warn("Kamera tidak dapat diaktifkan:", error);
      errorEl.textContent = error.name === "NotAllowedError"
        ? "Izin kamera ditolak. Aktifkan izin kamera di pengaturan browser atau pilih foto dari galeri."
        : "Kamera tidak dapat diakses. Periksa izin atau pilih foto dari galeri.";
      placeholder.hidden = false;
      video.classList.remove("ready");
      return false;
    }
  }

  function capture(video, canvas) {
    if (!stream || !video.videoWidth) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.86);
  }

  function stop(video) {
    if (stream) stream.getTracks().forEach(track => track.stop());
    stream = null;
    if (video) {
      video.srcObject = null;
      video.classList.remove("ready");
    }
  }

  function setImage(file) {
    if (currentImageUrl) URL.revokeObjectURL(currentImageUrl);
    currentImageUrl = URL.createObjectURL(file);
    return currentImageUrl;
  }

  function releaseImage() {
    if (currentImageUrl) URL.revokeObjectURL(currentImageUrl);
    currentImageUrl = null;
  }

  window.SWCCamera = { start, capture, stop, setImage, releaseImage };
})();
