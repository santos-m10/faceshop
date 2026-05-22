// ── AUTH MODULE — Face Recognition ───────────────────────────────────────────
const Auth = {
  modelsLoaded: false,
  stream: null,

  async loadModels() {
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model';
    try {
      // Carregar modelos em paralelo
      const modelPromises = [
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ];
      
      // Carregar expressões apenas se necessário
      if (navigator.deviceMemory >= 4) {
        modelPromises.push(faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL));
      }
      
      await Promise.all(modelPromises);
      this.modelsLoaded = true;
      console.log('✅ Modelos face-api carregados');
      return true;
    } catch (e) {
      console.error('Erro ao carregar modelos:', e);
      return false;
    }
  },

  async startCamera(videoEl) {
    try {
      if (this.stream) this.stopCamera();
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 480, height: 360, facingMode: 'user' }
      });
      videoEl.srcObject = this.stream;
      await videoEl.play();
      return true;
    } catch (e) {
      console.error('Erro ao iniciar câmera:', e);
      return false;
    }
  },

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
  },

  async detectFace(videoEl) {
    if (!this.modelsLoaded) return null;
    const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });
    const result = await faceapi
      .detectSingleFace(videoEl, opts)
      .withFaceLandmarks()
      .withFaceDescriptor();
    return result;
  },

  async captureDescriptor(videoEl, canvasEl, statusEl) {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 60;

      const interval = setInterval(async () => {
        attempts++;
        if (statusEl) statusEl.textContent = `Analisando rosto... (${attempts}/${maxAttempts})`;

        const result = await this.detectFace(videoEl);

        if (result) {
          if (canvasEl) {
            const dims = faceapi.matchDimensions(canvasEl, videoEl, true);
            const resized = faceapi.resizeResults(result, dims);
            const ctx = canvasEl.getContext('2d');
            ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
            faceapi.draw.drawDetections(canvasEl, resized);
            faceapi.draw.drawFaceLandmarks(canvasEl, resized);
          }

          const confidence = result.detection.score;
          if (confidence > 0.7) {
            clearInterval(interval);
            if (statusEl) statusEl.textContent = `✓ Rosto capturado! (${(confidence * 100).toFixed(0)}%)`;
            resolve(Array.from(result.descriptor));
          }
        } else {
          if (canvasEl) {
            const ctx = canvasEl.getContext('2d');
            ctx?.clearRect(0, 0, canvasEl.width, canvasEl.height);
          }
          if (statusEl && attempts % 5 === 0) statusEl.textContent = 'Posicione seu rosto no centro...';
        }

        if (attempts >= maxAttempts) {
          clearInterval(interval);
          if (statusEl) statusEl.textContent = '❌ Tempo esgotado. Tente novamente.';
          resolve(null);
        }
      }, 200);
    });
  },
};

// ── SESSION STORE ─────────────────────────────────────────────────────────────
const Session = {
  get() {
    try { return JSON.parse(localStorage.getItem('faceshop_user') || 'null'); } catch { return null; }
  },
  set(user) { localStorage.setItem('faceshop_user', JSON.stringify(user)); },
  clear() { localStorage.removeItem('faceshop_user'); },
  isLogged() { return !!this.get(); },
  role() { return this.get()?.role || null; }
};