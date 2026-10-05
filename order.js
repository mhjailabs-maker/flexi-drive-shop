// Flexi Drive Shop: অর্ডার সার্ভার (Vercel). এই একটি ফাইলেই সব আছে, অন্য কোনো ফাইল লাগে না।
//
// Vercel → Settings → Environment Variables-এ বসাতে হবে:
//   TELEGRAM_BOT_TOKEN  (আবশ্যক): BotFather-এর টোকেন
//   TELEGRAM_CHAT_ID    (ঐচ্ছিক): না দিলে নিচের ডিফল্ট চ্যাট আইডি ব্যবহার হবে
// টোকেন কখনো এই ফাইলে বা GitHub-এ লিখবেন না।

const DEFAULT_CHAT_ID = '5544092143';

const esc = s => String(s ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const hits = new Map();
const newId = () => 'FD-' + Date.now().toString(36).toUpperCase().slice(-6) + Math.random().toString(36).slice(2, 5).toUpperCase();
const tg = (T, m) => `https://api.telegram.org/bot${T}/${m}`;
const send = (res, status, json) => { res.setHeader('Cache-Control', 'no-store'); res.status(status).json(json); };

module.exports = async (req, res) => {
  const T = String(process.env.TELEGRAM_BOT_TOKEN || '').trim();
  const C = String(process.env.TELEGRAM_CHAT_ID || DEFAULT_CHAT_ID).trim();

  // ব্রাউজারে /api/order খুললে (বা সাইটে ?debug=1 দিলে) সেটআপ ঠিক আছে কিনা দেখা যায়। কোনো মেসেজ পাঠায় না।
  if (req.method === 'GET') {
    const t = { token: !!T, chat: !!C, bot: false, chatReachable: false };
    if (T) {
      try {
        const me = await (await fetch(tg(T, 'getMe'))).json();
        t.bot = me.ok ? '@' + me.result.username : false;
        if (me.ok && C) t.chatReachable = !!(await (await fetch(tg(T, 'getChat?chat_id=' + encodeURIComponent(C)))).json()).ok;
      } catch { /* উপেক্ষা */ }
    }
    return send(res, 200, { ok: true, api: 'running', telegram: t });
  }
  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'অনুমোদিত নয়' });
  if (!T) return send(res, 500, { ok: false, error: 'সার্ভার সেটআপ সম্পূর্ণ নয়' });

  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = null; } }
  if (!b || typeof b !== 'object') return send(res, 400, { ok: false, error: 'তথ্য সঠিক নয়' });
  if (b.website) return send(res, 200, { ok: true, orderId: newId() }); // বট ধরার ফাঁদ

  // প্রতি আইপিতে ১০ মিনিটে সর্বোচ্চ ৮টি অর্ডার
  const ip = String(req.headers['x-forwarded-for'] || 'x').split(',')[0].trim(), now = Date.now();
  const list = (hits.get(ip) || []).filter(t => now - t < 600000);
  if (list.length >= 8) return send(res, 429, { ok: false, error: 'অনেকবার চেষ্টা হয়েছে, কিছুক্ষণ পরে আবার করুন' });
  hits.set(ip, [...list, now]);

  const number = String(b.number || ''), trx = String(b.trx || '').toUpperCase(), name = String(b.name || '').trim();
  const price = Number(b.price), method = b.method;
  if (!/^01[3-9]\d{8}$/.test(number)) return send(res, 400, { ok: false, error: 'মোবাইল নম্বর সঠিক নয়' });
  if (!/^[A-Z0-9]{6,14}$/.test(trx)) return send(res, 400, { ok: false, error: 'Transaction ID সঠিক নয়' });
  if (name.length < 2 || name.length > 60) return send(res, 400, { ok: false, error: 'নাম সঠিক নয়' });
  if (!['bKash', 'Nagad'].includes(method)) return send(res, 400, { ok: false, error: 'পেমেন্ট মাধ্যম সঠিক নয়' });
  if (!(price > 0 && price < 20000)) return send(res, 400, { ok: false, error: 'দাম সঠিক নয়' });

  const id = newId(), shot = String(b.shot || '');
  const hasShot = shot.startsWith('data:image/jpeg;base64,') && shot.length < 3500000;
  const time = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Dhaka', hour12: true });
  const text =
    `🚨 <b>নতুন অর্ডার!</b>\n🆔 <code>${id}</code>\n\n` +
    `📶 অপারেটর: <b>${esc(String(b.op || '').slice(0, 40))}</b>\n📦 অফার: <b>${esc(String(b.title || '').slice(0, 100))}</b>\n💰 টাকা: <b>৳${price}</b>\n\n` +
    `📱 অফার যাবে: <code>${number}</code>\n👤 নাম: ${esc(name)}\n\n` +
    `💳 মাধ্যম: <b>${method}</b>\n🔢 TrxID: <code>${esc(trx)}</code>\n📸 স্ক্রিনশট: ${hasShot ? 'আছে (নিচে)' : 'দেয়নি'}\n⏰ ${time}\n🟢 স্ট্যাটাস: Processing`;

  try {
    const r = await fetch(tg(T, 'sendMessage'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: C, text, parse_mode: 'HTML' }) });
    if (!r.ok) { const d = await r.json().catch(() => ({})); console.error('Telegram error', r.status, d.description); throw new Error('tg'); }
  } catch {
    return send(res, 502, { ok: false, error: 'অর্ডার জমা হয়নি, আবার চেষ্টা করুন' });
  }

  if (hasShot) {
    try {
      const fd = new FormData();
      fd.append('chat_id', C);
      fd.append('caption', `📸 পেমেন্টের স্ক্রিনশট • ${id}`);
      fd.append('photo', new Blob([Buffer.from(shot.split(',')[1], 'base64')], { type: 'image/jpeg' }), 'payment.jpg');
      await fetch(tg(T, 'sendPhoto'), { method: 'POST', body: fd });
    } catch { /* স্ক্রিনশট না গেলেও অর্ডার জমা থাকে */ }
  }
  return send(res, 200, { ok: true, orderId: id });
};
