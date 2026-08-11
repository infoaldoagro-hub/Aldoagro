/* ALDOAGRO — Formulario de contacto emergente (reutilizable en cualquier página) */
(function () {
  const WHATSAPP_NUMBER = '34722193780';

  function buildModal() {
    if (document.getElementById('contactModal')) return;
    const wrap = document.createElement('div');
    wrap.id = 'contactModal';
    wrap.className = 'contact-modal';
    wrap.innerHTML =
      '<div class="contact-modal-backdrop" data-close="1"></div>' +
      '<div class="contact-modal-box">' +
        '<button type="button" class="contact-modal-close" aria-label="Cerrar" data-close="1">✕</button>' +
        '<div class="contact-modal-form">' +
          '<h3>Contáctanos</h3>' +
          '<p class="contact-modal-sub">Escríbenos y te respondemos lo antes posible.</p>' +
          '<input type="text" id="cmNombre" placeholder="Tu nombre">' +
          '<input type="email" id="cmEmail" placeholder="Tu email">' +
          '<textarea id="cmMensaje" placeholder="¿En qué podemos ayudarte?" rows="4"></textarea>' +
          '<div class="contact-modal-actions">' +
            '<button type="button" id="cmSend" class="btn btn-primary">✉️ Enviar mensaje</button>' +
            '<button type="button" id="cmWhatsapp" class="btn btn-whatsapp">💬 WhatsApp</button>' +
          '</div>' +
          '<p id="cmHint" class="contact-modal-hint"></p>' +
        '</div>' +
        '<div class="contact-modal-success" style="display:none;">' +
          '<div class="contact-modal-check">✅</div>' +
          '<h3>¡Gracias por escribirnos!</h3>' +
          '<p>En breve un técnico se contactará contigo.</p>' +
          '<button type="button" class="btn btn-outline" data-close="1">Cerrar</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(wrap);

    const style = document.createElement('style');
    style.textContent =
      '.contact-modal{position:fixed; inset:0; z-index:200; display:none; align-items:center; justify-content:center; padding:20px;}' +
      '.contact-modal.open{display:flex;}' +
      '.contact-modal-backdrop{position:absolute; inset:0; background:rgba(17,38,31,.55);}' +
      '.contact-modal-box{position:relative; background:var(--papel,#fff); border-radius:16px; padding:32px 28px; max-width:420px; width:100%; box-shadow:0 30px 60px -20px rgba(17,38,31,.4);}' +
      '.contact-modal-close{position:absolute; top:14px; right:14px; background:none; border:none; font-size:18px; cursor:pointer; color:var(--gris,#5B6B64);}' +
      '.contact-modal-box h3{font-family:"Space Grotesk",sans-serif; font-size:20px; margin-bottom:6px; color:var(--tinta,#16261F);}' +
      '.contact-modal-sub{color:var(--gris,#5B6B64); font-size:14px; margin-bottom:18px;}' +
      '.contact-modal-box input, .contact-modal-box textarea{width:100%; padding:11px 14px; margin-bottom:10px; border:1px solid var(--borde,#DCEAE3); border-radius:8px; font-family:inherit; font-size:14px; resize:vertical;}' +
      '.contact-modal-actions{display:flex; gap:10px; flex-wrap:wrap; margin-top:4px;}' +
      '.contact-modal-actions .btn{flex:1; white-space:nowrap;}' +
      '.contact-modal-hint{font-size:12px; margin-top:10px; min-height:14px; color:var(--gris,#5B6B64);}' +
      '.contact-modal-success{text-align:center; padding:12px 4px;}' +
      '.contact-modal-check{font-size:38px; margin-bottom:10px;}' +
      '.contact-modal-success h3{margin-bottom:8px;}' +
      '.contact-modal-success p{color:var(--gris,#5B6B64); margin-bottom:20px;}';
    document.head.appendChild(style);

    wrap.addEventListener('click', function (e) {
      if (e.target.getAttribute && e.target.getAttribute('data-close')) close();
    });

    document.getElementById('cmSend').addEventListener('click', function () {
      const nombre = document.getElementById('cmNombre').value.trim();
      const email = document.getElementById('cmEmail').value.trim();
      const mensaje = document.getElementById('cmMensaje').value.trim();
      const hint = document.getElementById('cmHint');
      if (!nombre || !email || !mensaje) {
        hint.textContent = 'Completá nombre, email y mensaje.';
        hint.style.color = '#C45C26';
        return;
      }
      const btn = document.getElementById('cmSend');
      btn.disabled = true;
      btn.textContent = 'Enviando...';
      fetch('/api/contacto', {
        method: 'POST',
        body: new URLSearchParams({ nombre: nombre, email: email, mensaje: mensaje }),
      })
        .then(function (res) { return res.json().then(function (data) { return { ok: res.ok && data.ok }; }); })
        .then(function (result) {
          if (result.ok) {
            wrap.querySelector('.contact-modal-form').style.display = 'none';
            wrap.querySelector('.contact-modal-success').style.display = 'block';
          } else {
            btn.disabled = false;
            btn.textContent = '✉️ Enviar mensaje';
            hint.textContent = 'No se pudo enviar. Probá de nuevo o escribinos por WhatsApp.';
            hint.style.color = '#C45C26';
          }
        })
        .catch(function () {
          btn.disabled = false;
          btn.textContent = '✉️ Enviar mensaje';
          hint.textContent = 'No se pudo enviar. Probá de nuevo o escribinos por WhatsApp.';
          hint.style.color = '#C45C26';
        });
    });

    document.getElementById('cmWhatsapp').addEventListener('click', function () {
      const mensaje = document.getElementById('cmMensaje').value.trim() || 'Hola, quisiera más información.';
      window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(mensaje), '_blank');
    });
  }

  function open(context) {
    buildModal();
    const wrap = document.getElementById('contactModal');
    wrap.querySelector('.contact-modal-form').style.display = 'block';
    wrap.querySelector('.contact-modal-success').style.display = 'none';
    document.getElementById('cmNombre').value = '';
    document.getElementById('cmEmail').value = '';
    document.getElementById('cmMensaje').value = context ? ('Consulta sobre: ' + context + '\n\n') : '';
    document.getElementById('cmHint').textContent = '';
    document.getElementById('cmSend').disabled = false;
    document.getElementById('cmSend').textContent = '✉️ Enviar mensaje';
    wrap.classList.add('open');
    setTimeout(function () { document.getElementById('cmNombre').focus(); }, 50);
  }

  function close() {
    const wrap = document.getElementById('contactModal');
    if (wrap) wrap.classList.remove('open');
  }

  window.AldoContact = { open: open, close: close };

  document.addEventListener('click', function (e) {
    const a = e.target.closest('a[href="index.html#contacto"]');
    if (!a) return;
    e.preventDefault();
    let context = '';
    const card = a.closest('.product-card, .cat-card, article, .service-card');
    if (card) {
      const cartBtn = card.querySelector('[data-add-cart]');
      if (cartBtn) context = cartBtn.getAttribute('data-add-cart');
      else {
        const heading = card.querySelector('h2, h3, h4');
        if (heading) context = heading.textContent.trim();
      }
    }
    open(context);
  });
})();
