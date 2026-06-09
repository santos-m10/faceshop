// ── ADMIN PAGE ────────────────────────────────────────────────────────────────
let adminActiveSection = 'dashboard';
let adminUsers = [];
let adminOrders = [];

function renderAdminPage() {
  return `
  <div class="page">
    <div class="admin-layout">
      <!-- SIDEBAR -->
      <div class="admin-sidebar">
        <div style="margin-bottom:24px">
          <div style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text3);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:12px;padding:0 8px">ADMINISTRAÇÃO</div>
          <div class="sidebar-section active" id="sbar-dashboard" onclick="switchAdminSection('dashboard')">
            📊 Dashboard
          </div>
          <div class="sidebar-section" id="sbar-users" onclick="switchAdminSection('users')">
            👥 Usuários
          </div>
          <div class="sidebar-section" id="sbar-products" onclick="switchAdminSection('products')">
            📦 Produtos
          </div>
          <div class="sidebar-section" id="sbar-orders" onclick="switchAdminSection('orders')">
            🛒 Pedidos
          </div>
        </div>

        <div style="margin-top:auto">
          <div style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text3);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:12px;padding:0 8px">ACESSO RÁPIDO</div>
          <div class="sidebar-section" onclick="App.setViewAs('cliente')">
            🛍️ Ver como Cliente
          </div>
          <div class="sidebar-section" onclick="App.setViewAs('vendedor')">
            🏪 Ver como Vendedor
          </div>
        </div>
      </div>

      <!-- CONTENT -->
      <div class="admin-content" id="adminContent">
        <div class="empty-state"><div class="empty-icon">⏳</div><div class="empty-title">Carregando...</div></div>
      </div>
    </div>
  </div>`;
}

async function initAdminPage() {
  await Promise.all([
    loadAdminData(),
  ]);
  renderAdminSection('dashboard');
}

async function loadAdminData() {
  try {
    [adminUsers, adminOrders] = await Promise.all([
      api.getUsers(),
      api.getAllOrders(),
    ]);
  } catch (e) {
    console.error('Error loading admin data:', e);
  }
}

function switchAdminSection(section) {
  adminActiveSection = section;
  document.querySelectorAll('.sidebar-section').forEach(s => s.classList.remove('active'));
  document.getElementById(`sbar-${section}`)?.classList.add('active');
  renderAdminSection(section);
}

function renderAdminSection(section) {
  const content = document.getElementById('adminContent');
  if (!content) return;

  switch (section) {
    case 'dashboard': renderAdminDashboard(content); break;
    case 'users': renderAdminUsers(content); break;
    case 'products': renderAdminProducts(content); break;
    case 'orders': renderAdminOrders(content); break;
  }
}

