// Nimmt die Formulare von rev2-marketing.at entgegen und schickt sie als E-Mail über Resend.
// Benötigte Environment Variables in Vercel:
//   RESEND_API_KEY   API-Key von resend.com
//   MAIL_TO          Empfänger, z. B. max@rev2.at
//   MAIL_FROM        Absender, z. B. "rev2 <anfrage@rev2.at>" (Domain bei Resend verifizieren)
// Optional:
//   HUBSPOT_TOKEN    Private-App-Token; wenn gesetzt, wird zusätzlich ein Kontakt in HubSpot angelegt

export const config = { maxDuration: 30 };

const MAX_FILE = 10 * 1024 * 1024; // 10 MB pro Datei
const LABELS = {
  thema: "Thema", leistung: "Leistung", budget: "Budget", website: "Website / LinkedIn", quelle: "Gesehen über",
  firma: "Firma", buero: "Büro", name: "Name", email: "E-Mail", telefon: "Telefon", nachricht: "Nachricht", datenschutz: "Datenschutz"
};
const SUBJECTS = { kontakt: "Anfrage Rev2 Marketing", projekt: "Projektanfrage Rev2 Marketing", cases: "Anfrage über Cases", ai: "Anfrage AI Content" };

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8" } });
}

export function GET() { return json(405, { ok: false, error: "method" }); }

export async function POST(request) {

  let form;
  try { form = await request.formData(); } catch (e) { return json(400, { ok: false, error: "form" }); }

  // Honeypot
  if (form.get("firma-website")) return json(200, { ok: true });

  const formName = String(form.get("form-name") || "anfrage");
  const fields = [];
  const attachments = [];
  let totalSize = 0;

  for (const [key, value] of form.entries()) {
    if (key === "form-name" || key === "firma-website") continue;
    if (typeof value === "string") {
      if (value.trim()) fields.push([LABELS[key] || key, value.trim()]);
    } else if (value && value.size) {
      if (value.size > MAX_FILE) return json(413, { ok: false, error: "file-too-large" });
      totalSize += value.size;
      if (totalSize > 25 * 1024 * 1024) return json(413, { ok: false, error: "files-too-large" });
      const buf = Buffer.from(await value.arrayBuffer());
      attachments.push({ filename: value.name || "anhang", content: buf.toString("base64") });
    }
  }

  const email = fields.find((f) => f[0] === "E-Mail")?.[1] || "";
  const name = fields.find((f) => f[0] === "Name")?.[1] || "";
  const firma = fields.find((f) => f[0] === "Firma" || f[0] === "Büro")?.[1] || "";
  const thema = fields.find((f) => f[0] === "Thema")?.[1] || "";
  const subject = (SUBJECTS[formName] || "Anfrage Rev2 Marketing") + (thema && formName === "kontakt" ? " · " + thema : "") + ": " + (firma || name || email);

  const rows = fields.map(([k, v]) =>
    `<tr><td style="padding:6px 12px 6px 0;color:#596072;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:6px 0;white-space:pre-wrap">${esc(v)}</td></tr>`
  ).join("");
  const html = `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:15px;color:#0a0c12">
    <p style="font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#b8900a;margin:0 0 8px">rev2-marketing.at · ${esc(formName)}</p>
    <h2 style="margin:0 0 16px;font-size:20px">${esc(subject)}</h2>
    <table style="border-collapse:collapse">${rows}</table>
    ${attachments.length ? `<p style="margin-top:16px;color:#596072">${attachments.length} Datei(en) im Anhang</p>` : ""}
  </div>`;
  const text = fields.map(([k, v]) => `${k}: ${v}`).join("\n");

  const key = process.env.RESEND_API_KEY;
  if (!key) return json(500, { ok: false, error: "mail-not-configured" });

  const payload = {
    from: process.env.MAIL_FROM || "Rev2 Marketing <onboarding@resend.dev>",
    to: [process.env.MAIL_TO || "max@rev2.at"],
    reply_to: email || undefined,
    subject,
    html,
    text,
    attachments: attachments.length ? attachments : undefined
  };

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!r.ok) {
    const detail = await r.text().catch(() => "");
    console.error("Resend error", r.status, detail);
    return json(502, { ok: false, error: "mail-failed" });
  }

  // Optional: Kontakt in HubSpot anlegen
  if (process.env.HUBSPOT_TOKEN && email) {
    const [first, ...rest] = name.split(" ");
    const props = {
      email, firstname: first || "", lastname: rest.join(" ") || "", company: firma,
      phone: fields.find((f) => f[0] === "Telefon")?.[1] || "",
      hs_lead_status: "NEW",
      message: text
    };
    fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.HUBSPOT_TOKEN}`, "content-type": "application/json" },
      body: JSON.stringify({ properties: props })
    }).catch((e) => console.error("HubSpot error", e));
  }

  return json(200, { ok: true });
}
