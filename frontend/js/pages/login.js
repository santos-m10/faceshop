// ── LOGIN PAGE ────────────────────────────────────────────────────────────────
function renderLoginPage() {
  return `
  <div class="auth-page">
    <div class="auth-bg"></div>
    <div class="auth-card">
      <div class="auth-logo">
        <svg viewBox="0 0 60 60" style="width:56px;height:56px;margin-bottom:12px">
          <circle cx="30" cy="22" r="12" stroke="url(#lg1)" stroke-width="2" fill="none"/>
          <path d="M10 52 Q30 38 50 52" stroke="url(#lg1)" stroke-width="2" stroke-linecap="round" fill="none"/>
          <defs>
            <linearGradient id="lg1" x1="0" y1="0" x2="60" y2="60">
              <stop offset="0%" stop-color="#00F5D4"/>
              <stop offset="100%" stop-color="#7B61FF"/>
            </linearGradient>
          </defs>
        </svg>
        <div class="auth-logo-text">Face<span class="accent">Shop</span></div>
      </div>

      <div class="auth-tabs">
        <button class="auth-tab active" id="tabFace" onclick="switchLoginTab('face')">
          🤳 Reconhecimento Facial
        </button>
        <button class="auth-tab" id="tabEmail" onclick="switchLoginTab('email')">
          📧 Email
        </button>
      </div>

      <!-- FACE LOGIN -->
      <div id="faceLoginPanel">
        <div class="camera-container" id="loginCamera">
          <video id="loginVideo" class="camera-video" autoplay muted playsinline style="transform:scaleX(-1)"></video>
          <canvas id="loginCanvas" class="camera-canvas"></canvas>
          <div class="camera-overlay">
            <div class="face-frame"></div>
          </div>
        </div>
        <div class="camera-status" id="loginStatus">Inicializando câmera...</div>
        <button class="btn btn-primary" style="width:100%;margin-top:12px" onclick="tryFaceLogin()">
          🔍 Reconhecer Rosto
        </button>
      </div>

      <!-- EMAIL LOGIN -->
      <div id="emailLoginPanel" style="display:none">
        <div class="form-group">
          <label class="form-label">Email</label>
          <input class="form-input" id="loginEmail" type="email" placeholder="seu@email.com">
        </div>
        <p style="color:var(--text3);font-size:0.8rem;margin-bottom:16px">
          ℹ️ Login por email é apenas para demo. Em produção, use reconhecimento facial.
        </p>
        <button class="btn btn-primary" style="width:100%" onclick="tryEmailLogin()">
          Entrar
        </button>
      </div>

      <div class="divider-text">
        <span>Novo usuário?</span>
      </div>
      <button class="btn btn-ghost" style="width:100%" onclick="App.navigate('register')">
        Criar Conta com Reconhecimento Facial →
      </button>
    </div>
  </div>
  `;
}

function switchLoginTab(tab) {
  document.getElementById('tabFace').classList.toggle('active', tab === 'face');
  document.getElementById('tabEmail').classList.toggle('active', tab === 'email');
  document.getElementById('faceLoginPanel').style.display = tab === 'face' ? 'block' : 'none';
  document.getElementById('emailLoginPanel').style.display = tab === 'email' ? 'block' : 'none';

  if (tab === 'face') initLoginCamera();
  else Auth.stopCamera();
}

async function initLoginCamera() {
  const video = document.getElementById('loginVideo');
  if (!video) return;
  const ok = await Auth.startCamera(video);
  const status = document.getElementById('loginStatus');
  if (ok) {
    if (status) status.textContent = 'Câmera ativa. Posicione seu rosto.';
  } else {
    if (status) status.textContent = '❌ Não foi possível acessar a câmera';
  }
}

async function tryFaceLogin() {
  const video = document.getElementById('loginVideo');
  const status = document.getElementById('loginStatus');
  if (!video) return;

  if (status) status.textContent = '🔍 Capturando rosto...';

  const canvas = document.getElementById('loginCanvas');
  const descriptor = await Auth.captureDescriptor(video, canvas, status);

  if (!descriptor) {
    toast('Rosto não detectado. Tente novamente.', 'error');
    return;
  }

  if (status) status.textContent = '🔐 Verificando identidade...';

  try {
    const result = await api.faceLogin({ faceDescriptor: descriptor });
    if (result.success) {
      Auth.stopCamera();
      Session.set(result.user);
      toast(`Bem-vindo(a), ${result.user.name}!`, 'success');
      App.initApp();
    }
  } catch (e) {
    toast(e.message || 'Rosto não reconhecido. Cadastre-se primeiro.', 'error');
    if (status) status.textContent = '❌ Não reconhecido. Posicione-se novamente.';
  }
}

async function tryEmailLogin() {
  const email = document.getElementById('loginEmail')?.value?.trim();
  if (!email) { toast('Informe o email', 'error'); return; }

  try {
    // Demo: find user by email via face-login endpoint doesn't apply
    // We do a simplified demo fetch
    const res = await fetch('http://localhost:5000/api/admin/users');
    const users = await res.json();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      Session.set(user);
      toast(`Bem-vindo(a), ${user.name}!`, 'success');
      App.initApp();
    } else {
      toast('Usuário não encontrado', 'error');
    }
  } catch (e) {
    toast('Erro de conexão com o servidor', 'error');
  }
}