async function renderAdminDashboard(container) {
  let stats = { clients: 0, sellers: 0, products: 0, orders: 0, revenue: 0 };
  try { stats = await api.getStats(); } catch (e) {}

  container.innerHTML = `
    <div style="margin-bottom:28px">
      <h2 style="font-family:var(--font-display);font-size:1.8rem;font-weight:800;margin-bottom:4px">Dashboard</h2>
      <p style="color:var(--text2);font-size:0.9rem">Visão geral da plataforma</p>
    </div>

    <div class="admin-stats-grid">
      <div class="stat-card">
        <div class="stat-icon">🛍️</div>
        <div class="stat-value">${stats.clients}</div>
        <div class="stat-label">Clientes</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🏪</div>
        <div class="stat-value">${stats.sellers}</div>
        <div class="stat-label">Vendedores</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📦</div>
        <div class="stat-value">${stats.products}</div>
        <div class="stat-label">Produtos Ativos</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🛒</div>
        <div class="stat-value">${stats.orders}</div>
        <div class="stat-label">Pedidos</div>
      </div>
      <div class="stat-card" style="grid-column:span 2">
        <div class="stat-icon">💰</div>
        <div class="stat-value">${formatCurrency(stats.revenue)}</div>
        <div class="stat-label">Receita Total</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:24px">
      <div class="card">
        <h3 style="font-family:var(--font-display);margin-bottom:16px">Últimos Usuários</h3>
        ${adminUsers.slice(0, 5).map(u => `
          <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
            <div style="width:36px;height:36px;border-radius:50%;background:var(--surface2);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--accent);font-size:0.875rem;border:1px solid var(--border)">
              ${u.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div style="flex:1;min-width:0">
              <div style="font-weight:600;font-size:0.875rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${u.name}</div>
              <div style="font-size:0.75rem;color:var(--text3)">${u.email}</div>
            </div>
            <span class="badge role-${u.role}">${u.role}</span>
          </div>
        `).join('')}
        <button class="btn btn-ghost btn-sm" style="width:100%;margin-top:12px" onclick="switchAdminSection('users')">
          Ver todos →
        </button>
      </div>

      <div class="card">
        <h3 style="font-family:var(--font-display);margin-bottom:16px">Últimos Pedidos</h3>
        ${adminOrders.slice(0, 5).map(o => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)">
            <div>
              <div style="font-family:var(--font-mono);font-size:0.7rem;color:var(--text3)">#${o.id.slice(0,8).toUpperCase()}</div>
              <div style="font-size:0.8rem;margin-top:2px">${o.client_name}</div>
            </div>
            <div style="text-align:right">
              <div style="font-weight:700;color:var(--accent)">${formatCurrency(o.total)}</div>
              <span class="badge badge-success" style="font-size:0.6rem">${o.status}</span>
            </div>
          </div>
        `).join('')}
        <button class="btn btn-ghost btn-sm" style="width:100%;margin-top:12px" onclick="switchAdminSection('orders')">
          Ver todos →
        </button>
      </div>
    </div>
  `;
}

function renderAdminUsers(container) {
  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px">
      <h2 style="font-family:var(--font-display);font-size:1.4rem;font-weight:700">Usuários</h2>
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input class="search-input" id="userSearch" placeholder="Buscar usuário..." oninput="filterAdminUsers(this.value)">
        </div>
        <select class="form-select" style="width:auto;padding:10px 12px" id="roleFilter" onchange="filterAdminUsers('')">
          <option value="">Todos</option>
          <option value="cliente">Clientes</option>
          <option value="vendedor">Vendedores</option>
          <option value="admin">Admins</option>
        </select>
      </div>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Usuário</th>
            <th>Email</th>
            <th>Tipo</th>
            <th>Cadastro</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody id="usersTableBody">
          ${renderUserRows(adminUsers)}
        </tbody>
      </table>
    </div>`;
}

