/* ALDOAGRO — Chat automático con IA (Cloudflare Workers AI) */
(function () {
  const chatFab = document.getElementById('chatFab');
  const chatPanel = document.getElementById('chatPanel');
  const chatInput = document.getElementById('chatInput');
  const chatSend = document.getElementById('chatSend');
  if (!chatFab || !chatPanel || !chatInput || !chatSend) return;

  const chatBody = chatPanel.querySelector('.chat-body');
  const history = [];
  let sending = false;

  chatFab.addEventListener('click', () => chatPanel.classList.toggle('open'));

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
})();
