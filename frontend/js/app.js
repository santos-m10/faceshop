// ── APP CONTROLLER ────────────────────────────────────────────────────────────
const App = {
  currentPage: null,
  viewAsRole: null, // for admin impersonation

  async boot() {
    const splash = document.getElementById('splash');
    const statusEl = document.getElementById('splashStatus');

    // Load face-api models
    if (statusEl) statusEl.textContent = 'Carregando modelos de reconhecimento facial...';

    try {
      await Auth.loadModels();
      if (statusEl) statusEl.textContent = '✓ Modelos carregados!';
    } catch (e) {
      if (statusEl) statusEl.textContent = '⚠️ Modelos offline – câmera em modo demo';
    }

    await new Promise(r => setTimeout(r, 600));

    // Hide splash
    splash.classList.add('hidden');
    setTimeout(() => { splash.style.display = 'none'; }, 600);

    // Init app
    this.initApp();
  },

  initApp() {
    const user = Session.get();
    this.viewAsRole = null;

    if (!user) {
      this.showPage('login');
    } else {
      this.setupNav(user);
      this.navigate(user.role);
    }
  },

  setupNav(user) {
    const navbar = document.getElementById('navbar');
    const appContainer = document.getElementById('appContainer');
    const navLinks = document.getElementById('navLinks');
    const navUser = document.getElementById('navUser');
    const footer = document.getElementById('siteFooter');

    navbar.style.display = 'flex';
    appContainer.style.display = 'flex';
    if (footer) footer.style.display = 'block';

    const links = {
      cliente:  [{ label: '🏪 Loja', page: 'cliente' }, { label: '📦 Meus Pedidos', page: 'orders' }],
      vendedor: [{ label: '📦 Meus Produtos', page: 'vendedor' }, { label: '📊 Analytics', page: 'analytics' }],
      admin: [
        { label: '📊 Dashboard', page: 'admin' },
        { label: '👥 Usuários', page: 'admin-users' },
        { label: '🛍️ Ver como Cliente', page: 'view-cliente' },
        { label: '🏪 Ver como Vendedor', page: 'view-vendedor' },
      ],
    };

    const roleLinks = links[user.role] || [];

    // Desktop nav
    navLinks.innerHTML = roleLinks.map(l =>
      `<button class="nav-link" onclick="App.navigate('${l.page}')">${l.label}</button>`
    ).join('');

    // Mobile drawer
    const drawer = document.getElementById('mobileNavDrawer');
    if (drawer) {
      drawer.innerHTML = roleLinks.map(l =>
        `<button class="mobile-nav-link" onclick="App.navigate('${l.page}');closeMobileNav()">${l.label}</button>`
      ).join('') +
      `<div style="height:1px;background:var(--border);margin:8px 0"></div>
       <button class="mobile-nav-link" onclick="App.logout();closeMobileNav()" style="color:var(--danger)">↩ Sair</button>`;
    }

    // User info
    navUser.innerHTML = `
      <span class="nav-role-badge role-${user.role}">${user.role}</span>
      <div class="nav-avatar" title="${user.name}">${user.name?.charAt(0)?.toUpperCase() || '?'}</div>
      <button class="btn btn-sm btn-ghost" onclick="App.logout()" title="Sair" style="padding:8px 14px">↩</button>
    `;
  },

  navigate(page) {
    const user = Session.get();
    if (!user && page !== 'register') { this.showPage('login'); return; }

    if (!user && page === 'register') {
      this.showPage('register');
      return;
    }

    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(l => {
      l.classList.toggle('active', l.textContent.trim().includes(this.pageToLabel(page)));
    });

    switch (page) {
      case 'login':
        this.showPage('login');
        break;
      case 'register':
        this.showPage('register');
        break;
      case 'cliente':
      case 'view-cliente':
        this.showPage('client');
        break;
      case 'vendedor':
      case 'view-vendedor':
        this.showPage('seller');
        break;
      case 'admin':
      case 'admin-users':
        this.showPage('admin');
        if (page === 'admin-users') {
          setTimeout(() => switchAdminSection('users'), 100);
        }
        break;
      default:
        this.showPage(user.role === 'admin' ? 'admin' : user.role === 'vendedor' ? 'seller' : 'client');
    }
  },

  pageToLabel(page) {
    const map = { cliente: 'Loja', vendedor: 'Produtos', admin: 'Dashboard', 'view-cliente': 'Loja', 'view-vendedor': 'Vendedor' };
    return map[page] || '';
  },

  showPage(page) {
    const content = document.getElementById('pageContent');
    if (!content) return;

    // Stop any running camera
    Auth.stopCamera();
    this.currentPage = page;

    switch (page) {
      case 'login':
        document.getElementById('navbar').style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';
        content.innerHTML = renderLoginPage();
        setTimeout(() => initLoginCamera(), 100);
        break;

      case 'register':
        document.getElementById('navbar').style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';
        content.innerHTML = renderRegisterPage();
        setTimeout(() => initRegCamera(), 100);
        break;

      case 'client':
        content.innerHTML = renderClientPage();
        setTimeout(() => initClientPage(), 50);
        break;

      case 'seller':
        content.innerHTML = renderSellerPage();
        setTimeout(() => initSellerPage(), 50);
        break;

      case 'admin':
        content.innerHTML = renderAdminPage();
        setTimeout(() => initAdminPage(), 50);
        break;
    }
  },

  setViewAs(role) {
    this.viewAsRole = role;
    if (role === 'cliente') this.showPage('client');
    else if (role === 'vendedor') this.showPage('seller');
    toast(`Visualizando como ${role}`, 'info');
  },

  logout() {
    Auth.stopCamera();
    closeMobileNav();
    Session.clear();
    Store.cart = [];
    Store.cartCount = 0;
    document.getElementById('navbar').style.display = 'none';
    const footer = document.getElementById('siteFooter');
    if (footer) footer.style.display = 'none';
    toast('Até logo!', 'info');
    this.showPage('login');
  }
};

// ── BOOT ──────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => App.boot());

// ── MOBILE NAV TOGGLE ─────────────────────────────────────────────────────────
function toggleMobileNav() {
  const drawer = document.getElementById('mobileNavDrawer');
  if (!drawer) return;
  drawer.classList.toggle('open');
  // Close when clicking outside
  if (drawer.classList.contains('open')) {
    setTimeout(() => {
      document.addEventListener('click', closeMobileNavOutside, { once: true });
    }, 10);
  }
}
function closeMobileNav() {
  const drawer = document.getElementById('mobileNavDrawer');
  if (drawer) drawer.classList.remove('open');
}
function closeMobileNavOutside(e) {
  const drawer = document.getElementById('mobileNavDrawer');
  const btn = document.getElementById('hamburgerBtn');
  if (drawer && !drawer.contains(e.target) && btn && !btn.contains(e.target)) {
    drawer.classList.remove('open');
  }
}