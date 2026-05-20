// ── GLOBAL STORE ──────────────────────────────────────────────────────────────
const Store = {
  cart: [],
  cartCount: 0,

  async loadCart() {
    const user = Session.get();
    if (!user || user.role !== 'cliente') return;
    try {
      this.cart = await api.getCart(user.id);
      this.cartCount = this.cart.reduce((s, i) => s + i.quantity, 0);
      this.updateCartBadge();
    } catch (e) { this.cart = []; }
  },

  async addToCart(productId, qty = 1) {
    const user = Session.get();
    if (!user) return;
    try {
      await api.addToCart({ client_id: user.id, product_id: productId, quantity: qty });
      await this.loadCart();
      toast('Produto adicionado ao carrinho!', 'success');
    } catch (e) {
      toast('Erro ao adicionar produto', 'error');
    }
  },

  async removeFromCart(itemId) {
    try {
      await api.removeCartItem(itemId);
      await this.loadCart();
      this.renderCart();
    } catch (e) {
      toast('Erro ao remover item', 'error');
    }
  },

  async updateQty(itemId, qty) {
    try {
      await api.updateCartItem(itemId, { quantity: qty });
      await this.loadCart();
      this.renderCart();
    } catch (e) {
      toast('Erro ao atualizar quantidade', 'error');
    }
  },

  updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    if (badge) {
      badge.textContent = this.cartCount;
      badge.style.display = this.cartCount > 0 ? 'flex' : 'none';
    }
  },

  renderCart() {
    const container = document.getElementById('cartItems');
    const footer = document.getElementById('cartFooter');
    if (!container || !footer) return;

    if (this.cart.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🛒</div>
          <div class="empty-title">Carrinho vazio</div>
          <p style="color:var(--text3);font-size:0.85rem">Adicione produtos para começar!</p>
        </div>`;
      footer.innerHTML = '';
      return;
    }

    container.innerHTML = this.cart.map(item => `
      <div class="cart-item">
        <img class="cart-item-img" src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/56x56/141c2e/00F5D4?text=📦'">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">${formatCurrency(item.price * item.quantity)}</div>
          <div class="cart-item-qty">
            <button class="qty-btn" onclick="Store.updateQty('${item.id}', ${item.quantity - 1})">−</button>
            <span style="font-size:0.875rem;font-weight:600">${item.quantity}</span>
            <button class="qty-btn" onclick="Store.updateQty('${item.id}', ${item.quantity + 1})">+</button>
            <button class="qty-btn" onclick="Store.removeFromCart('${item.id}')" style="margin-left:auto;color:var(--danger)">🗑</button>
          </div>
        </div>
      </div>
    `).join('');

    const total = this.cart.reduce((s, i) => s + i.price * i.quantity, 0);
    footer.innerHTML = `
      <div class="cart-total">
        <span class="cart-total-label">Total</span>
        <span class="cart-total-value">${formatCurrency(total)}</span>
      </div>
      <button class="btn btn-primary" style="width:100%" onclick="showCheckout()">
        Finalizar Compra →
      </button>
      <button class="btn btn-ghost" style="width:100%;margin-top:8px" onclick="closeCart()">
        Continuar Comprando
      </button>`;
  }
};

// ── CHECKOUT ──────────────────────────────────────────────────────────────────
async function showCheckout() {
  await Store.loadCart();
  const total = Store.cart.reduce((s, i) => s + i.price * i.quantity, 0);

  showModal(`
    <div class="modal-title">💳 Finalizar Compra</div>

    <div style="background:var(--surface);border-radius:var(--radius-sm);padding:16px;margin-bottom:20px">
      ${Store.cart.map(i => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
          <span style="font-size:0.875rem">${i.name} ×${i.quantity}</span>
          <span style="color:var(--accent);font-weight:700">${formatCurrency(i.price * i.quantity)}</span>
        </div>
      `).join('')}
      <div style="display:flex;justify-content:space-between;margin-top:12px">
        <strong>Total</strong>
        <strong style="color:var(--accent);font-size:1.1rem">${formatCurrency(total)}</strong>
      </div>
    </div>

    <div style="margin-bottom:16px">
      <div class="form-label">Forma de Pagamento</div>
      <div class="payment-methods">
        <div class="payment-method selected" data-method="pix" onclick="selectPayment(this,'pix')">
          <div class="pm-icon">📱</div>
          <div class="pm-name">PIX</div>
        </div>
        <div class="payment-method" data-method="credit" onclick="selectPayment(this,'credit')">
          <div class="pm-icon">💳</div>
          <div class="pm-name">Crédito</div>
        </div>
        <div class="payment-method" data-method="boleto" onclick="selectPayment(this,'boleto')">
          <div class="pm-icon">📄</div>
          <div class="pm-name">Boleto</div>
        </div>
      </div>
    </div>

    <div id="paymentDetails" style="margin-bottom:20px"></div>
    ${renderPaymentDetails('pix')}

    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="confirmOrder()">Confirmar Pedido</button>
    </div>
  `, { wide: false });

  window._selectedPayment = 'pix';
}

function selectPayment(el, method) {
  document.querySelectorAll('.payment-method').forEach(p => p.classList.remove('selected'));
  el.classList.add('selected');
  window._selectedPayment = method;
  document.getElementById('paymentDetails').innerHTML = renderPaymentDetails(method);
}

function renderPaymentDetails(method) {
  if (method === 'pix') {
    return `<div id="paymentDetails" style="background:var(--surface);border-radius:var(--radius-sm);padding:16px;text-align:center">
      <div style="font-size:2rem;margin-bottom:8px">📲</div>
      <div style="font-family:var(--font-mono);font-size:0.8rem;color:var(--accent);letter-spacing:0.05em">CHAVE PIX: faceshop@pix.com.br</div>
      <div style="font-size:0.75rem;color:var(--text3);margin-top:6px">Pagamento instantâneo aprovado automaticamente</div>
    </div>`;
  }
  if (method === 'credit') {
    return `<div id="paymentDetails">
      <div class="form-group">
        <label class="form-label">Número do Cartão</label>
        <input class="form-input" placeholder="0000 0000 0000 0000" maxlength="19"
          oninput="this.value=this.value.replace(/\D/g,'').replace(/(.{4})/g,'$1 ').trim()">
      </div>
      <div style="display:grid;grid-template-columns:2fr 1fr;gap:12px">
        <div class="form-group">
          <label class="form-label">Validade</label>
          <input class="form-input" placeholder="MM/AA" maxlength="5"
            oninput="this.value=this.value.replace(/\D/g,'').replace(/(\d{2})(\d)/,'$1/$2')">
        </div>
        <div class="form-group">
          <label class="form-label">CVV</label>
          <input class="form-input" placeholder="123" maxlength="3" type="password">
        </div>
      </div>
    </div>`;
  }
  return `<div id="paymentDetails" style="background:var(--surface);border-radius:var(--radius-sm);padding:16px;text-align:center">
    <div style="font-size:2rem;margin-bottom:8px">📄</div>
    <div style="font-size:0.8rem;color:var(--text2)">Boleto gerado após confirmação.<br>Prazo de pagamento: 3 dias úteis.</div>
  </div>`;
}

async function confirmOrder() {
  const user = Session.get();
  if (!user || Store.cart.length === 0) return;

  try {
    const items = Store.cart.map(i => ({
      product_id: i.product_id,
      quantity: i.quantity,
      unit_price: i.price
    }));
    const total = Store.cart.reduce((s, i) => s + i.price * i.quantity, 0);

    await api.createOrder({
      client_id: user.id,
      items,
      total,
      payment_method: window._selectedPayment || 'pix'
    });

    closeModal();
    closeCart();
    await Store.loadCart();
    Store.renderCart();

    toast('🎉 Pedido realizado com sucesso!', 'success');
    showOrderSuccess();
  } catch (e) {
    toast('Erro ao confirmar pedido: ' + e.message, 'error');
  }
}

function showOrderSuccess() {
  showModal(`
    <div style="text-align:center;padding:16px">
      <div style="font-size:4rem;margin-bottom:16px;animation:float 2s ease-in-out infinite">🎉</div>
      <div class="modal-title" style="text-align:center">Pedido Confirmado!</div>
      <p style="color:var(--text2);margin-bottom:24px">
        Seu pedido foi realizado com sucesso e está sendo processado.
      </p>
      <div style="background:var(--surface);border-radius:var(--radius-sm);padding:16px;margin-bottom:24px">
        <div style="font-family:var(--font-mono);font-size:0.75rem;color:var(--text3)">PAGAMENTO</div>
        <div style="font-size:1.1rem;color:var(--success);font-weight:700;margin-top:4px">✓ Aprovado</div>
      </div>
      <button class="btn btn-primary" onclick="closeModal()" style="width:100%">
        Continuar Comprando
      </button>
    </div>
  `);
}