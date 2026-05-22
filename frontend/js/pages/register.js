// ── REGISTER PAGE ───────────────────────────────────────────────────────────
function renderRegisterPage() {
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

      <h2 class="auth-title">Criar nova conta</h2>
      <p class="auth-subtitle">Cadastre-se com reconhecimento facial para acessar o site.</p>

      <div class="form-group">
        <label class="form-label">Nome</label>
        <input class="form-input" id="registerName" type="text" placeholder="Seu nome completo">
      </div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input class="form-input" id="registerEmail" type="email" placeholder="seu@email.com">
      </div>
      <div class="form-group">
        <label class="form-label">Tipo de conta</label>
        <select class="form-input" id="registerRole">
          <option value="cliente">Cliente</option>
          <option value="vendedor">Vendedor</option>
        </select>
      </div>

      <div class="camera-container" id="registerCamera">
        <video id="registerVideo" class="camera-video" autoplay muted playsinline style="transform:scaleX(-1)"></video>
        <canvas id="registerCanvas" class="camera-canvas"></canvas>
        <div class="camera-overlay">
          <div class="face-frame"></div>
        </div>
      </div>
      <div class="camera-status" id="registerStatus">Posicione seu rosto e clique em cadastrar.</div>

      <button class="btn btn-primary" style="width:100%;margin-top:12px" onclick="tryRegister()">
        📝 Capturar rosto e cadastrar
      </button>

      <div class="divider-text">
        <span>Já possui conta?</span>
      </div>
      <button class="btn btn-ghost" style="width:100%" onclick="App.navigate('login')">
        Voltar para login →
      </button>
    </div>
  </div>
  `;
}

async function initRegCamera() {
  const video = document.getElementById('registerVideo');
  if (!video) return;
  const ok = await Auth.startCamera(video);
  const status = document.getElementById('registerStatus');
  if (ok) {
    if (status) status.textContent = 'Câmera ativa. Posicione seu rosto no centro.';
  } else {
    if (status) status.textContent = '❌ Não foi possível acessar a câmera';
  }
}

async function tryRegister() {
  const name = document.getElementById('registerName')?.value?.trim();
  const email = document.getElementById('registerEmail')?.value?.trim();
  const role = document.getElementById('registerRole')?.value;
  const status = document.getElementById('registerStatus');

  if (!name || name.length < 2) { toast('Informe seu nome completo (mínimo 2 caracteres)', 'error'); return; }
  if (!email || !email.includes('@')) { toast('Informe um email válido', 'error'); return; }
  if (!role) { toast('Informe o tipo de conta', 'error'); return; }

  if (status) status.textContent = '🔍 Capturando rosto...';
  const video = document.getElementById('registerVideo');
  const canvas = document.getElementById('registerCanvas');
  if (!video || !canvas) return;

  const descriptor = await Auth.captureDescriptor(video, canvas, status);
  if (!descriptor) {
    toast('Não foi possível capturar o rosto. Tente novamente.', 'error');
    return;
  }

  if (status) status.textContent = '📡 Enviando cadastro...';

  try {
    const result = await api.register({
      name,
      email,
      role,
      faceDescriptor: descriptor,
      avatar: null,
    });

    if (result.success) {
      Auth.stopCamera();
      Session.set(result.user);
      toast(`Conta criada. Bem-vindo(a), ${result.user.name}!`, 'success');
      // Aguardar um pouco antes de redirecionar
      await new Promise(r => setTimeout(r, 800));
      App.initApp();
    }
  } catch (e) {
    if (e.message.includes('Email já cadastrado')) {
      toast('Este email já está registrado. Faça login com seu rosto.', 'error');
    } else {
      toast(e.message || 'Erro ao cadastrar. Tente novamente.', 'error');
    }
    if (status) status.textContent = '❌ Erro ao cadastrar. Verifique os dados e tente novamente.';
  }
}
