/* ALDOAGRO — Chat automático con IA (Cloudflare Workers AI) + envío de conversación por correo */
(function () {
  const chatFab = document.getElementById('chatFab');
  const chatPanel = document.getElementById('chatPanel');
  const chatInput = document.getElementById('chatInput');
  const chatSend = document.getElementById('chatSend');
  if (!chatFab || !chatPanel || !chatInput || !chatSend) return;

  const chatBody = chatPanel.querySelector('.chat-body');
  const chatFoot = chatPanel.querySelector('.chat-foot');
  const history = [];
  let sending = false;

  chatFab.addEventListener('click', () => chatPanel.classList.toggle('open'));

  const style = document.createElement('style');
  style.textContent =
    '.chat-info-bar{display:flex; gap:6px; padding:0 18px 10px;}' +
    '.chat-info-bar input{flex:1; min-width:0; border:1px solid var(--borde,#DCEAE3); border-radius:8px; padding:7px 10px; font-size:12px; font-family:inherit;}' +
    '.chat-finish-bar{padding:8px 12px 12px; border-top:1px solid var(--borde,#DCEAE3);}' +
    '.chat-finish-bar button{width:100%; background:none; border:1px solid var(--verde,#1B8A5A); color:var(--verde-oscuro,#115C3C); border-radius:8px; padding:8px; font-size:12px; font-weight:600; cursor:pointer; font-family:inherit;}' +
    '.chat-finish-bar button:disabled{opacity:.6; cursor:default;}';
  document.head.appendChild(style);

  const infoBar = document.createElement('div');
  infoBar.className = 'chat-info-bar';
  infoBar.innerHTML =
    '<input type="text" id="chatName" placeholder="Tu nombre">' +
    '<input type="email" id="chatEmail" placeholder="Tu email">';
  chatPanel.insertBefore(infoBar, chatFoot);

  const finishBar = document.createElement('div');
  finishBar.className = 'chat-finish-bar';
  finishBar.innerHTML = '<button type="button" id="chatFinish">✓ Finalizar y enviar conversación por correo</button>';
  chatPanel.appendChild(finishBar);

  function addBubble(text, who) {
    const b = document.createElement('div');
    b.className = 'chat-bubble' + (who === 'user' ? ' chat-bubble-user' : '');
    b.textContent = text;
    chatBody.appendChild(b);
    chatBody.scrollTop = chatBody.scrollHeight;
    return b;
  }

  function addWhatsappFallback() {
    const wrap = document.createElement('div');
    wrap.className = 'chat-bubble';
    const link = document.createElement('a');
    link.href = 'https://wa.me/34722193780';
    link.target = '_blank';
    link.textContent = '💬 Prefiero escribir por WhatsApp';
    link.style.color = 'var(--verde-oscuro, #115C3C)';
    link.style.fontWeight = '600';
    wrap.appendChild(link);
    chatBody.appendChild(wrap);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function send() {
    if (sending) return;
    const msg = chatInput.value.trim();
    if (!msg) return;
    addBubble(msg, 'user');
    chatInput.value = '';
    sending = true;
    chatSend.disabled = true;
    const typing = addBubble('Escribiendo...', 'bot');

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: msg, history: history }),
    })
      .then((res) => res.json())
      .then((data) => {
        typing.remove();
        if (data && data.ok && data.reply) {
          addBubble(data.reply, 'bot');
          history.push({ role: 'user', content: msg });
          history.push({ role: 'assistant', content: data.reply });
        } else {
          addBubble('No pude responder en este momento. ¿Querés escribirnos por WhatsApp?', 'bot');
          addWhatsappFallback();
        }
      })
      .catch(() => {
        typing.remove();
        addBubble('No pude responder en este momento. ¿Querés escribirnos por WhatsApp?', 'bot');
        addWhatsappFallback();
      })
      .finally(() => {
        sending = false;
        chatSend.disabled = false;
      });
  }

  chatSend.addEventListener('click', send);
  chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });

  const chatFinish = document.getElementById('chatFinish');
  chatFinish.addEventListener('click', function () {
    const name = document.getElementById('chatName').value.trim();
    const email = document.getElementById('chatEmail').value.trim();
    if (!name || !email) {
      alert('Completá tu nombre y email para que te contactemos.');
      return;
    }
    if (history.length === 0) {
      alert('Escribinos algo en el chat antes de finalizar.');
      return;
    }
    const transcript = history
      .map((m) => (m.role === 'user' ? 'Visitante: ' : 'Asistente: ') + m.content)
      .join('\n\n');
    chatFinish.disabled = true;
    chatFinish.textContent = 'Enviando...';
    fetch('/api/contacto', {
      method: 'POST',
      body: new URLSearchParams({
        nombre: name,
        email: email,
        mensaje: 'Conversación del chat del sitio web:\n\n' + transcript,
      }),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok && data.ok })))
      .then((result) => {
        if (result.ok) {
          chatFinish.textContent = '✓ Conversación enviada';
          addBubble('¡Listo! Te enviamos la conversación a nuestro equipo, en breve un técnico se contactará contigo.', 'bot');
        } else {
          chatFinish.disabled = false;
          chatFinish.textContent = '✓ Finalizar y enviar conversación por correo';
          alert('No se pudo enviar. Probá de nuevo o escribinos por WhatsApp.');
        }
      })
      .catch(() => {
        chatFinish.disabled = false;
        chatFinish.textContent = '✓ Finalizar y enviar conversación por correo';
        alert('No se pudo enviar. Probá de nuevo o escribinos por WhatsApp.');
      });
  });
})();
