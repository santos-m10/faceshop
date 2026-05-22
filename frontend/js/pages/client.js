// ── CLIENT PAGE ───────────────────────────────────────────────────────────────
let allProducts = [];
let filteredProducts = [];
let activeCategory = 'all';

function renderClientPage() {
  const user = Session.get();
  return `
  <div class="page">
    <div class="page-hero">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px">
        <div>
          <div class="page-title">Olá, ${user?.name?.split(' ')[0]} 👋</div>
          <div class="page-sub">Descubra produtos incríveis</div>
        </div>
        <div style="display:flex;gap:12px;align-items:center">
          <div class="search-bar">
            <span class="search-icon">🔍</span>
            <input class="search-input" id="searchInput" placeholder="Buscar produtos..." oninput="searchProducts(this.value)">
          </div>
          <button class="btn btn-secondary" onclick="openCart(); Store.renderCart()" style="position:relative">
            🛒 Carrinho
            <span id="cartBadge" style="position:absolute;top:-8px;right:-8px;background:var(--accent);color:#000;border-radius:50%;width:20px;height:20px;font-size:0.65rem;font-weight:700;display:none;align-items:center;justify-content:center;font-family:var(--font-mono)">0</span>
          </button>
        </div>
      </div>
    </div>

    <!-- CATEGORIES -->
    <div class="filters-bar" id="categoriesBar">
      <div class="filter-pill active" onclick="filterCategory('all', this)">Todos</div>
      <div style="margin-left:auto"></div>
    </div>

    <!-- PRODUCTS -->
    <div class="content-grid">
      <div class="product-grid" id="productsGrid">
        <div class="empty-state"><div class="empty-icon">⏳</div><div class="empty-title">Carregando produtos...</div></div>
      </div>
    </div>

    <!-- ORDERS SECTION -->
    <div class="content-grid" style="margin-top:16px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
        <h2 style="font-family:var(--font-display);font-size:1.4rem;font-weight:700">Meus Pedidos</h2>
      </div>
      <div id="ordersSection">
        <div class="empty-state"><div class="empty-icon">📦</div><div class="empty-title">Carregando pedidos...</div></div>
      </div>
    </div>
  </div>`;
}

async function initClientPage() {
  await Store.loadCart();
  Store.updateCartBadge();
  loadClientProducts();
  loadClientOrders();
}

async function loadClientProducts() {
  try {
    allProducts = await api.getProducts();
    filteredProducts = [...allProducts];

    const categories = ['all', ...new Set(allProducts.map(p => p.category).filter(Boolean))];
    const bar = document.getElementById('categoriesBar');
    if (bar) {
      bar.innerHTML = categories.map(c =>
        `<div class="filter-pill ${c === 'all' ? 'active' : ''}" onclick="filterCategory('${c}', this)">
          ${c === 'all' ? 'Todos' : c}
        </div>`
      ).join('') + '<div style="margin-left:auto"></div>' +
      `<div style="font-family:var(--font-mono);font-size:0.7rem;color:var(--text3)">${allProducts.length} produtos</div>`;
    }

    renderProductGrid(allProducts);
  } catch (e) {
    toast('Erro ao carregar produtos', 'error');
  }
}

