import { EmailMessage } from "cloudflare:email";

const DEST_EMAIL = "infoaldoagro@gmail.com";
const FROM_EMAIL = "web@aldoagro.com";

const CHAT_SYSTEM_PROMPT =
  "Eres el asistente virtual de ALDOAGRO, una empresa familiar hondureña con sede en Tocoa, Colón, " +
  "fundada en 2024, con almacenes en Honduras, Estados Unidos y España. " +
  "ALDOAGRO vende repuestos y maquinaria agrícola, industrial y de camionería, ofrece servicios técnicos " +
  "(implementos, repuestos, mantenimiento), y también maquinaria de jardinería/solar, equipos de pesca " +
  "y equipamiento personal. " +
  "Responde siempre en español, de forma breve, cordial y directa (máximo 3-4 oraciones). " +
  "No inventes precios, referencias exactas ni disponibilidad de stock: si te preguntan eso, o si el " +
  "visitante quiere que un técnico le dé seguimiento, decile que complete su nombre y email arriba del " +
  "chat y presione 'Finalizar y enviar conversación por correo', o que escriba por WhatsApp. " +
  "No proceses pagos ni compras, solo das información y orientás al visitante.";

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function escapeHeader(str) {
  return String(str).replace(/[\r\n]/g, " ").slice(0, 300);
}

function encodeSubject(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return "=?UTF-8?B?" + btoa(binary) + "?=";
}

function utf8Binary(str) {
  const bytes = new TextEncoder().encode(str);
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += String.fromCharCode(bytes[i]);
  return out;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/api/contacto") {
      let nombre, email, mensaje;
      try {
        const data = await request.formData();
        nombre = (data.get("nombre") || "").toString().trim();
        email = (data.get("email") || "").toString().trim();
        mensaje = (data.get("mensaje") || "").toString().trim();
      } catch (err) {
        return json({ ok: false, error: "invalid_form" }, 400);
      }

      if (!nombre || !email || !mensaje) {
        return json({ ok: false, error: "missing_fields" }, 400);
      }

      const subject = encodeSubject(escapeHeader("Nuevo mensaje de contacto - " + nombre));
      const bodyText =
        "Nombre: " + nombre + "\r\n" +
        "Email: " + email + "\r\n\r\n" +
        "Mensaje:\r\n" + mensaje + "\r\n";

      const raw =
        'From: "Aldoagro" <' + FROM_EMAIL + '>\r\n' +
        "To: " + DEST_EMAIL + "\r\n" +
        "Reply-To: " + escapeHeader(email) + "\r\n" +
        "Subject: " + subject + "\r\n" +
        "Content-Type: text/plain; charset=UTF-8\r\n" +
        "Content-Transfer-Encoding: 8bit\r\n" +
        "MIME-Version: 1.0\r\n\r\n" +
        utf8Binary(bodyText);

      try {
        const msg = new EmailMessage(FROM_EMAIL, DEST_EMAIL, raw);
        await env.SEB.send(msg);
        return json({ ok: true });
      } catch (err) {
        return json({ ok: false, error: "send_failed", detail: String(err) }, 502);
      }
    }

    if (request.method === "POST" && url.pathname === "/api/chat") {
      let body;
      try {
        body = await request.json();
      } catch (err) {
        return json({ ok: false, error: "invalid_json" }, 400);
      }

      const message = (body && body.message ? String(body.message) : "").trim().slice(0, 500);
      if (!message) {
        return json({ ok: false, error: "empty_message" }, 400);
      }

      const historyIn = Array.isArray(body.history) ? body.history : [];
      const history = historyIn
        .slice(-6)
        .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
        .map((m) => ({ role: m.role, content: String(m.content).slice(0, 500) }));

      const messages = [
        { role: "system", content: CHAT_SYSTEM_PROMPT },
        ...history,
        { role: "user", content: message },
      ];

      try {
        const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct-fast", {
          messages: messages,
          max_tokens: 300,
        });
        const reply = (result && result.response ? String(result.response) : "").trim();
        if (!reply) throw new Error("empty_response");
        return json({ ok: true, reply: reply });
      } catch (err) {
        return json({ ok: false, error: "ai_failed", detail: String(err) }, 502);
      }
    }

    return env.ASSETS.fetch(request);
  },
};
