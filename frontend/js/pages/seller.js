// ── SELLER PAGE ───────────────────────────────────────────────────────────────
let sellerProducts = [];
let sellerActiveTab = 'products';

function renderSellerPage() {
  const user = Session.get();
  return `
  <div class="page">
    <div class="seller-layout">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:16px">
        <div>
          <div class="page-title">Painel do Vendedor</div>
          <div class="page-sub">${user?.name} · Gerencie seus produtos</div>
        </div>
        <button class="btn btn-primary" onclick="openProductForm()">+ Novo Produto</button>
      </div>

      <div class="seller-tabs">
        <button class="seller-tab active" id="stab-products" onclick="switchSellerTab('products')">📦 Meus Produtos</button>
        <button class="seller-tab" id="stab-analytics" onclick="switchSellerTab('analytics')">📊 Estatísticas</button>
      </div>

      <div id="sellerContent"></div>
    </div>
  </div>`;
}

async function initSellerPage() {
  await loadSellerProducts();
  renderSellerTab('products');
}

function switchSellerTab(tab) {
  sellerActiveTab = tab;
  document.querySelectorAll('.seller-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(`stab-${tab}`)?.classList.add('active');
  renderSellerTab(tab);
}

function renderSellerTab(tab) {
  const content = document.getElementById('sellerContent');
  if (!content) return;
  if (tab === 'products') renderSellerProducts(content);
  else renderSellerAnalytics(content);
}

async function loadSellerProducts() {
  try {
    sellerProducts = await api.getProducts();
  } catch (e) {
    sellerProducts = [];
  }
}

function renderSellerProducts(container) {
  if (sellerProducts.length === 0) {
    container.innerHTML = `<div class="empty-state">
      <div class="empty-icon">📦</div>
      <div class="empty-title">Nenhum produto cadastrado</div>
      <p style="color:var(--text3);font-size:0.85rem;margin-bottom:16px">Comece adicionando seu primeiro produto.</p>
      <button class="btn btn-primary" onclick="openProductForm()">+ Adicionar Produto</button>
    </div>`;
    return;
  }

  container.innerHTML = `
    <div style="margin-bottom:16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap">
      <div class="search-bar" style="flex:1;max-width:320px">
        <span class="search-icon">🔍</span>
        <input class="search-input" id="sellerSearch" placeholder="Buscar produto..." oninput="filterSellerProducts(this.value)">
      </div>
      <div style="margin-left:auto;font-family:var(--font-mono);font-size:0.7rem;color:var(--text3)">${sellerProducts.length} produtos</div>
    </div>
    <div class="table-wrap">
      <table id="sellerTable">
        <thead>
          <tr>
            <th>Produto</th>
            <th>Categoria</th>
            <th>Preço</th>
            <th>Estoque</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody id="sellerTableBody">
          ${renderSellerRows(sellerProducts)}
        </tbody>
      </table>
    </div>`;
}

function renderSellerRows(products) {
  return products.map(p => `
    <tr id="row-${p.id}">
      <td>
        <div style="display:flex;align-items:center;gap:12px">
          <img src="${p.image}" style="width:44px;height:44px;border-radius:var(--radius-sm);object-fit:cover;background:var(--surface2)"
            onerror="this.src='https://via.placeholder.com/44x44/141c2e/00F5D4?text=📦'">
          <div>
            <div style="font-weight:600">${p.name}</div>
            <div style="font-size:0.75rem;color:var(--text3);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.description || ''}</div>
          </div>
        </div>
      </td>
      <td><span class="badge badge-violet">${p.category || '-'}</span></td>
      <td style="font-family:var(--font-display);font-weight:700;color:var(--accent)">${formatCurrency(p.price)}</td>
      <td>
        <span class="${p.stock > 10 ? 'badge badge-success' : p.stock > 0 ? 'badge badge-warning' : 'badge badge-danger'}">
          ${p.stock}
        </span>
      </td>
      <td>
        <span class="${p.active ? 'badge badge-success' : 'badge badge-danger'}">
          ${p.active ? 'Ativo' : 'Inativo'}
        </span>
      </td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn btn-sm btn-secondary" onclick="openProductForm('${p.id}')">✏️ Editar</button>
          <button class="btn btn-sm btn-danger" onclick="toggleProductStatus('${p.id}', ${p.active})">
            ${p.active ? '⏸ Pausar' : '▶ Ativar'}
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterSellerProducts(q) {
  const query = q.toLowerCase();
  const filtered = query ? sellerProducts.filter(p => p.name.toLowerCase().includes(query)) : sellerProducts;
  const tbody = document.getElementById('sellerTableBody');
  if (tbody) tbody.innerHTML = renderSellerRows(filtered);
}

function openProductForm(productId) {
  const product = productId ? sellerProducts.find(p => p.id === productId) : null;
  const user = Session.get();

  showModal(`
    <div class="modal-title">${product ? '✏️ Editar Produto' : '+ Novo Produto'}</div>

    <div class="form-group">
      <label class="form-label">Nome do Produto *</label>
      <input class="form-input" id="pName" value="${product?.name || ''}" placeholder="Ex: iPhone 16 Pro">
    </div>
    <div class="form-group">
      <label class="form-label">Descrição</label>
      <textarea class="form-textarea" id="pDesc" placeholder="Descrição detalhada do produto...">${product?.description || ''}</textarea>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group">
        <label class="form-label">Preço (R$) *</label>
        <input class="form-input" id="pPrice" type="number" step="0.01" min="0" value="${product?.price || ''}" placeholder="0,00">
      </div>
      <div class="form-group">
        <label class="form-label">Estoque *</label>
        <input class="form-input" id="pStock" type="number" min="0" value="${product?.stock || 0}">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Categoria</label>
      <select class="form-select" id="pCategory">
        ${['Eletrônicos','Computadores','Smartphones','Tablets','Wearables','Acessórios','Outros'].map(c =>
          `<option value="${c}" ${product?.category === c ? 'selected' : ''}>${c}</option>`
        ).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">URL da Imagem</label>
      <input class="form-input" id="pImage" value="${product?.image || ''}" placeholder="https://..." oninput="previewImg(this.value)">
      <img id="imgPreview" src="${product?.image || ''}" style="width:100%;height:120px;object-fit:cover;border-radius:var(--radius-sm);margin-top:8px;display:${product?.image ? 'block' : 'none'}">
    </div>

    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveProduct('${productId || ''}', '${user?.id || ''}')">
        ${product ? 'Salvar Alterações' : 'Criar Produto'}
      </button>
    </div>
  `, { wide: false });
}

function previewImg(url) {
  const img = document.getElementById('imgPreview');
  if (!img) return;
  img.src = url;
  img.style.display = url ? 'block' : 'none';
}

async function saveProduct(productId, sellerId) {
  const name = document.getElementById('pName')?.value?.trim();
  const description = document.getElementById('pDesc')?.value?.trim();
  const price = parseFloat(document.getElementById('pPrice')?.value);
  const stock = parseInt(document.getElementById('pStock')?.value);
  const category = document.getElementById('pCategory')?.value;
  const image = document.getElementById('pImage')?.value?.trim();

  if (!name || isNaN(price)) { toast('Preencha nome e preço', 'error'); return; }

  try {
    if (productId) {
      await api.updateProduct(productId, { name, description, price, stock, category, image });
      toast('Produto atualizado!', 'success');
    } else {
      await api.createProduct({ name, description, price, stock, category, image, seller_id: sellerId });
      toast('Produto criado!', 'success');
    }
    closeModal();
    await loadSellerProducts();
    renderSellerTab(sellerActiveTab);
  } catch (e) {
    toast('Erro ao salvar produto', 'error');
  }
}

async function toggleProductStatus(productId, currentActive) {
  try {
    await api.updateProduct(productId, { active: currentActive ? 0 : 1 });
    toast(currentActive ? 'Produto pausado' : 'Produto ativado', 'success');
    await loadSellerProducts();
    renderSellerTab(sellerActiveTab);
  } catch (e) {
    toast('Erro ao alterar status', 'error');
  }
}

function renderSellerAnalytics(container) {
  const total = sellerProducts.length;
  const active = sellerProducts.filter(p => p.active).length;
  const totalStock = sellerProducts.reduce((s, p) => s + p.stock, 0);
  const avgPrice = total > 0 ? sellerProducts.reduce((s, p) => s + p.price, 0) / total : 0;
  const categories = [...new Set(sellerProducts.map(p => p.category).filter(Boolean))];

  container.innerHTML = `
    <div class="admin-stats-grid" style="margin-bottom:24px">
      <div class="stat-card">
        <div class="stat-icon">📦</div>
        <div class="stat-value">${total}</div>
        <div class="stat-label">Total Produtos</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-value">${active}</div>
        <div class="stat-label">Ativos</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🏭</div>
        <div class="stat-value">${totalStock}</div>
        <div class="stat-label">Total em Estoque</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-value">${formatCurrency(avgPrice)}</div>
        <div class="stat-label">Preço Médio</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
      <div class="card">
        <h3 style="font-family:var(--font-display);margin-bottom:16px">Por Categoria</h3>
        ${categories.map(cat => {
          const catProducts = sellerProducts.filter(p => p.category === cat);
          const pct = Math.round((catProducts.length / total) * 100);
          return `
            <div style="margin-bottom:12px">
              <div style="display:flex;justify-content:space-between;font-size:0.875rem;margin-bottom:4px">
                <span>${cat}</span>
                <span style="color:var(--text2)">${catProducts.length} (${pct}%)</span>
              </div>
              <div style="height:6px;background:var(--surface2);border-radius:3px;overflow:hidden">
                <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--accent),var(--accent2));border-radius:3px;transition:width 0.5s ease"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      <div class="card">
        <h3 style="font-family:var(--font-display);margin-bottom:16px">Estoque Baixo</h3>
        ${sellerProducts.filter(p => p.stock < 10 && p.active).length === 0
          ? '<p style="color:var(--text3);font-size:0.875rem">Todos com estoque adequado ✓</p>'
          : sellerProducts.filter(p => p.stock < 10 && p.active).slice(0, 5).map(p => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
              <span style="font-size:0.875rem">${p.name}</span>
              <span class="${p.stock === 0 ? 'badge badge-danger' : 'badge badge-warning'}">${p.stock}</span>
            </div>
          `).join('')
        }
      </div>
    </div>
  `;
}