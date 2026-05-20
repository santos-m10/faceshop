// ── API CLIENT ────────────────────────────────────────────────────────────────
const API_URL = "https://faceshop.onrender.com";
const API_BASE = API_URL + "/api";

const api = {
  async req(method, path, body) {
    try {
      const opts = {
        method,
        headers: { 'Content-Type': 'application/json' }
      };
      if (body) opts.body = JSON.stringify(body);
      const res = await fetch(API_BASE + path, opts);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro na requisição');
      return data;
    } catch (e) {
      console.error('API Error:', e);
      throw e;
    }
  },

  // Auth
  register: (d) => api.req('POST', '/auth/register', d),
  faceLogin: (d) => api.req('POST', '/auth/face-login', d),
  updateFace: (d) => api.req('POST', '/auth/update-face', d),

  // Products
  getProducts: (cat) => api.req('GET', '/products' + (cat ? `?category=${cat}` : '')),
  getProduct: (id) => api.req('GET', `/products/${id}`),
  createProduct: (d) => api.req('POST', '/products', d),
  updateProduct: (id, d) => api.req('PUT', `/products/${id}`, d),
  deleteProduct: (id) => api.req('DELETE', `/products/${id}`),

  // Cart
  getCart: (uid) => api.req('GET', `/cart/${uid}`),
  addToCart: (d) => api.req('POST', '/cart', d),
  updateCartItem: (id, d) => api.req('PUT', `/cart/${id}`, d),
  removeCartItem: (id) => api.req('DELETE', `/cart/${id}`),

  // Orders
  createOrder: (d) => api.req('POST', '/orders', d),
  getOrders: (uid) => api.req('GET', `/orders/${uid}`),

  // Admin
  getUsers: () => api.req('GET', '/admin/users'),
  updateUser: (id, d) => api.req('PUT', `/admin/users/${id}`, d),
  getStats: () => api.req('GET', '/admin/stats'),
  getAllOrders: () => api.req('GET', '/admin/orders'),
};

// ── UI UTILITIES ──────────────────────────────────────────────────────────────
function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  el.innerHTML = `<span style="font-size:1rem">${icons[type] || icons.info}</span><span>${msg}</span>`;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => {
    el.classList.add('removing');
    setTimeout(() => el.remove(), 300);
  }, 3500);
}

function showModal(html, opts = {}) {
  const overlay = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');
  content.innerHTML = html;
  if (opts.wide) content.style.maxWidth = '700px';
  else content.style.maxWidth = '520px';
  overlay.style.display = 'flex';
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
}

function closeModal() {
  document.getElementById('modalOverlay').style.display = 'none';
}

function formatCurrency(v) {
  return 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' });
}

function openCart() {
  document.getElementById('cartDrawer').classList.add('open');
  document.getElementById('cartDrawer').style.display = 'flex';
  document.getElementById('cartBackdrop').classList.add('visible');
}
function closeCart() {
  document.getElementById('cartDrawer').classList.remove('open');
  document.getElementById('cartBackdrop').classList.remove('visible');
  setTimeout(() => {
    if (!document.getElementById('cartDrawer').classList.contains('open'))
      document.getElementById('cartDrawer').style.display = 'none';
  }, 350);
}