function renderProductGrid(products) {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  if (products.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-icon">🔍</div>
      <div class="empty-title">Nenhum produto encontrado</div>
    </div>`;
    return;
  }

  grid.innerHTML = products.map(p => `
    <div class="product-card" onclick="showProductModal('${p.id}')">
      <img class="product-img" src="${p.image}" alt="${p.name}"
        loading="lazy"
        onerror="this.src='https://via.placeholder.com/400x200/141c2e/00F5D4?text=📦'">
      <div class="product-body">
        <div class="product-category">${p.category || 'Produto'}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-desc">${p.description || ''}</div>
        <div class="product-footer">
          <div class="product-price">${formatCurrency(p.price)}</div>
          <div>
            <div class="product-stock">Estoque: ${p.stock}</div>
          </div>
        </div>
        <button class="btn-cart" style="width:100%;margin-top:12px"
          onclick="event.stopPropagation(); Store.addToCart('${p.id}')">
          + Adicionar ao Carrinho
        </button>
      </div>
    </div>
  `).join('');
}

function filterCategory(cat, el) {
  activeCategory = cat;
  document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');

  const search = document.getElementById('searchInput')?.value?.toLowerCase() || '';
  filteredProducts = allProducts.filter(p =>
    (cat === 'all' || p.category === cat) &&
    (!search || p.name.toLowerCase().includes(search) || (p.description || '').toLowerCase().includes(search))
  );
  renderProductGrid(filteredProducts);
}

function searchProducts(query) {
  const q = query.toLowerCase();
  filteredProducts = allProducts.filter(p =>
    (activeCategory === 'all' || p.category === activeCategory) &&
    (!q || p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q))
  );
  renderProductGrid(filteredProducts);
}

async function showProductModal(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  showModal(`
    <div style="margin:-32px -32px 0;border-radius:var(--radius-lg) var(--radius-lg) 0 0;overflow:hidden;height:240px">
      <img src="${product.image}" style="width:100%;height:100%;object-fit:cover"
        onerror="this.src='https://via.placeholder.com/520x240/141c2e/00F5D4?text=📦'">
    </div>
    <div style="padding-top:24px">
      <div style="font-family:var(--font-mono);font-size:0.7rem;color:var(--accent);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px">
        ${product.category}
      </div>
      <div class="modal-title" style="margin-bottom:8px">${product.name}</div>
      <p style="color:var(--text2);font-size:0.9rem;line-height:1.6;margin-bottom:20px">${product.description || 'Sem descrição disponível.'}</p>

      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
        <div style="font-family:var(--font-display);font-size:2rem;font-weight:800;color:var(--accent)">
          ${formatCurrency(product.price)}
        </div>
        <div style="text-align:right">
          <div class="${product.stock > 0 ? 'badge badge-success' : 'badge badge-danger'}">
            ${product.stock > 0 ? `${product.stock} em estoque` : 'Esgotado'}
          </div>
        </div>
      </div>

      <div style="display:flex;gap:12px">
        <button class="btn btn-ghost" onclick="closeModal()">Fechar</button>
        <button class="btn btn-primary" style="flex:1" ${product.stock === 0 ? 'disabled' : ''}
          onclick="Store.addToCart('${product.id}'); closeModal()">
          🛒 Adicionar ao Carrinho
        </button>
      </div>
    </div>
  `, { wide: false });
}

async function loadClientOrders() {
  const user = Session.get();
  if (!user) return;
  try {
    const orders = await api.getOrders(user.id);
    const el = document.getElementById('ordersSection');
    if (!el) return;

    if (orders.length === 0) {
      el.innerHTML = `<div class="empty-state">
        <div class="empty-icon">📦</div>
        <div class="empty-title">Nenhum pedido ainda</div>
        <p style="color:var(--text3);font-size:0.85rem">Seus pedidos aparecerão aqui.</p>
      </div>`;
      return;
    }

    el.innerHTML = `<div style="display:flex;flex-direction:column;gap:12px">` +
      orders.map(o => `
        <div class="card" style="padding:20px">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
            <div>
              <div style="font-family:var(--font-mono);font-size:0.7rem;color:var(--text3)">PEDIDO</div>
              <div style="font-weight:700;margin-top:2px">#${o.id.slice(0,8).toUpperCase()}</div>
            </div>
            <div>
              <div style="font-family:var(--font-mono);font-size:0.7rem;color:var(--text3)">DATA</div>
              <div style="font-size:0.875rem;margin-top:2px">${formatDate(o.created_at)}</div>
            </div>
            <div>
              <div style="font-family:var(--font-mono);font-size:0.7rem;color:var(--text3)">TOTAL</div>
              <div style="font-family:var(--font-display);font-weight:700;color:var(--accent);margin-top:2px">${formatCurrency(o.total)}</div>
            </div>
            <div>
              <span class="badge badge-success">${o.status}</span>
            </div>
            <div>
              <span class="badge badge-info">${o.payment_method}</span>
            </div>
          </div>
          ${o.items ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              ${o.items.map(i => `
                <div style="display:flex;align-items:center;gap:6px;background:var(--surface2);padding:6px 10px;border-radius:var(--radius-sm)">
                  <img src="${i.image}" style="width:24px;height:24px;border-radius:4px;object-fit:cover">
                  <span style="font-size:0.75rem">${i.name} ×${i.quantity}</span>
                </div>
              `).join('')}
            </div>
          </div>` : ''}
        </div>
      `).join('') + `</div>`;
  } catch (e) {
    console.error('Erro ao carregar pedidos:', e);
  }
}