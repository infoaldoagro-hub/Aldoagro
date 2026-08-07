/* Aldo Agro — Lista de pedido (NO es un carrito de compra: no procesa pagos, solo arma un listado para enviar por correo o WhatsApp) */
(function () {
  const CART_KEY = 'aldoagro_cart';
  const WHATSAPP_NUMBER = '34722193780';
  const CART_EMAIL = 'contacto@aldoagro.com';

  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { return []; }
  }
  function saveCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    renderCartCount();
    renderCartList();
  }
  function addToCart(name) {
    const items = getCart();
    items.push({ name: name, id: Date.now() + '-' + Math.random().toString(36).slice(2, 7) });
    saveCart(items);
    pulseCartFab();
  }
  function pulseCartFab() {
    document.querySelectorAll('.cart-fab').forEach(function (btn) {
      btn.classList.remove('pulse');
      void btn.offsetWidth;
      btn.classList.add('pulse');
      setTimeout(function () { btn.classList.remove('pulse'); }, 600);
    });
  }
  function removeFromCart(id) {
    saveCart(getCart().filter(function (i) { return i.id !== id; }));
  }
  function clearCart() {
    saveCart([]);
  }
  function renderCartCount() {
    const count = getCart().length;
    document.querySelectorAll('.cart-count').forEach(function (el) {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
  }
  function renderCartList() {
    const list = document.getElementById('cartList');
    if (!list) return;
    const items = getCart();
    if (items.length === 0) {
      list.innerHTML = '<p class="cart-empty">Tu lista está vacía. Agregá productos con el botón "Añadir a mi lista".</p>';
      return;
    }
    list.innerHTML = items.map(function (i) {
      return '<div class="cart-item"><span>' + escapeHtml(i.name) + '</span><button data-remove="' + i.id + '" aria-label="Quitar">✕</button></div>';
    }).join('');
    list.querySelectorAll('[data-remove]').forEach(function (btn) {
      btn.addEventListener('click', function () { removeFromCart(btn.getAttribute('data-remove')); });
    });
  }
  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }
  function buildListText() {
    const items = getCart();
    if (items.length === 0) return '';
    return items.map(function (i, idx) { return (idx + 1) + '. ' + i.name; }).join('\n');
  }
  function openCart() {
    const p = document.getElementById('cartPanel');
    if (p) p.classList.add('open');
  }
  function closeCart() {
    const p = document.getElementById('cartPanel');
    if (p) p.classList.remove('open');
  }

  window.AldoCart = { addToCart: addToCart, removeFromCart: removeFromCart, clearCart: clearCart, buildListText: buildListText };

  document.addEventListener('DOMContentLoaded', function () {
    renderCartCount();
    renderCartList();

    document.querySelectorAll('.cart-fab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const panel = document.getElementById('cartPanel');
        if (panel) panel.classList.toggle('open');
      });
    });
    const closeBtn = document.getElementById('cartClose');
    if (closeBtn) closeBtn.addEventListener('click', closeCart);
    const clearBtn = document.getElementById('cartClear');
    if (clearBtn) clearBtn.addEventListener('click', clearCart);

    const sendEmailBtn = document.getElementById('cartSendEmail');
    if (sendEmailBtn) sendEmailBtn.addEventListener('click', function () {
      const text = buildListText();
      if (!text) { alert('Tu lista está vacía.'); return; }
      const subject = encodeURIComponent('Lista de pedido — Aldo Agro');
      const body = encodeURIComponent('Hola, quisiera solicitar disponibilidad y precio de:\n\n' + text);
      window.location.href = 'mailto:' + CART_EMAIL + '?subject=' + subject + '&body=' + body;
    });

    const sendWaBtn = document.getElementById('cartSendWhatsapp');
    if (sendWaBtn) sendWaBtn.addEventListener('click', function () {
      const text = buildListText();
      if (!text) { alert('Tu lista está vacía.'); return; }
      const msg = 'Hola, quisiera solicitar disponibilidad y precio de:\n\n' + text;
      window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg), '_blank');
    });

    document.querySelectorAll('[data-add-cart]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        addToCart(btn.getAttribute('data-add-cart'));
      });
    });
  });
})();
