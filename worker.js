import { EmailMessage } from "cloudflare:email";

const DEST_EMAIL = "contacto@aldoagro.com";
const FROM_EMAIL = "web@aldoagro.com";

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function escapeHeader(str) {
  return String(str).replace(/[\r\n]/g, " ").slice(0, 300);
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

      const subject = escapeHeader("Nuevo mensaje de contacto - " + nombre);
      const bodyText =
        "Nombre: " + nombre + "\r\n" +
        "Email: " + email + "\r\n\r\n" +
        "Mensaje:\r\n" + mensaje + "\r\n";

      const raw =
        'From: "Aldo Agro Web" <' + FROM_EMAIL + '>\r\n' +
        "To: " + DEST_EMAIL + "\r\n" +
        "Reply-To: " + escapeHeader(email) + "\r\n" +
        "Subject: " + subject + "\r\n" +
        "Content-Type: text/plain; charset=UTF-8\r\n" +
        "MIME-Version: 1.0\r\n\r\n" +
        bodyText;

      try {
        const msg = new EmailMessage(FROM_EMAIL, DEST_EMAIL, raw);
        await env.SEB.send(msg);
        return json({ ok: true });
      } catch (err) {
        return json({ ok: false, error: "send_failed", detail: String(err) }, 502);
      }
    }

    return env.ASSETS.fetch(request);
  },
};
