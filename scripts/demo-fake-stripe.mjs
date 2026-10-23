/**
 * LOCAL DEMO ONLY. A tiny stand-in for Stripe so the whole payment cycle can be shown on localhost with no account and no money.
 * It speaks the part of Stripe's HTTP API that our real Stripe adapter uses, shows a clearly-labelled fake checkout page, and sends our
 * app correctly SIGNED webhooks, so every step on our side (order, signature check, verification, fulfilment, refund) is the real code.
 *
 *   node scripts/demo-fake-stripe.mjs        (port 4010; the app must run with STRIPE_API_BASE=http://127.0.0.1:4010)
 *
 * Env: APP_URL (default http://localhost:3000), STRIPE_WEBHOOK_SECRET (default whsec_demo), PORT.
 */
import http from "node:http";
import Stripe from "stripe";

const PORT = Number(process.env.PORT || 4010);
const APP = (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");
const SECRET = process.env.STRIPE_WEBHOOK_SECRET || "whsec_demo";
const stripe = new Stripe("sk_test_demo");
const sessions = new Map();
const refunds = new Map();
const refunded = new Map();
let n = 0;
const rid = (p) => `${p}_demo_${Date.now().toString(36)}${++n}`;
const log = (...a) => console.log(new Date().toLocaleTimeString(), ...a);

async function sendWebhook(type, object) {
  const raw = JSON.stringify({ id: rid("evt"), object: "event", type, created: Math.floor(Date.now() / 1000), data: { object } });
  const sig = stripe.webhooks.generateTestHeaderString({ payload: raw, secret: SECRET });
  try {
    const r = await fetch(`${APP}/api/v1/webhooks/stripe`, { method: "POST", headers: { "content-type": "application/json", "stripe-signature": sig }, body: raw });
    log(`webhook ${type} -> app answered ${r.status}`);
  } catch (e) {
    log("webhook failed:", e.message);
  }
}

const expanded = (s) => !s.payment_intent_id ? s : { ...s, payment_intent: { id: s.payment_intent_id, object: "payment_intent", metadata: { order_id: s.client_reference_id }, last_payment_error: null, payment_method_types: ["card"], latest_charge: { id: `ch_${s.payment_intent_id}`, object: "charge", amount_refunded: refunded.get(s.payment_intent_id) ?? 0, payment_method_details: { type: "card" } } } };

const money = (m, c) => new Intl.NumberFormat("en-US", { style: "currency", currency: c.toUpperCase() }).format(m / 100);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function page(s) {
  const done = s.status !== "open";
  return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Demo checkout</title>
<style>body{font:16px system-ui;background:#f6f9fc;margin:0;display:grid;place-items:center;min-height:100vh}main{background:#fff;max-width:420px;width:92%;padding:28px;border-radius:14px;box-shadow:0 10px 40px #0002}
.demo{background:#fff3cd;border:1px solid #e0c36b;padding:8px 12px;border-radius:8px;font-size:13px;margin-bottom:18px}h1{font-size:15px;color:#555;margin:0}.amt{font-size:34px;font-weight:700;margin:6px 0 18px}
button{width:100%;min-height:48px;border:0;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer;margin-top:10px}.pay{background:#635bff;color:#fff}.fail{background:#fff;border:1px solid #cbd5e1}.cancel{background:none;color:#555;font-size:14px}
.card{border:1px solid #cbd5e1;border-radius:8px;padding:12px;font-family:monospace;margin-bottom:6px}</style>
<main><div class="demo"><b>DEMO ONLY.</b> This is a local stand-in for Stripe's hosted page. No real card, no real money.</div>
<h1>Pay GrowQR (demo)</h1><div class="amt">${money(s.amount_total, s.currency)}</div>
<div style="color:#555;font-size:14px;margin-bottom:12px">Order ${esc(s.client_reference_id)} &middot; ${esc(s.customer_email)}</div>
${done ? `<p><b>This session is ${esc(s.status)}.</b></p>` : `<div class="card">4242 4242 4242 4242 &nbsp; 12/34 &nbsp; 123</div>
<form method="post" action="/c/pay/${s.id}/pay"><button class="pay">Pay ${money(s.amount_total, s.currency)} with test card</button></form>
<form method="post" action="/c/pay/${s.id}/decline"><button class="fail">Use a card that is declined</button></form>
<form method="post" action="/c/pay/${s.id}/cancel"><button class="cancel">Cancel and go back</button></form>`}</main>`;
}

const body = (req) => new Promise((res) => { let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => res(b)); });
const json = (res, code, o) => { res.writeHead(code, { "content-type": "application/json", "request-id": "req_demo" }); res.end(JSON.stringify(o)); };

http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  const method = req.method;
  let m;
  try {
    const raw = method === "POST" ? await body(req) : "";
    const form = new URLSearchParams(raw);
    // ---- hosted page ----
    if ((m = /^\/c\/pay\/([^/]+)$/.exec(u.pathname)) && method === "GET") {
      const s = sessions.get(m[1]);
      res.writeHead(s ? 200 : 404, { "content-type": "text/html" });
      return res.end(s ? page(s) : "Unknown session");
    }
    if ((m = /^\/c\/pay\/([^/]+)\/(pay|decline|cancel)$/.exec(u.pathname)) && method === "POST") {
      const s = sessions.get(m[1]);
      if (!s) { res.writeHead(404); return res.end("no"); }
      let to = s.cancel_url;
      if (m[2] === "pay" && s.status === "open") {
        s.payment_intent_id = s.payment_intent = rid("pi");
        s.status = "complete"; s.payment_status = "paid";
        log(`customer paid ${s.id}`);
        await sendWebhook("checkout.session.completed", s);
        to = s.success_url;
      } else if (m[2] === "decline") {
        log(`card declined on ${s.id}`);
        await sendWebhook("payment_intent.payment_failed", { id: rid("pi"), object: "payment_intent", metadata: { order_id: s.client_reference_id }, last_payment_error: { code: "card_declined", message: "Your card was declined." } });
        to = s.cancel_url;
      }
      res.writeHead(303, { location: to }); return res.end();
    }
    // ---- API ----
    if (method === "POST" && u.pathname === "/v1/checkout/sessions") {
      let total = 0;
      for (let i = 0; i < 20; i++) { const a = form.get(`line_items[${i}][price_data][unit_amount]`); if (a) total += Number(a) * Number(form.get(`line_items[${i}][quantity]`) ?? 1); }
      const id = rid("cs_test");
      const s = { id, object: "checkout.session", url: `http://127.0.0.1:${PORT}/c/pay/${id}`, amount_total: total, currency: form.get("line_items[0][price_data][currency]"), client_reference_id: form.get("client_reference_id"), metadata: { order_id: form.get("metadata[order_id]") }, payment_status: "unpaid", status: "open", payment_intent: null, created: Math.floor(Date.now() / 1000), customer_email: form.get("customer_email"), success_url: form.get("success_url"), cancel_url: form.get("cancel_url") };
      sessions.set(id, s);
      log(`session created ${id} ${money(total, s.currency)} for ${s.client_reference_id}`);
      return json(res, 200, s);
    }
    if ((m = /^\/v1\/checkout\/sessions\/([^/]+)\/expire$/.exec(u.pathname)) && method === "POST") {
      const s = sessions.get(m[1]);
      if (!s || s.status !== "open") return json(res, 400, { error: { type: "invalid_request_error", message: "not open" } });
      s.status = "expired"; return json(res, 200, s);
    }
    if ((m = /^\/v1\/checkout\/sessions\/([^/]+)$/.exec(u.pathname)) && method === "GET") {
      const s = sessions.get(m[1]);
      return s ? json(res, 200, expanded(s)) : json(res, 404, { error: { type: "invalid_request_error", code: "resource_missing", message: "no such session" } });
    }
    if (method === "GET" && u.pathname === "/v1/checkout/sessions") return json(res, 200, { object: "list", data: [...sessions.values()].map(expanded), has_more: false, url: "/v1/checkout/sessions" });
    if (method === "POST" && u.pathname === "/v1/refunds") {
      const pi = form.get("payment_intent");
      const s = [...sessions.values()].find((x) => x.payment_intent_id === pi);
      const r = { id: rid("re"), object: "refund", payment_intent: pi, amount: Number(form.get("amount")), currency: s?.currency ?? "usd", status: "succeeded", metadata: { refund_id: form.get("metadata[refund_id]") } };
      refunds.set(r.id, r);
      refunded.set(pi, (refunded.get(pi) ?? 0) + r.amount);
      log(`refund ${r.id} ${money(r.amount, r.currency)}`);
      setTimeout(() => sendWebhook("refund.updated", r), 500);
      return json(res, 200, r);
    }
    if (method === "GET" && u.pathname === "/v1/refunds") return json(res, 200, { object: "list", data: [...refunds.values()].filter((r) => r.payment_intent === u.searchParams.get("payment_intent")), has_more: false, url: "/v1/refunds" });
    if ((m = /^\/v1\/refunds\/([^/]+)$/.exec(u.pathname)) && method === "GET") { const r = refunds.get(m[1]); return r ? json(res, 200, r) : json(res, 404, { error: { type: "invalid_request_error", message: "none" } }); }
    return json(res, 404, { error: { type: "invalid_request_error", message: `not handled: ${method} ${u.pathname}` } });
  } catch (e) {
    log("error", e);
    return json(res, 500, { error: { type: "api_error", message: String(e) } });
  }
}).listen(PORT, "127.0.0.1", () => log(`fake Stripe (demo) on http://127.0.0.1:${PORT}, webhooks go to ${APP}`));
