import { EmailMessage } from "cloudflare:email";

const DEST_EMAIL = "infoaldoagro@gmail.com";
const FROM_EMAIL = "web@aldoagro.com";

const CATALOGO =
  "CATALOGO REAL DE ALDOAGRO (usa estos datos exactos cuando te pregunten por una referencia, producto o precio):\n" +
  "\nREPUESTOS AGRICOLA:\n" +
  "- Kit filtros motor tractor, Ref. AA-FTR-110, 48 EUR/kit\n" +
  "- Neumatico radial 480/70 R28, Ref. AA-NEU-480, precio a consultar\n" +
  "- Bomba hidraulica principal, Ref. AA-HID-220, desde 320 EUR\n" +
  "- Correa trapecial cosechadora, Ref. AA-COR-55, desde 28 EUR\n" +
  "- Discos de arado/grada, Ref. AA-DIS-18, desde 22 EUR\n" +
  "- Boquillas y filtros pulverizador, Ref. AA-PUL-09, desde 3,50 EUR\n" +
  "\nREPUESTOS INDUSTRIAL:\n" +
  "- Rodamiento de rodillos conicos, Ref. AI-ROD-320, desde 18 EUR\n" +
  "- Bomba de engranajes, Ref. AI-HID-45, desde 145 EUR\n" +
  "- Juntas y retenes hidraulicos, Ref. AI-SEL-12, desde 6 EUR\n" +
  "- Filtro hidraulico retorno, Ref. AI-FIL-80, desde 35 EUR\n" +
  "- Correas industriales dentadas, Ref. AI-COR-HTD, desde 24 EUR\n" +
  "- Valvula direccional 4/3, Ref. AI-VAL-43, desde 95 EUR\n" +
  "\nREPUESTOS CAMIONERIA:\n" +
  "- Pastillas y discos freno, Ref. AC-FRE-210, desde 65 EUR\n" +
  "- Neumatico 315/80 R22.5, Ref. AC-NEU-315, precio a consultar\n" +
  "- Kit filtros motor camion, Ref. AC-FIL-EU6, desde 72 EUR\n" +
  "- Amortiguadores y ballestas, Ref. AC-SUS-40, desde 85 EUR\n" +
  "- Faros y pilotos LED, Ref. AC-LED-12, desde 29 EUR\n" +
  "- Kit embrague completo, Ref. AC-EMB-430, desde 280 EUR\n" +
  "\nSERVICIOS Y TIENDA:\n" +
  "- Sembradora de precision, desde 4.500 EUR\n" +
  "- Kit de filtros motor, desde 48 EUR\n" +
  "- Neumaticos agricolas, precio a consultar\n" +
  "- Revision pre-campana (servicio tecnico), desde 180 EUR\n" +
  "- Plan de mantenimiento anual, precio a consultar\n" +
  "- Componentes hidraulicos, desde 35 EUR\n" +
  "\nMAQUINARIAS (categorias, consultar catalogo completo en la pagina Maquinarias):\n" +
  "- Maquinaria jardinera y solar\n" +
  "- Pesca (motores, redes, sondas, chalecos)\n" +
  "- Equipamiento personal\n";

const CHAT_SYSTEM_PROMPT =
  "Eres el asistente virtual de ALDOAGRO, una empresa familiar hondureña con sede en Tocoa, Colón, " +
  "fundada en 2024, con almacenes en Honduras, Estados Unidos y España. " +
  "ALDOAGRO vende repuestos y maquinaria agrícola, industrial y de camionería, ofrece servicios técnicos " +
  "(implementos, repuestos, mantenimiento), y también maquinaria de jardinería/solar, equipos de pesca " +
  "y equipamiento personal.\n\n" +
  CATALOGO +
  "\nResponde siempre en español, de forma breve, cordial y directa (máximo 3-4 oraciones). " +
  "Si preguntan por una referencia, producto o precio que SÍ está en el catálogo de arriba, respondé con esos " +
  "datos exactos (nombre, referencia y precio). " +
  "Si preguntan por una referencia o producto que NO está en esa lista, no digas simplemente que no la tenés: " +
  "explicá que no está en el catálogo inmediato pero que ALDOAGRO puede conseguirla por pedido especial, y " +
  "sugerí completar nombre y email arriba del chat y presionar 'Finalizar y enviar conversación por correo', " +
  "o escribir por WhatsApp, para que un técnico confirme disponibilidad y precio real. " +
  "No inventes referencias, precios ni disponibilidad de stock que no estén en el catálogo. " +
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

    const assetResponse = await env.ASSETS.fetch(request);
    const response = new Response(assetResponse.body, assetResponse);
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "SAMEORIGIN");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    response.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline'; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "img-src 'self' data: https:; " +
        "frame-src https://www.youtube.com https://www.google.com; " +
        "connect-src 'self'"
    );
    return response;
  },
};