function renderUserRows(users) {
  return users.map(u => `
    <tr id="urow-${u.id}">
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:36px;height:36px;border-radius:50%;background:var(--surface2);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--accent);border:1px solid var(--border)">
            ${u.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <span style="font-weight:500">${u.name}</span>
        </div>
      </td>
      <td style="color:var(--text2)">${u.email}</td>
      <td><span class="badge role-${u.role}">${u.role}</span></td>
      <td style="color:var(--text2);font-size:0.8rem">${formatDate(u.created_at)}</td>
      <td>
        <span class="${u.active ? 'badge badge-success' : 'badge badge-danger'}">
          ${u.active ? 'Ativo' : 'Inativo'}
        </span>
      </td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn btn-sm btn-secondary" onclick="openUserEdit('${u.id}')">✏️ Editar</button>
          <button class="btn btn-sm btn-danger" onclick="toggleUserStatus('${u.id}', ${u.active})">
            ${u.active ? '⏸' : '▶'}
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterAdminUsers(query) {
  const q = query.toLowerCase();
  const roleFilter = document.getElementById('roleFilter')?.value || '';
  const filtered = adminUsers.filter(u =>
    (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
    (!roleFilter || u.role === roleFilter)
  );
  const tbody = document.getElementById('usersTableBody');
  if (tbody) tbody.innerHTML = renderUserRows(filtered);
}

function openUserEdit(userId) {
  const user = adminUsers.find(u => u.id === userId);
  if (!user) return;

  showModal(`
    <div class="modal-title">✏️ Editar Usuário</div>
    <div class="form-group">
      <label class="form-label">Nome</label>
      <input class="form-input" id="euName" value="${user.name}">
    </div>
    <div class="form-group">
      <label class="form-label">Email</label>
      <input class="form-input" id="euEmail" type="email" value="${user.email}">
    </div>
    <div class="form-group">
      <label class="form-label">Tipo de Conta</label>
      <select class="form-select" id="euRole">
        <option value="cliente" ${user.role === 'cliente' ? 'selected' : ''}>Cliente</option>
        <option value="vendedor" ${user.role === 'vendedor' ? 'selected' : ''}>Vendedor</option>
        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveUserEdit('${userId}')">Salvar</button>
    </div>
  `);
}

async function saveUserEdit(userId) {
  const name = document.getElementById('euName')?.value?.trim();
  const email = document.getElementById('euEmail')?.value?.trim();
  const role = document.getElementById('euRole')?.value;

  try {
    await api.updateUser(userId, { name, email, role });
    toast('Usuário atualizado!', 'success');
    closeModal();
    await loadAdminData();
    renderAdminSection('users');
  } catch (e) {
    toast('Erro ao atualizar usuário', 'error');
  }
}

async function toggleUserStatus(userId, currentActive) {
  try {
    await api.updateUser(userId, { active: currentActive ? 0 : 1 });
    toast(currentActive ? 'Usuário desativado' : 'Usuário ativado', 'success');
    await loadAdminData();
    renderAdminSection('users');
  } catch (e) {
    toast('Erro ao alterar status', 'error');
  }
}

async function renderAdminProducts(container) {
  let products = [];
  try { products = await api.getProducts(null, { includeInactive: true }); } catch (e) {}

  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
      <h2 style="font-family:var(--font-display);font-size:1.4rem;font-weight:700">Produtos (${products.length})</h2>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Produto</th>
            <th>Categoria</th>
            <th>Preço</th>
            <th>Estoque</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${products.map(p => `
            <tr>
              <td>
                <div style="display:flex;align-items:center;gap:10px">
                  <img src="${p.image}" style="width:36px;height:36px;border-radius:var(--radius-sm);object-fit:cover"
                    onerror="this.src='https://via.placeholder.com/36x36/141c2e/00F5D4?text=📦'">
                  <span style="font-weight:500">${p.name}</span>
                </div>
              </td>
              <td><span class="badge badge-violet">${p.category || '-'}</span></td>
              <td style="font-weight:700;color:var(--accent)">${formatCurrency(p.price)}</td>
              <td><span class="${p.stock > 10 ? 'badge badge-success' : p.stock > 0 ? 'badge badge-warning' : 'badge badge-danger'}">${p.stock}</span></td>
              <td><span class="${p.active ? 'badge badge-success' : 'badge badge-danger'}">${p.active ? 'Ativo' : 'Inativo'}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>`;
}

function renderAdminOrders(container) {
  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
      <h2 style="font-family:var(--font-display);font-size:1.4rem;font-weight:700">Pedidos (${adminOrders.length})</h2>
      <div style="font-family:var(--font-display);font-size:1.1rem;font-weight:700;color:var(--accent)">
        Total: ${formatCurrency(adminOrders.reduce((s,o) => s + o.total, 0))}
      </div>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>Total</th>
            <th>Pagamento</th>
            <th>Status</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          ${adminOrders.map(o => `
            <tr>
              <td style="font-family:var(--font-mono);font-size:0.75rem;color:var(--text3)">#${o.id.slice(0,8).toUpperCase()}</td>
              <td>
                <div style="font-weight:500">${o.client_name}</div>
                <div style="font-size:0.75rem;color:var(--text3)">${o.client_email}</div>
              </td>
              <td style="font-weight:700;color:var(--accent)">${formatCurrency(o.total)}</td>
              <td><span class="badge badge-info">${o.payment_method}</span></td>
              <td><span class="badge badge-success">${o.status}</span></td>
              <td style="color:var(--text2);font-size:0.8rem">${formatDate(o.created_at)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>`;
}
