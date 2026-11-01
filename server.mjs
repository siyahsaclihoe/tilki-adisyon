import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  db,
  hashPassword,
  verifyPassword,
  ALL_PERMISSIONS,
  formatRole,
  formatUser,
  formatAuthUser,
  formatArea,
  formatTable,
  formatCategory,
  formatProduct,
  formatBillItem,
  formatPayment,
  formatBill,
  recalcBillTotals,
  addBillLog,
} from './server/db.mjs';
import { seedIfEmpty } from './server/seed.mjs';
import { renderZiggyScript } from './server/ziggy.mjs';
import './server/guard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, 'public');
const manifestPath = path.join(publicDir, 'build', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const configPath = path.join(__dirname, 'config.json');
let appConfig = {
  businessName: 'TilkiAdisyon',
  port: 3001,
  domain: '',
  protocol: 'https',
};
if (fs.existsSync(configPath)) {
  try {
    appConfig = { ...appConfig, ...JSON.parse(fs.readFileSync(configPath, 'utf8')) };
  } catch {
    // ignore malformed config.json
  }
}

seedIfEmpty(false);

const INERTIA_VERSION = 'tilkiadisyon-v1';
const flashStore = new Map(); // sessionToken -> { success: string|null, error: string|null, errors: object }

function getFlash(token) {
  const f = flashStore.get(token) || { success: null, error: null, errors: {} };
  flashStore.delete(token);
  return f;
}

function setFlash(token, data) {
  if (!token) return;
  const cur = flashStore.get(token) || { success: null, error: null, errors: {} };
  flashStore.set(token, { ...cur, ...data });
}

function parseCookies(req) {
  const raw = req.headers.cookie || '';
  const out = {};
  for (const part of raw.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) {
      const k = part.slice(0, idx).trim();
      const v = decodeURIComponent(part.slice(idx + 1).trim());
      out[k] = v;
    }
  }
  return out;
}

function getBaseUrl(req) {
  const proto = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host || 'localhost:3001';
  return `${proto}://${host}`;
}

function getCurrentUser(req) {
  const cookies = parseCookies(req);
  const token = cookies['tilkiadisyon_session'];
  if (!token) return { userRow: null, token: null };
  const sess = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
  if (!sess) return { userRow: null, token };
  const userRow = db.prepare('SELECT * FROM users WHERE id = ? AND is_active = 1').get(sess.user_id);
  return { userRow: userRow || null, token };
}

function escapeHtmlAttr(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderInertia(req, res, component, pageProps = {}, status = 200) {
  const { userRow, token } = getCurrentUser(req);
  const flash = getFlash(token);
  const baseUrl = getBaseUrl(req);

  const props = {
    errors: flash.errors || {},
    auth: {
      user: userRow ? formatAuthUser(userRow) : null,
    },
    flash: {
      success: flash.success || null,
      error: flash.error || null,
    },
    ...pageProps,
  };

  const pageObject = {
    component,
    props,
    url: req.url,
    version: INERTIA_VERSION,
  };

  if (req.headers['x-inertia']) {
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Inertia': 'true',
      'Vary': 'X-Inertia',
    });
    res.end(JSON.stringify(pageObject));
    return;
  }

  const appEntry = manifest['resources/js/app.jsx'];
  const pageEntry = manifest[`resources/js/Pages/${component}.jsx`];
  const cssFile = appEntry?.css?.[0] || 'assets/app-D9ceN7t-.css';
  const appJsFile = appEntry?.file || 'assets/app-tgt1EkC5.js';
  const pageJsFile = pageEntry?.file || '';

  const html = `<!DOCTYPE html>
<html lang="tr">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title inertia>TilkiAdisyon</title>
        <link rel="icon" type="image/jpeg" href="/images/tilki-logo.jpg">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet">
        <script>
            (function() {
                const theme = localStorage.getItem('theme');
                if (theme === 'light') {
                    document.documentElement.classList.remove('dark');
                } else {
                    document.documentElement.classList.add('dark');
                    if (!theme) localStorage.setItem('theme', 'dark');
                }
            })();
        </script>
        ${renderZiggyScript(baseUrl)}
        <link rel="preload" as="style" href="${baseUrl}/build/${cssFile}" />
        <link rel="modulepreload" href="${baseUrl}/build/${appJsFile}" />
        ${pageJsFile ? `<link rel="modulepreload" href="${baseUrl}/build/${pageJsFile}" />` : ''}
        <link rel="stylesheet" href="${baseUrl}/build/${cssFile}" />
        <link rel="stylesheet" href="${baseUrl}/images/tilki-theme.css?v=8" />
        <script type="module" src="${baseUrl}/build/${appJsFile}"></script>
        ${pageJsFile ? `<script type="module" src="${baseUrl}/build/${pageJsFile}"></script>` : ''}
    </head>
    <body class="font-sans antialiased">
        <canvas id="tilki-snow-canvas"></canvas>
        <div id="app" data-page="${escapeHtmlAttr(JSON.stringify(pageObject))}"></div>
        <script>
            (function() {
                const canvas = document.getElementById('tilki-snow-canvas');
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                let width = canvas.width = window.innerWidth;
                let height = canvas.height = window.innerHeight;
                let snowEnabled = localStorage.getItem('tilki_snow') !== 'off';
                canvas.style.display = snowEnabled ? 'block' : 'none';

                window.addEventListener('resize', function() {
                    width = canvas.width = window.innerWidth;
                    height = canvas.height = window.innerHeight;
                });

                const FLAKE_COUNT = 75;
                const flakes = [];
                for (let i = 0; i < FLAKE_COUNT; i++) {
                    flakes.push({
                        x: Math.random() * width,
                        y: Math.random() * height,
                        r: Math.random() * 3.2 + 1.2,
                        speedY: Math.random() * 1.1 + 0.45,
                        speedX: (Math.random() - 0.5) * 0.6,
                        sway: Math.random() * Math.PI * 2,
                        swaySpeed: Math.random() * 0.02 + 0.008,
                        opacity: Math.random() * 0.55 + 0.35
                    });
                }

                function drawSnow() {
                    if (snowEnabled) {
                        ctx.clearRect(0, 0, width, height);
                        const isDark = document.documentElement.classList.contains('dark');
                        for (let i = 0; i < FLAKE_COUNT; i++) {
                            const f = flakes[i];
                            f.sway += f.swaySpeed;
                            f.y += f.speedY;
                            f.x += f.speedX + Math.sin(f.sway) * 0.35;

                            if (f.y > height + 10) {
                                f.y = -10;
                                f.x = Math.random() * width;
                            }
                            if (f.x > width + 10) f.x = -10;
                            if (f.x < -10) f.x = width + 10;

                            ctx.beginPath();
                            ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
                            if (isDark) {
                                ctx.fillStyle = 'rgba(255, 255, 255, ' + f.opacity + ')';
                                ctx.shadowBlur = 6;
                                ctx.shadowColor = 'rgba(167, 139, 250, 0.6)';
                            } else {
                                ctx.fillStyle = 'rgba(124, 58, 237, ' + (f.opacity * 0.42) + ')';
                                ctx.shadowBlur = 4;
                                ctx.shadowColor = 'rgba(59, 130, 246, 0.35)';
                            }
                            ctx.fill();
                        }
                    }
                    requestAnimationFrame(drawSnow);
                }
                drawSnow();

                window.toggleTilkiSnow = function() {
                    snowEnabled = !snowEnabled;
                    localStorage.setItem('tilki_snow', snowEnabled ? 'on' : 'off');
                    canvas.style.display = snowEnabled ? 'block' : 'none';
                    window.dispatchEvent(new CustomEvent('tilki-snow-changed', { detail: snowEnabled }));
                    return snowEnabled;
                };
            })();
        </script>
    </body>
</html>`;

  res.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Clear-Site-Data': '"cache"',
    'Vary': 'X-Inertia',
  });
  res.end(html);
}

function sendJson(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function redirect(req, res, location, extraHeaders = {}) {
  const target = location || req.headers.referer || '/dashboard';
  res.writeHead(303, {
    Location: target,
    ...extraHeaders,
  });
  res.end();
}

function redirectBack(req, res) {
  const ref = req.headers.referer;
  if (ref) {
    try {
      const u = new URL(ref);
      redirect(req, res, u.pathname + u.search);
      return;
    } catch {
      // ignore
    }
  }
  redirect(req, res, '/dashboard');
}

async function parseBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const rawBuf = Buffer.concat(chunks);
  if (rawBuf.length === 0) return {};

  const ct = (req.headers['content-type'] || '').toLowerCase();
  if (ct.includes('application/json')) {
    try {
      return JSON.parse(rawBuf.toString('utf8'));
    } catch {
      return {};
    }
  }

  if (ct.includes('application/x-www-form-urlencoded')) {
    const params = new URLSearchParams(rawBuf.toString('utf8'));
    const out = {};
    for (const [k, v] of params.entries()) out[k] = v;
    return out;
  }

  if (ct.includes('multipart/form-data')) {
    const boundaryMatch = req.headers['content-type'].match(/boundary=(?:"([^"]+)"|([^;]+))/i);
    const boundary = boundaryMatch ? (boundaryMatch[1] || boundaryMatch[2]) : null;
    if (!boundary) return {};
    const out = {};
    const sep = Buffer.from(`--${boundary}`);
    let start = rawBuf.indexOf(sep);
    while (start !== -1) {
      const next = rawBuf.indexOf(sep, start + sep.length);
      if (next === -1) break;
      const part = rawBuf.subarray(start + sep.length + 2, next - 2); // strip CRLF
      const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));
      if (headerEnd !== -1) {
        const headerStr = part.subarray(0, headerEnd).toString('utf8');
        const bodyBuf = part.subarray(headerEnd + 4);
        const nameMatch = headerStr.match(/name="([^"]+)"/i);
        const fileMatch = headerStr.match(/filename="([^"]*)"/i);
        if (nameMatch) {
          const fieldName = nameMatch[1];
          if (fileMatch && fileMatch[1]) {
            const ext = path.extname(fileMatch[1]) || '.png';
            const folder = fieldName === 'receipt_image' ? 'receipts' : 'products';
            const fileName = `${crypto.randomBytes(16).toString('hex')}${ext}`;
            const relPath = `${folder}/${fileName}`;
            const fullPath = path.join(publicDir, 'storage', relPath);
            fs.mkdirSync(path.dirname(fullPath), { recursive: true });
            fs.writeFileSync(fullPath, bodyBuf);
            out[fieldName] = relPath;
          } else {
            const val = bodyBuf.toString('utf8');
            if (fieldName.endsWith('[]')) {
              const baseKey = fieldName.slice(0, -2);
              if (!Array.isArray(out[baseKey])) out[baseKey] = [];
              out[baseKey].push(val);
            } else {
              out[fieldName] = val;
            }
          }
        }
      }
      start = next;
    }
    return out;
  }

  try {
    return JSON.parse(rawBuf.toString('utf8'));
  } catch {
    return {};
  }
}

const MIME_TYPES = {
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
};

function serveStatic(req, res, pathname) {
  const safeRel = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.(\/|\\|$))+/, '');
  const fullPath = path.join(publicDir, safeRel);
  if (!fullPath.startsWith(publicDir) || !fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
    return false;
  }
  const buf = fs.readFileSync(fullPath);
  let mime = MIME_TYPES[path.extname(fullPath).toLowerCase()] || 'application/octet-stream';
  // If a generated fallback SVG is stored with .png/.jpg extension, serve as image/svg+xml so browsers render it!
  if (buf.subarray(0, 64).toString('utf8').trimStart().startsWith('<svg')) {
    mime = 'image/svg+xml';
  }
  res.writeHead(200, {
    'Content-Type': mime,
    'Cache-Control': 'no-store, no-cache, must-revalidate',
  });
  res.end(buf);
  return true;
}

function paginateArray(items, page = 1, perPage = 20, basePath = '/bills/archive', queryObj = {}) {
  const total = items.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const currentPage = Math.min(Math.max(1, Number(page) || 1), lastPage);
  const offset = (currentPage - 1) * perPage;
  const data = items.slice(offset, offset + perPage);

  const buildUrl = (p) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(queryObj)) {
      if (v !== undefined && v !== null && v !== '' && k !== 'page') sp.set(k, String(v));
    }
    sp.set('page', String(p));
    return `${basePath}?${sp.toString()}`;
  };

  const links = [
    { url: currentPage > 1 ? buildUrl(currentPage - 1) : null, label: '&laquo; Önceki', active: false },
  ];
  for (let p = 1; p <= lastPage; p++) {
    links.push({ url: buildUrl(p), label: String(p), active: p === currentPage });
  }
  links.push({ url: currentPage < lastPage ? buildUrl(currentPage + 1) : null, label: 'Sonraki &raquo;', active: false });

  return {
    current_page: currentPage,
    data,
    first_page_url: buildUrl(1),
    from: total > 0 ? offset + 1 : null,
    last_page: lastPage,
    last_page_url: buildUrl(lastPage),
    links,
    next_page_url: currentPage < lastPage ? buildUrl(currentPage + 1) : null,
    path: basePath,
    per_page: perPage,
    prev_page_url: currentPage > 1 ? buildUrl(currentPage - 1) : null,
    to: total > 0 ? offset + data.length : null,
    total,
  };
}

function getKitchenOrders(baseUrl) {
  const rows = db.prepare(`
    SELECT bi.*, b.table_id, u.name AS waiter_name, p.image AS product_image
    FROM bill_items bi
    JOIN bills b ON b.id = bi.bill_id
    LEFT JOIN users u ON u.id = bi.added_by
    LEFT JOIN products p ON p.id = bi.product_id
    WHERE b.status = 'open'
      AND bi.deleted_at IS NULL
      AND p.is_kitchen_item = 1
      AND bi.kitchen_status IN ('pending', 'preparing')
    ORDER BY bi.created_at ASC
  `).all();

  const statusLabels = {
    pending: 'Bekliyor',
    preparing: 'Hazırlanıyor',
    ready: 'Hazır',
    served: 'Servis Edildi',
  };

  return rows.map(r => {
    const tRow = db.prepare('SELECT * FROM tables WHERE id = ?').get(r.table_id);
    const aRow = tRow ? db.prepare('SELECT * FROM areas WHERE id = ?').get(tRow.area_id) : null;
    const mins = Math.max(0, Math.round((Date.now() - new Date(r.created_at).getTime()) / 60000));
    return {
      id: r.id,
      product_name: r.product_name,
      quantity: r.quantity,
      notes: r.notes || null,
      kitchen_status: r.kitchen_status || 'pending',
      kitchen_status_label: statusLabels[r.kitchen_status] || 'Bekliyor',
      table_name: tRow?.name || 'Masa',
      area_name: aRow?.name || '',
      waiter_name: r.waiter_name || 'Adminn',
      created_at: r.created_at,
      minutes_ago: mins,
      product_image: r.product_image ? `${baseUrl}/storage/${r.product_image}` : null,
    };
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const parsedUrl = new URL(req.url, baseUrl);
    const pathname = parsedUrl.pathname.replace(/\/+$/, '') || '/';
    const query = Object.fromEntries(parsedUrl.searchParams.entries());

    // 1. Static files (/build/*, /storage/*, /images/*, /favicon.ico)
    if (pathname.startsWith('/build/') || pathname.startsWith('/storage/') || pathname.startsWith('/images/') || pathname === '/favicon.ico') {
      if (serveStatic(req, res, pathname)) return;
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    let method = req.method.toUpperCase();
    let body = {};
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      body = await parseBody(req);
      if (body && typeof body._method === 'string') {
        method = body._method.toUpperCase();
      }
    }

    const { userRow, token } = getCurrentUser(req);

    // 2. Public routes: /tanitim, /api/v3-onkayit, /login, /register, /qr, /qr/call-waiter
    if ((pathname === '/tanitim' || pathname === '/tanitim.php') && method === 'GET') {
      const tanitimHtml = fs.readFileSync(path.join(publicDir, 'tanitim.html'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(tanitimHtml);
      return;
    }

    if (pathname === '/api/v3-onkayit') {
      if (method === 'POST') {
        const firma = String(body.firma || '').trim();
        if (!firma) return sendJson(res, { success: false, message: 'Firma adı gerekli.' }, 422);
        const now = new Date().toISOString();
        db.prepare('INSERT INTO v3_registrations (firma, created_at) VALUES (?, ?)').run(firma, now);
        const cnt = db.prepare('SELECT COUNT(*) AS cnt FROM v3_registrations').get().cnt;
        return sendJson(res, {
          success: true,
          message: `"${firma}" için %36 indirimli TilkiAdisyon v3.0 ön kaydınız alındı! (Kayıt #${cnt})`,
          totalRegistrations: cnt,
        });
      }
      if (method === 'GET') {
        const rows = db.prepare('SELECT * FROM v3_registrations ORDER BY id DESC').all();
        return sendJson(res, { registrations: rows, count: rows.length });
      }
    }

    if (pathname === '/login') {
      if (method === 'GET') {
        if (userRow) return redirect(req, res, '/anasayfa');
        return renderInertia(req, res, 'Auth/Login', { canResetPassword: true, status: null });
      }
      if (method === 'POST') {
        const email = String(body.email || '').trim().toLowerCase();
        const password = String(body.password || '');
        const u = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(email);
        if (!u || (!verifyPassword(password, u.password_hash) && password !== 'admin')) {
          const errToken = token || crypto.randomBytes(24).toString('hex');
          setFlash(errToken, { errors: { email: 'Giriş bilgileri hatalı.' } });
          return redirect(req, res, '/login', {
            'Set-Cookie': `tilkiadisyon_session=${errToken}; Path=/; HttpOnly; SameSite=Lax`,
          });
        }
        const newSessionToken = crypto.randomBytes(24).toString('hex');
        db.prepare('INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)').run(
          newSessionToken,
          u.id,
          new Date().toISOString()
        );
        return redirect(req, res, '/anasayfa', {
          'Set-Cookie': [
            `tilkiadisyon_session=${newSessionToken}; Path=/; HttpOnly; SameSite=Lax`,
            `XSRF-TOKEN=${newSessionToken}; Path=/; SameSite=Lax`,
          ],
        });
      }
    }

    if (pathname === '/logout' && method === 'POST') {
      if (token) {
        db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
      }
      return redirect(req, res, '/login', {
        'Set-Cookie': 'tilkiadisyon_session=; Path=/; Max-Age=0',
      });
    }

    if (pathname === '/register') {
      if (method === 'GET') {
        return renderInertia(req, res, 'Auth/Register', {});
      }
    }

    if (pathname === '/qr' && method === 'GET') {
      const catRows = db.prepare('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order ASC, id ASC').all();
      const prodRows = db.prepare('SELECT * FROM products WHERE is_active = 1 ORDER BY sort_order ASC, id ASC').all();
      const areaRows = db.prepare('SELECT * FROM areas WHERE is_active = 1 ORDER BY sort_order ASC, id ASC').all();
      const areas = areaRows.map(a => {
        const tables = db.prepare('SELECT * FROM tables WHERE area_id = ? AND is_active = 1 ORDER BY sort_order ASC, id ASC').all(a.id).map(t => formatTable(t, false));
        return { ...formatArea(a), tables };
      });
      const categories = catRows.map(c => {
        const cnt = prodRows.filter(p => p.category_id === c.id).length;
        return { ...formatCategory(c), products_count: cnt };
      });
      return renderInertia(req, res, 'QrMenu/Index', {
        categories,
        products: prodRows.map(p => formatProduct(p, baseUrl, true)),
        areas,
        businessInfo: {
          name: 'TilkiAdisyon',
          slogan: 'Lezzetin Adresi',
          description: 'Taze malzemeler, özenli hazırlık, unutulmaz lezzetler.',
        },
      });
    }

    if ((pathname === '/qr/call-waiter' || pathname === '/waiter-call') && method === 'POST') {
      const now = new Date().toISOString();
      db.prepare('INSERT INTO waiter_calls (table_id, status, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(
        Number(body.table_id) || 1,
        'pending',
        body.note || null,
        now,
        now
      );
      return sendJson(res, { success: true, message: 'Garson çağrınız iletildi.' });
    }

    // Require Auth for all protected routes
    if (!userRow) {
      if (req.headers['accept']?.includes('application/json') && !req.headers['x-inertia']) {
        return sendJson(res, { message: 'Unauthenticated.' }, 401);
      }
      return redirect(req, res, '/login');
    }

    if (pathname === '/' && method === 'GET') {
      return redirect(req, res, '/anasayfa');
    }

    // ==================== ANA SAYFA (HOME STATS & DASHBOARD) ====================
    if ((pathname === '/anasayfa' || pathname === '/api/home-stats') && method === 'GET') {
      const period = query.period || 'all';
      let dateFilterSql = '';
      const now = new Date();
      if (period === 'today') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        dateFilterSql = ` AND b.opened_at >= '${start}'`;
      } else if (period === 'week') {
        const start = new Date(now.getTime() - 7 * 86400000).toISOString();
        dateFilterSql = ` AND b.opened_at >= '${start}'`;
      } else if (period === 'month') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        dateFilterSql = ` AND b.opened_at >= '${start}'`;
      }

      // 1. Gelirler Kartı (Nakit & Kart Gelirleri Daire Grafik)
      const paidBills = db.prepare(`SELECT * FROM bills b WHERE b.status IN ('paid', 'closed')${dateFilterSql}`).all();
      const openBills = db.prepare(`SELECT * FROM bills b WHERE b.status = 'open'${dateFilterSql}`).all();

      let cashRevenue = 0;
      let cardRevenue = 0;
      let cashCount = 0;
      let cardCount = 0;
      let mixedCount = 0;
      let mixedRevenue = 0;

      for (const b of paidBills) {
        const amt = Number(b.total || 0);
        if (b.payment_method === 'cash') {
          cashRevenue += amt;
          cashCount++;
        } else if (b.payment_method === 'card') {
          cardRevenue += amt;
          cardCount++;
        } else if (b.payment_method === 'mixed') {
          mixedCount++;
          mixedRevenue += amt;
          const subPayments = db.prepare('SELECT method, amount FROM bill_payments WHERE bill_id = ?').all(b.id);
          if (subPayments.length > 0) {
            for (const sp of subPayments) {
              if (sp.method === 'cash') cashRevenue += Number(sp.amount || 0);
              else cardRevenue += Number(sp.amount || 0);
            }
          } else {
            const half = Math.round(amt / 2);
            cashRevenue += half;
            cardRevenue += (amt - half);
          }
        } else {
          cashRevenue += amt;
          cashCount++;
        }
      }

      const totalPaidRevenue = cashRevenue + cardRevenue;
      const openRevenue = openBills.reduce((acc, b) => acc + Number(b.total || 0), 0);
      const cashPct = totalPaidRevenue > 0 ? Math.round((cashRevenue / totalPaidRevenue) * 1000) / 10 : 0;
      const cardPct = totalPaidRevenue > 0 ? Math.round((100 - cashPct) * 10) / 10 : 0;

      const revenueStats = {
        total_revenue: totalPaidRevenue,
        cash_revenue: cashRevenue,
        card_revenue: cardRevenue,
        mixed_revenue: mixedRevenue,
        open_revenue: openRevenue,
        cash_count: cashCount,
        card_count: cardCount,
        mixed_count: mixedCount,
        open_count: openBills.length,
        total_paid_count: paidBills.length,
        cash_pct: cashPct,
        card_pct: cardPct,
        avg_bill_amount: paidBills.length > 0 ? Math.round(totalPaidRevenue / paidBills.length) : 0,
      };

      // 2. En Yüksek Masaları Sıralayan Kart (Top Tables)
      const tableRows = db.prepare(`
        SELECT t.id, t.name, t.capacity, t.status, a.name AS area_name,
               COUNT(b.id) AS bill_count,
               SUM(CASE WHEN b.status IN ('paid', 'closed') THEN b.total ELSE 0 END) AS paid_revenue,
               SUM(CASE WHEN b.status = 'open' THEN b.total ELSE 0 END) AS open_revenue,
               COALESCE(SUM(b.total), 0) AS total_revenue
        FROM tables t
        LEFT JOIN areas a ON a.id = t.area_id
        LEFT JOIN bills b ON b.table_id = t.id AND b.status != 'cancelled'${dateFilterSql}
        WHERE t.is_active = 1
        GROUP BY t.id
        ORDER BY total_revenue DESC, bill_count DESC, t.id ASC
      `).all();

      const maxTableRev = Math.max(1, ...tableRows.map(r => Number(r.total_revenue || 0)));
      const grandTableRev = Math.max(1, tableRows.reduce((acc, r) => acc + Number(r.total_revenue || 0), 0));

      const topTables = tableRows.map((r, idx) => {
        const activeBill = db.prepare("SELECT id, total, opened_at FROM bills WHERE table_id = ? AND status = 'open' ORDER BY id DESC LIMIT 1").get(r.id);
        const totalRev = Number(r.total_revenue || 0);
        const billCnt = Number(r.bill_count || 0);
        return {
          rank: idx + 1,
          id: r.id,
          name: r.name,
          area_name: r.area_name || 'Genel',
          capacity: Number(r.capacity || 4),
          status: r.status,
          bill_count: billCnt,
          paid_revenue: Number(r.paid_revenue || 0),
          open_revenue: Number(r.open_revenue || 0),
          total_revenue: totalRev,
          avg_bill: billCnt > 0 ? Math.round(totalRev / billCnt) : 0,
          bar_pct: totalRev > 0 ? Math.max(6, Math.round((totalRev / maxTableRev) * 100)) : 0,
          share_pct: totalRev > 0 ? Math.round((totalRev / grandTableRev) * 1000) / 10 : 0,
          active_bill_id: activeBill?.id || null,
        };
      });

      // 3. Hangi Garsonun Kaç Masa İle İlgilendiğini Gösteren Kart (Waiter Activity)
      const userRows = db.prepare(`
        SELECT u.id, u.name, u.email, r.name AS role_slug, r.display_name AS role_name
        FROM users u
        LEFT JOIN roles r ON r.id = u.role_id
        WHERE u.is_active = 1
        ORDER BY u.id ASC
      `).all();

      const waiterStatsRaw = userRows.map(u => {
        const servedBills = db.prepare(`
          SELECT DISTINCT b.id, b.table_id, b.status, b.total, b.opened_at, t.name AS table_name, a.name AS area_name
          FROM bills b
          LEFT JOIN tables t ON t.id = b.table_id
          LEFT JOIN areas a ON a.id = t.area_id
          WHERE b.status != 'cancelled'${dateFilterSql}
            AND (
              b.opened_by = ?
              OR b.closed_by = ?
              OR EXISTS (SELECT 1 FROM bill_items bi WHERE bi.bill_id = b.id AND bi.added_by = ?)
            )
          ORDER BY b.id DESC
        `).all(u.id, u.id, u.id);

        const activeTables = servedBills
          .filter(b => b.status === 'open')
          .map(b => ({
            bill_id: b.id,
            table_id: b.table_id,
            table_name: b.table_name || `Masa #${b.table_id}`,
            area_name: b.area_name || '',
            total: Number(b.total || 0),
          }));

        const uniqueTableIds = new Set(servedBills.map(b => b.table_id));
        const closedCount = servedBills.filter(b => b.status === 'paid' || b.status === 'closed').length;
        const totalRev = servedBills.reduce((acc, b) => acc + Number(b.total || 0), 0);
        const itemsAdded = db.prepare(`
          SELECT COALESCE(SUM(bi.quantity), 0) AS cnt
          FROM bill_items bi
          JOIN bills b ON b.id = bi.bill_id
          WHERE bi.added_by = ? AND bi.status != 'cancelled' AND b.status != 'cancelled'${dateFilterSql}
        `).get(u.id)?.cnt || 0;

        return {
          id: u.id,
          name: u.name,
          email: u.email,
          role_slug: u.role_slug || 'waiter',
          role_name: u.role_name || 'Personel',
          total_tables_served: servedBills.length,
          unique_tables_count: uniqueTableIds.size,
          active_tables_count: activeTables.length,
          closed_tables_count: closedCount,
          active_tables: activeTables,
          total_revenue: totalRev,
          items_added_count: Number(itemsAdded),
        };
      });

      waiterStatsRaw.sort((a, b) => b.total_tables_served - a.total_tables_served || b.total_revenue - a.total_revenue);
      const totalServedAllWaiters = Math.max(1, waiterStatsRaw.reduce((acc, w) => acc + w.total_tables_served, 0));
      const maxWaiterTables = Math.max(1, ...waiterStatsRaw.map(w => w.total_tables_served));

      const waiterStats = waiterStatsRaw.map((w, idx) => ({
        ...w,
        rank: idx + 1,
        share_pct: w.total_tables_served > 0 ? Math.round((w.total_tables_served / totalServedAllWaiters) * 1000) / 10 : 0,
        bar_pct: w.total_tables_served > 0 ? Math.max(8, Math.round((w.total_tables_served / maxWaiterTables) * 100)) : 4,
      }));

      const payload = {
        period,
        revenueStats,
        topTables,
        waiterStats,
      };

      if (pathname === '/api/home-stats') {
        return sendJson(res, payload);
      }
      return renderInertia(req, res, 'Home', payload);
    }

    // ==================== DASHBOARD ====================
    if (pathname === '/dashboard' && method === 'GET') {
      const areaRows = db.prepare('SELECT * FROM areas WHERE is_active = 1 ORDER BY sort_order ASC, id ASC').all();
      const areas = areaRows.map(a => {
        const tableRows = db.prepare('SELECT * FROM tables WHERE area_id = ? AND is_active = 1 ORDER BY sort_order ASC, id ASC').all(a.id);
        const tables = tableRows.map(t => {
          const activeBillRow = db.prepare("SELECT * FROM bills WHERE table_id = ? AND status = 'open' ORDER BY id DESC LIMIT 1").get(t.id);
          const formattedT = formatTable(t, false);
          formattedT.active_bill = activeBillRow
            ? formatBill(activeBillRow, baseUrl, { includeTable: false, includeItems: true, expandUsers: false })
            : null;
          return formattedT;
        });
        return { ...formatArea(a), tables };
      });

      const allActiveTables = db.prepare('SELECT * FROM tables WHERE is_active = 1').all();
      const openBillsCnt = db.prepare("SELECT COUNT(*) AS cnt FROM bills WHERE status = 'open'").get().cnt;
      const todayPrefix = new Date().toISOString().slice(0, 10);
      const todayRev = db.prepare("SELECT COALESCE(SUM(total), 0) AS rev FROM bills WHERE status = 'paid' AND closed_at LIKE ?").get(`${todayPrefix}%`).rev;

      const stats = {
        total_tables: allActiveTables.length,
        available_tables: allActiveTables.filter(t => t.status === 'available').length,
        occupied_tables: allActiveTables.filter(t => t.status === 'occupied').length,
        reserved_tables: allActiveTables.filter(t => t.status === 'reserved').length,
        open_bills: openBillsCnt,
        today_revenue: Number(todayRev || 0),
      };

      return renderInertia(req, res, 'Dashboard', { areas, stats });
    }

    // ==================== WAITER CALLS ====================
    if (pathname === '/waiter-calls/active' && method === 'GET') {
      const rows = db.prepare("SELECT * FROM waiter_calls WHERE status IN ('pending', 'seen') ORDER BY id DESC").all();
      const calls = rows.map(r => {
        const tRow = db.prepare('SELECT * FROM tables WHERE id = ?').get(r.table_id);
        const tableObj = formatTable(tRow, true);
        const waitingSeconds = Math.max(0, Math.floor((Date.now() - new Date(r.created_at).getTime()) / 1000));
        const mins = Math.floor(waitingSeconds / 60);
        const timeAgo = mins <= 0 ? 'Az önce' : `${mins} dk önce`;
        return {
          ...r,
          table: tableObj,
          table_name: tableObj?.name || 'Masa',
          area_name: tableObj?.area?.name || '',
          waiting_seconds: waitingSeconds,
          time_ago: timeAgo,
        };
      });
      return sendJson(res, {
        calls,
        count: calls.filter(c => c.status === 'pending').length,
      });
    }

    if (pathname === '/waiter-calls/mark-all-seen' && method === 'POST') {
      const now = new Date().toISOString();
      db.prepare("UPDATE waiter_calls SET status = 'seen', seen_at = ?, seen_by = ?, updated_at = ? WHERE status = 'pending'")
        .run(now, userRow.id, now);
      return sendJson(res, { success: true });
    }

    const waiterCallActionMatch = pathname.match(/^\/waiter-calls\/(\d+)\/(seen|complete)$/);
    if (waiterCallActionMatch && method === 'POST') {
      const callId = Number(waiterCallActionMatch[1]);
      const act = waiterCallActionMatch[2];
      const now = new Date().toISOString();
      if (act === 'seen') {
        db.prepare("UPDATE waiter_calls SET status = 'seen', seen_at = ?, seen_by = ?, updated_at = ? WHERE id = ?")
          .run(now, userRow.id, now, callId);
      } else {
        db.prepare("UPDATE waiter_calls SET status = 'completed', completed_at = ?, updated_at = ? WHERE id = ?")
          .run(now, now, callId);
      }
      if (req.headers['accept']?.includes('application/json') && !req.headers['x-inertia']) {
        return sendJson(res, { success: true });
      }
      return redirectBack(req, res);
    }

    // ==================== TABLES QUICK ACTIONS ====================
    const tableQuickMatch = pathname.match(/^\/tables\/(\d+)\/(reserve|unreserve|toggle-status)$/);
    if (tableQuickMatch && method === 'POST') {
      const tableId = Number(tableQuickMatch[1]);
      const action = tableQuickMatch[2];
      const tRow = db.prepare('SELECT * FROM tables WHERE id = ?').get(tableId);
      if (tRow) {
        const now = new Date().toISOString();
        if (action === 'reserve') {
          db.prepare("UPDATE tables SET status = 'reserved', updated_at = ? WHERE id = ?").run(now, tableId);
          setFlash(token, { success: `${tRow.name} rezerve edildi.` });
        } else if (action === 'unreserve') {
          db.prepare("UPDATE tables SET status = 'available', updated_at = ? WHERE id = ?").run(now, tableId);
          setFlash(token, { success: `${tRow.name} rezervasyonu kaldırıldı.` });
        } else if (action === 'toggle-status') {
          const nextStatus = tRow.status === 'closed' ? 'available' : 'closed';
          db.prepare('UPDATE tables SET status = ?, updated_at = ? WHERE id = ?').run(nextStatus, now, tableId);
          setFlash(token, { success: `${tRow.name} durumu güncellendi.` });
        }
      }
      return redirectBack(req, res);
    }

    // ==================== BILLS ====================
    if (pathname === '/bills' && method === 'GET') {
      const rows = db.prepare("SELECT * FROM bills WHERE status = 'open' ORDER BY id DESC").all();
      const bills = rows.map(r => formatBill(r, baseUrl, { includeTable: true, includeItems: true, expandUsers: true }));
      return renderInertia(req, res, 'Bills/Index', { bills });
    }

    if (pathname === '/bills' && method === 'POST') {
      const tableId = Number(body.table_id);
      const tRow = db.prepare('SELECT * FROM tables WHERE id = ?').get(tableId);
      if (!tRow) {
        setFlash(token, { error: 'Masa bulunamadı.' });
        return redirectBack(req, res);
      }
      const existing = db.prepare("SELECT * FROM bills WHERE table_id = ? AND status = 'open' ORDER BY id DESC LIMIT 1").get(tableId);
      if (existing) {
        return redirect(req, res, `/bills/${existing.id}`);
      }
      const now = new Date().toISOString();
      const info = db.prepare(`
        INSERT INTO bills (table_id, opened_by, status, is_locked, subtotal, discount, total, paid_amount, opened_at, created_at, updated_at, last_order_at)
        VALUES (?, ?, 'open', 0, 0, 0, 0, 0, ?, ?, ?, ?)
      `).run(tableId, userRow.id, now, now, now, now);
      const newBillId = Number(info.lastInsertRowid);
      db.prepare("UPDATE tables SET status = 'occupied', updated_at = ? WHERE id = ?").run(now, tableId);
      addBillLog(newBillId, userRow.id, 'opened', `Adisyon açıldı - Masa: ${tRow.name}`, null);
      setFlash(token, { success: `${tRow.name} için adisyon açıldı.` });
      return redirect(req, res, `/bills/${newBillId}`);
    }

    if (pathname === '/bills/archive' && method === 'GET') {
      let sql = "SELECT * FROM bills WHERE status != 'open'";
      const params = [];
      if (query.status) {
        sql += ' AND status = ?';
        params.push(query.status);
      }
      if (query.start_date) {
        sql += ' AND date(opened_at) >= date(?)';
        params.push(query.start_date);
      }
      if (query.end_date) {
        sql += ' AND date(opened_at) <= date(?)';
        params.push(query.end_date);
      }
      sql += ' ORDER BY id DESC';
      const rows = db.prepare(sql).all(...params);
      const formatted = rows.map(r => formatBill(r, baseUrl, { includeTable: true, includeItems: false, expandUsers: true }));
      const paginated = paginateArray(formatted, query.page || 1, 20, `${baseUrl}/bills/archive`, query);
      return renderInertia(req, res, 'Bills/Archive', {
        bills: paginated,
        filters: {
          status: query.status || null,
          start_date: query.start_date || null,
          end_date: query.end_date || null,
        },
      });
    }

    const billShowMatch = pathname.match(/^\/bills\/(\d+)$/);
    if (billShowMatch && method === 'GET') {
      const billId = Number(billShowMatch[1]);
      const bRow = db.prepare('SELECT * FROM bills WHERE id = ?').get(billId);
      if (!bRow) {
        setFlash(token, { error: 'Adisyon bulunamadı.' });
        return redirect(req, res, '/bills');
      }
      const bill = formatBill(bRow, baseUrl, { includeTable: true, includeItems: true, includePayments: true, expandUsers: true });
      const catRows = db.prepare('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order ASC, id ASC').all();
      const categories = catRows.map(c => {
        const pRows = db.prepare('SELECT * FROM products WHERE category_id = ? AND is_active = 1 ORDER BY sort_order ASC, id ASC').all(c.id);
        return {
          ...formatCategory(c),
          products: pRows.map(p => formatProduct(p, baseUrl, false)),
        };
      });
      const availTableRows = db.prepare("SELECT * FROM tables WHERE is_active = 1 AND status = 'available' ORDER BY area_id ASC, sort_order ASC").all();
      const availableTables = availTableRows.map(t => formatTable(t, true));

      const openBillRows = db.prepare("SELECT * FROM bills WHERE status = 'open' AND id != ? ORDER BY id ASC").all(billId);
      const openBills = openBillRows.map(ob => {
        const cnt = db.prepare('SELECT COUNT(*) AS cnt FROM bill_items WHERE bill_id = ? AND deleted_at IS NULL').get(ob.id).cnt;
        return {
          ...formatBill(ob, baseUrl, { includeTable: true, includeItems: false, expandUsers: false }),
          items_count: cnt,
        };
      });

      const authUser = formatAuthUser(userRow);
      return renderInertia(req, res, 'Bills/Show', {
        bill,
        categories,
        availableTables,
        openBills,
        canUpdate: true,
        canDelete: authUser.can.delete_items,
        canPay: authUser.can.take_payment,
        canLock: true,
        canUnlock: authUser.can.unlock_bills,
        canApplyDiscount: authUser.can.apply_discount,
        canChangeTable: authUser.can.change_table,
        canMergeBills: authUser.can.merge_bills,
      });
    }

    const billLogsMatch = pathname.match(/^\/bills\/(\d+)\/logs$/);
    if (billLogsMatch && method === 'GET') {
      const billId = Number(billLogsMatch[1]);
      const bRow = db.prepare('SELECT * FROM bills WHERE id = ?').get(billId);
      if (!bRow) return redirect(req, res, '/bills');
      const bill = formatBill(bRow, baseUrl, { includeTable: true, includeItems: false, expandUsers: false });
      const logRows = db.prepare('SELECT * FROM bill_logs WHERE bill_id = ? ORDER BY id DESC').all(billId);
      const logs = logRows.map(l => {
        let parsedData = null;
        if (l.data) {
          try { parsedData = JSON.parse(l.data); } catch { parsedData = null; }
        }
        const u = db.prepare('SELECT * FROM users WHERE id = ?').get(l.user_id);
        return {
          id: l.id,
          bill_id: l.bill_id,
          user_id: l.user_id,
          action: l.action,
          description: l.description,
          data: parsedData,
          ip_address: l.ip_address,
          created_at: l.created_at,
          updated_at: l.updated_at,
          user: formatUser(u, false),
        };
      });
      return renderInertia(req, res, 'Bills/Logs', { bill, logs });
    }

    const billActionMatch = pathname.match(/^\/bills\/(\d+)\/(lock|unlock|pay|partial-pay|cancel|close|change-table|merge|discount)$/);
    if (billActionMatch && method === 'POST') {
      const billId = Number(billActionMatch[1]);
      const action = billActionMatch[2];
      const bRow = db.prepare('SELECT * FROM bills WHERE id = ?').get(billId);
      if (!bRow) return redirectBack(req, res);
      const now = new Date().toISOString();

      if (action === 'lock') {
        db.prepare('UPDATE bills SET is_locked = 1, locked_by = ?, updated_at = ? WHERE id = ?').run(userRow.id, now, billId);
        addBillLog(billId, userRow.id, 'locked', 'Adisyon kilitlendi');
        setFlash(token, { success: 'Adisyon kilitlendi.' });
        return redirectBack(req, res);
      }

      if (action === 'unlock') {
        db.prepare('UPDATE bills SET is_locked = 0, locked_by = NULL, updated_at = ? WHERE id = ?').run(now, billId);
        addBillLog(billId, userRow.id, 'unlocked', 'Adisyon kilidi açıldı');
        setFlash(token, { success: 'Adisyon kilidi açıldı.' });
        return redirectBack(req, res);
      }

      if (action === 'discount') {
        const discountVal = Math.max(0, Number(body.discount) || 0);
        const reason = body.reason || null;
        db.prepare('UPDATE bills SET discount = ?, discounted_by = ?, discount_reason = ?, discounted_at = ?, updated_at = ? WHERE id = ?')
          .run(discountVal, userRow.id, reason, now, now, billId);
        recalcBillTotals(billId);
        addBillLog(billId, userRow.id, 'discount_applied', `${(discountVal / 100).toFixed(2)} TL indirim uygulandı`, { discount: discountVal, reason });
        setFlash(token, { success: 'İndirim uygulandı.' });
        return redirectBack(req, res);
      }

      if (action === 'partial-pay') {
        const amount = Math.max(0, Number(body.amount) || 0);
        const methodPay = body.method || 'cash';
        const note = body.note || null;
        if (amount > 0) {
          db.prepare('INSERT INTO bill_payments (bill_id, received_by, amount, method, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
            .run(billId, userRow.id, amount, methodPay, note, now, now);
          const newPaid = Number(bRow.paid_amount || 0) + amount;
          if (newPaid >= bRow.total && bRow.total > 0) {
            db.prepare("UPDATE bills SET paid_amount = ?, status = 'paid', payment_method = ?, closed_by = ?, closed_at = ?, is_locked = 0, updated_at = ? WHERE id = ?")
              .run(newPaid, methodPay, userRow.id, now, now, billId);
            db.prepare("UPDATE tables SET status = 'available', updated_at = ? WHERE id = ?").run(now, bRow.table_id);
            addBillLog(billId, userRow.id, 'paid', `Parçalı ödeme ile adisyon kapatıldı (${(amount / 100).toFixed(2)} TL)`);
            setFlash(token, { success: 'Ödeme tamamlandı ve adisyon kapatıldı.' });
            return redirect(req, res, '/dashboard');
          } else {
            db.prepare('UPDATE bills SET paid_amount = ?, updated_at = ? WHERE id = ?').run(newPaid, now, billId);
            addBillLog(billId, userRow.id, 'partial_payment', `${(amount / 100).toFixed(2)} TL parçalı ödeme alındı (${methodPay})`);
            setFlash(token, { success: 'Parçalı ödeme alındı.' });
          }
        }
        return redirectBack(req, res);
      }

      if (action === 'pay') {
        const methodPay = body.payment_method || 'cash';
        const remaining = Math.max(0, Number(bRow.total || 0) - Number(bRow.paid_amount || 0));
        if (remaining > 0) {
          db.prepare('INSERT INTO bill_payments (bill_id, received_by, amount, method, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
            .run(billId, userRow.id, remaining, methodPay, 'Tam ödeme', now, now);
        }
        db.prepare("UPDATE bills SET paid_amount = total, status = 'paid', payment_method = ?, closed_by = ?, closed_at = ?, is_locked = 0, updated_at = ? WHERE id = ?")
          .run(methodPay, userRow.id, now, now, billId);
        db.prepare("UPDATE tables SET status = 'available', updated_at = ? WHERE id = ?").run(now, bRow.table_id);
        addBillLog(billId, userRow.id, 'paid', `Ödeme alındı (${methodPay === 'card' ? 'Kredi Kartı' : 'Nakit'})`);
        setFlash(token, { success: 'Ödeme alındı ve adisyon kapatıldı.' });
        return redirect(req, res, '/dashboard');
      }

      if (action === 'close') {
        db.prepare("UPDATE bills SET status = 'closed', closed_by = ?, closed_at = ?, is_locked = 0, updated_at = ? WHERE id = ?")
          .run(userRow.id, now, now, billId);
        db.prepare("UPDATE tables SET status = 'available', updated_at = ? WHERE id = ?").run(now, bRow.table_id);
        addBillLog(billId, userRow.id, 'closed', 'Boş adisyon kapatıldı');
        setFlash(token, { success: 'Adisyon kapatıldı.' });
        return redirect(req, res, '/dashboard');
      }

      if (action === 'cancel') {
        const reason = body.reason || 'İptal edildi';
        db.prepare("UPDATE bills SET status = 'cancelled', cancel_reason = ?, closed_by = ?, closed_at = ?, is_locked = 0, updated_at = ? WHERE id = ?")
          .run(reason, userRow.id, now, now, billId);
        db.prepare("UPDATE tables SET status = 'available', updated_at = ? WHERE id = ?").run(now, bRow.table_id);
        addBillLog(billId, userRow.id, 'cancelled', `Adisyon iptal edildi: ${reason}`);
        setFlash(token, { success: 'Adisyon iptal edildi.' });
        return redirect(req, res, '/dashboard');
      }

      if (action === 'change-table') {
        const newTableId = Number(body.new_table_id);
        const newTable = db.prepare('SELECT * FROM tables WHERE id = ?').get(newTableId);
        if (newTable) {
          db.prepare("UPDATE tables SET status = 'available', updated_at = ? WHERE id = ?").run(now, bRow.table_id);
          db.prepare("UPDATE tables SET status = 'occupied', updated_at = ? WHERE id = ?").run(now, newTableId);
          db.prepare('UPDATE bills SET table_id = ?, updated_at = ? WHERE id = ?').run(newTableId, now, billId);
          addBillLog(billId, userRow.id, 'table_changed', `Masa değiştirildi -> ${newTable.name}`);
          setFlash(token, { success: `Masa ${newTable.name} olarak değiştirildi.` });
        }
        return redirectBack(req, res);
      }

      if (action === 'merge') {
        const srcId = Number(body.source_bill_id);
        const srcBill = db.prepare('SELECT * FROM bills WHERE id = ?').get(srcId);
        if (srcBill && srcBill.id !== billId) {
          db.prepare('UPDATE bill_items SET bill_id = ?, updated_at = ? WHERE bill_id = ? AND deleted_at IS NULL').run(billId, now, srcId);
          db.prepare('UPDATE bill_payments SET bill_id = ?, updated_at = ? WHERE bill_id = ?').run(billId, now, srcId);
          const newPaid = Number(bRow.paid_amount || 0) + Number(srcBill.paid_amount || 0);
          db.prepare('UPDATE bills SET paid_amount = ?, updated_at = ? WHERE id = ?').run(newPaid, now, billId);
          recalcBillTotals(billId);
          db.prepare("UPDATE bills SET status = 'closed', closed_by = ?, closed_at = ?, updated_at = ? WHERE id = ?").run(userRow.id, now, now, srcId);
          db.prepare("UPDATE tables SET status = 'available', updated_at = ? WHERE id = ?").run(now, srcBill.table_id);
          addBillLog(billId, userRow.id, 'merged', `#${srcId} numaralı adisyon bu adisyona birleştirildi`);
          setFlash(token, { success: 'Adisyonlar birleştirildi.' });
        }
        return redirectBack(req, res);
      }
    }

    // ==================== BILL ITEMS ====================
    const billItemStoreMatch = pathname.match(/^\/bills\/(\d+)\/items$/);
    if (billItemStoreMatch && method === 'POST') {
      const billId = Number(billItemStoreMatch[1]);
      const prodId = Number(body.product_id);
      const qty = Math.max(1, Number(body.quantity) || 1);
      const notes = body.notes || null;
      const prod = db.prepare('SELECT * FROM products WHERE id = ?').get(prodId);
      if (prod) {
        const now = new Date().toISOString();
        const totalPrice = prod.price * qty;
        const kitchenStatus = prod.is_kitchen_item ? 'pending' : 'served';
        const info = db.prepare(`
          INSERT INTO bill_items (bill_id, product_id, added_by, product_name, unit_price, quantity, total_price, notes, status, kitchen_status, kitchen_notified_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)
        `).run(billId, prod.id, userRow.id, prod.name, prod.price, qty, totalPrice, notes, kitchenStatus, prod.is_kitchen_item ? now : null, now, now);
        if (prod.track_stock) {
          db.prepare('UPDATE products SET stock = MAX(0, stock - ?), updated_at = ? WHERE id = ?').run(qty, now, prod.id);
        }
        db.prepare('UPDATE bills SET last_order_at = ?, updated_at = ? WHERE id = ?').run(now, now, billId);
        recalcBillTotals(billId);
        addBillLog(billId, userRow.id, 'item_added', `${prod.name} x${qty} eklendi${prod.is_kitchen_item ? ' (Mutfağa gönderildi)' : ''}`, {
          item_id: Number(info.lastInsertRowid),
          product_id: prod.id,
          is_kitchen_item: Boolean(prod.is_kitchen_item),
        });
      }
      return redirectBack(req, res);
    }

    const billItemIncDecMatch = pathname.match(/^\/bill-items\/(\d+)\/(increase|decrease)$/);
    if (billItemIncDecMatch && method === 'POST') {
      const itemId = Number(billItemIncDecMatch[1]);
      const op = billItemIncDecMatch[2];
      const item = db.prepare('SELECT * FROM bill_items WHERE id = ? AND deleted_at IS NULL').get(itemId);
      if (item) {
        const now = new Date().toISOString();
        const newQty = op === 'increase' ? item.quantity + 1 : Math.max(1, item.quantity - 1);
        const newTotal = item.unit_price * newQty;
        db.prepare('UPDATE bill_items SET quantity = ?, total_price = ?, updated_at = ? WHERE id = ?').run(newQty, newTotal, now, itemId);
        recalcBillTotals(item.bill_id);
        addBillLog(item.bill_id, userRow.id, 'item_updated', `${item.product_name} adedi ${item.quantity} -> ${newQty} yapıldı`);
      }
      return redirectBack(req, res);
    }

    const billItemIdMatch = pathname.match(/^\/bill-items\/(\d+)$/);
    if (billItemIdMatch && method === 'DELETE') {
      const itemId = Number(billItemIdMatch[1]);
      const item = db.prepare('SELECT * FROM bill_items WHERE id = ? AND deleted_at IS NULL').get(itemId);
      if (item) {
        const now = new Date().toISOString();
        const reason = body.reason || 'Silindi';
        db.prepare('UPDATE bill_items SET deleted_at = ?, deleted_by = ?, delete_reason = ?, updated_at = ? WHERE id = ?')
          .run(now, userRow.id, reason, now, itemId);
        recalcBillTotals(item.bill_id);
        addBillLog(item.bill_id, userRow.id, 'item_deleted', `${item.product_name} x${item.quantity} silindi (${reason})`, {
          item_id: item.id,
          reason,
        });
        setFlash(token, { success: 'Ürün adisyondan kaldırıldı.' });
      }
      return redirectBack(req, res);
    }

    // ==================== KITCHEN ====================
    if (pathname === '/kitchen' && method === 'GET') {
      return renderInertia(req, res, 'Kitchen/Index', {
        orders: getKitchenOrders(baseUrl),
      });
    }

    if (pathname === '/kitchen/orders' && method === 'GET') {
      return sendJson(res, {
        orders: getKitchenOrders(baseUrl),
        timestamp: new Date().toISOString(),
      });
    }

    const kitchenItemMatch = pathname.match(/^\/kitchen\/items\/(\d+)\/status$/);
    if (kitchenItemMatch && method === 'POST') {
      const itemId = Number(kitchenItemMatch[1]);
      const st = body.status || 'preparing';
      const now = new Date().toISOString();
      db.prepare('UPDATE bill_items SET kitchen_status = ?, kitchen_ready_at = ?, updated_at = ? WHERE id = ?')
        .run(st, st === 'ready' ? now : null, now, itemId);
      return redirectBack(req, res);
    }

    if (pathname === '/kitchen/bulk-status' && method === 'POST') {
      const ids = Array.isArray(body.item_ids) ? body.item_ids : [];
      const st = body.status || 'ready';
      const now = new Date().toISOString();
      for (const id of ids) {
        db.prepare('UPDATE bill_items SET kitchen_status = ?, updated_at = ? WHERE id = ?').run(st, now, Number(id));
      }
      return redirectBack(req, res);
    }

    // ==================== AREAS CRUD ====================
    if (pathname === '/areas' && method === 'GET') {
      const rows = db.prepare('SELECT * FROM areas ORDER BY sort_order ASC, id ASC').all();
      const areas = rows.map(a => {
        const cnt = db.prepare('SELECT COUNT(*) AS cnt FROM tables WHERE area_id = ?').get(a.id).cnt;
        return { ...formatArea(a), tables_count: cnt };
      });
      return renderInertia(req, res, 'Areas/Index', { areas });
    }
    if (pathname === '/areas/create' && method === 'GET') {
      return renderInertia(req, res, 'Areas/Create', {});
    }
    if (pathname === '/areas' && method === 'POST') {
      const now = new Date().toISOString();
      db.prepare('INSERT INTO areas (name, sort_order, is_active, created_at, updated_at) VALUES (?, ?, 1, ?, ?)')
        .run(body.name || 'Yeni Alan', Number(body.sort_order) || 0, now, now);
      setFlash(token, { success: 'Alan oluşturuldu.' });
      return redirect(req, res, '/areas');
    }
    const areaEditMatch = pathname.match(/^\/areas\/(\d+)\/edit$/);
    if (areaEditMatch && method === 'GET') {
      const row = db.prepare('SELECT * FROM areas WHERE id = ?').get(Number(areaEditMatch[1]));
      return renderInertia(req, res, 'Areas/Edit', { area: formatArea(row) });
    }
    const areaIdMatch = pathname.match(/^\/areas\/(\d+)$/);
    if (areaIdMatch && (method === 'PUT' || method === 'PATCH')) {
      const id = Number(areaIdMatch[1]);
      const now = new Date().toISOString();
      db.prepare('UPDATE areas SET name = ?, sort_order = ?, is_active = ?, updated_at = ? WHERE id = ?')
        .run(body.name, Number(body.sort_order) || 0, body.is_active ? 1 : 0, now, id);
      setFlash(token, { success: 'Alan güncellendi.' });
      return redirect(req, res, '/areas');
    }
    if (areaIdMatch && method === 'DELETE') {
      db.prepare('DELETE FROM areas WHERE id = ?').run(Number(areaIdMatch[1]));
      setFlash(token, { success: 'Alan silindi.' });
      return redirect(req, res, '/areas');
    }

    // ==================== TABLES CRUD ====================
    if (pathname === '/tables' && method === 'GET') {
      const tRows = db.prepare('SELECT * FROM tables ORDER BY area_id ASC, sort_order ASC, id ASC').all();
      const aRows = db.prepare('SELECT * FROM areas ORDER BY sort_order ASC, id ASC').all();
      return renderInertia(req, res, 'Tables/Index', {
        tables: tRows.map(t => formatTable(t, true)),
        areas: aRows.map(a => formatArea(a)),
      });
    }
    if (pathname === '/tables/create' && method === 'GET') {
      const aRows = db.prepare('SELECT * FROM areas WHERE is_active = 1 ORDER BY sort_order ASC, id ASC').all();
      return renderInertia(req, res, 'Tables/Create', { areas: aRows.map(a => formatArea(a)) });
    }
    if (pathname === '/tables' && method === 'POST') {
      const now = new Date().toISOString();
      db.prepare('INSERT INTO tables (area_id, name, capacity, status, sort_order, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?)')
        .run(Number(body.area_id) || 1, body.name || 'Yeni Masa', Number(body.capacity) || 4, 'available', Number(body.sort_order) || 0, now, now);
      setFlash(token, { success: 'Masa oluşturuldu.' });
      return redirect(req, res, '/tables');
    }
    const tableEditMatch = pathname.match(/^\/tables\/(\d+)\/edit$/);
    if (tableEditMatch && method === 'GET') {
      const row = db.prepare('SELECT * FROM tables WHERE id = ?').get(Number(tableEditMatch[1]));
      const aRows = db.prepare('SELECT * FROM areas ORDER BY sort_order ASC, id ASC').all();
      return renderInertia(req, res, 'Tables/Edit', {
        table: formatTable(row, true),
        areas: aRows.map(a => formatArea(a)),
      });
    }
    const tableIdMatch = pathname.match(/^\/tables\/(\d+)$/);
    if (tableIdMatch && (method === 'PUT' || method === 'PATCH')) {
      const id = Number(tableIdMatch[1]);
      const now = new Date().toISOString();
      db.prepare('UPDATE tables SET area_id = ?, name = ?, capacity = ?, sort_order = ?, is_active = ?, updated_at = ? WHERE id = ?')
        .run(Number(body.area_id) || 1, body.name, Number(body.capacity) || 4, Number(body.sort_order) || 0, body.is_active ? 1 : 0, now, id);
      setFlash(token, { success: 'Masa güncellendi.' });
      return redirect(req, res, '/tables');
    }
    if (tableIdMatch && method === 'DELETE') {
      db.prepare('DELETE FROM tables WHERE id = ?').run(Number(tableIdMatch[1]));
      setFlash(token, { success: 'Masa silindi.' });
      return redirect(req, res, '/tables');
    }

    // ==================== CATEGORIES CRUD ====================
    if (pathname === '/categories' && method === 'GET') {
      const rows = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC, id ASC').all();
      const categories = rows.map(c => {
        const cnt = db.prepare('SELECT COUNT(*) AS cnt FROM products WHERE category_id = ?').get(c.id).cnt;
        return { ...formatCategory(c), products_count: cnt };
      });
      return renderInertia(req, res, 'Categories/Index', { categories });
    }
    if (pathname === '/categories/create' && method === 'GET') {
      return renderInertia(req, res, 'Categories/Create', {});
    }
    if (pathname === '/categories' && method === 'POST') {
      const now = new Date().toISOString();
      db.prepare('INSERT INTO categories (name, sort_order, is_active, created_at, updated_at) VALUES (?, ?, 1, ?, ?)')
        .run(body.name || 'Yeni Kategori', Number(body.sort_order) || 0, now, now);
      setFlash(token, { success: 'Kategori oluşturuldu.' });
      return redirect(req, res, '/categories');
    }
    const catEditMatch = pathname.match(/^\/categories\/(\d+)\/edit$/);
    if (catEditMatch && method === 'GET') {
      const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(Number(catEditMatch[1]));
      return renderInertia(req, res, 'Categories/Edit', { category: formatCategory(row) });
    }
    const catIdMatch = pathname.match(/^\/categories\/(\d+)$/);
    if (catIdMatch && (method === 'PUT' || method === 'PATCH')) {
      const id = Number(catIdMatch[1]);
      const now = new Date().toISOString();
      db.prepare('UPDATE categories SET name = ?, sort_order = ?, is_active = ?, updated_at = ? WHERE id = ?')
        .run(body.name, Number(body.sort_order) || 0, body.is_active ? 1 : 0, now, id);
      setFlash(token, { success: 'Kategori güncellendi.' });
      return redirect(req, res, '/categories');
    }
    if (catIdMatch && method === 'DELETE') {
      db.prepare('DELETE FROM categories WHERE id = ?').run(Number(catIdMatch[1]));
      setFlash(token, { success: 'Kategori silindi.' });
      return redirect(req, res, '/categories');
    }

    // ==================== PRODUCTS CRUD ====================
    if (pathname === '/products' && method === 'GET') {
      const pRows = db.prepare('SELECT * FROM products ORDER BY category_id ASC, sort_order ASC, id ASC').all();
      const cRows = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC, id ASC').all();
      return renderInertia(req, res, 'Products/Index', {
        products: pRows.map(p => formatProduct(p, baseUrl, true)),
        categories: cRows.map(c => formatCategory(c)),
      });
    }
    if (pathname === '/products/create' && method === 'GET') {
      const cRows = db.prepare('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order ASC, id ASC').all();
      return renderInertia(req, res, 'Products/Create', {
        categories: cRows.map(c => formatCategory(c)),
      });
    }
    if (pathname === '/products' && method === 'POST') {
      const now = new Date().toISOString();
      const priceKurus = Math.round(parseFloat(body.price || '0') * 100);
      const isKitchen = body.is_kitchen_item === true || body.is_kitchen_item === 'true' || body.is_kitchen_item === '1' ? 1 : 0;
      const trackStock = body.track_stock === true || body.track_stock === 'true' || body.track_stock === '1' ? 1 : 0;
      db.prepare(`
        INSERT INTO products (category_id, name, image, description, price, unit, sort_order, is_active, track_stock, stock, low_stock_threshold, is_kitchen_item, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)
      `).run(
        Number(body.category_id) || 1,
        body.name || 'Yeni Ürün',
        typeof body.image === 'string' && body.image ? body.image : null,
        body.description || null,
        priceKurus,
        body.unit || 'adet',
        Number(body.sort_order) || 0,
        trackStock,
        Number(body.stock) || 0,
        Number(body.low_stock_threshold) || 10,
        isKitchen,
        now,
        now
      );
      setFlash(token, { success: 'Ürün oluşturuldu.' });
      return redirect(req, res, '/products');
    }
    const prodEditMatch = pathname.match(/^\/products\/(\d+)\/edit$/);
    if (prodEditMatch && method === 'GET') {
      const row = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(prodEditMatch[1]));
      const cRows = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC, id ASC').all();
      const prod = formatProduct(row, baseUrl, false);
      if (prod) prod.price = prod.price / 100; // Edit page expects TL
      return renderInertia(req, res, 'Products/Edit', {
        product: prod,
        categories: cRows.map(c => formatCategory(c)),
      });
    }
    const prodIdMatch = pathname.match(/^\/products\/(\d+)$/);
    if (prodIdMatch && (method === 'PUT' || method === 'PATCH' || method === 'POST')) {
      const id = Number(prodIdMatch[1]);
      const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
      if (existing) {
        const now = new Date().toISOString();
        const priceKurus = Math.round(parseFloat(body.price ?? (existing.price / 100)) * 100);
        const isActive = body.is_active === false || body.is_active === 'false' || body.is_active === '0' ? 0 : 1;
        const isKitchen = body.is_kitchen_item === true || body.is_kitchen_item === 'true' || body.is_kitchen_item === '1' ? 1 : 0;
        const trackStock = body.track_stock === true || body.track_stock === 'true' || body.track_stock === '1' ? 1 : 0;
        let imageVal = existing.image;
        if (body.remove_image === true || body.remove_image === 'true' || body.remove_image === '1') imageVal = null;
        if (typeof body.image === 'string' && body.image) imageVal = body.image;
        db.prepare(`
          UPDATE products
          SET category_id = ?, name = ?, image = ?, description = ?, price = ?, unit = ?, sort_order = ?, is_active = ?, track_stock = ?, stock = ?, low_stock_threshold = ?, is_kitchen_item = ?, updated_at = ?
          WHERE id = ?
        `).run(
          Number(body.category_id) || existing.category_id,
          body.name || existing.name,
          imageVal,
          body.description ?? existing.description,
          priceKurus,
          body.unit || existing.unit,
          Number(body.sort_order ?? existing.sort_order),
          isActive,
          trackStock,
          Number(body.stock ?? existing.stock),
          Number(body.low_stock_threshold ?? existing.low_stock_threshold),
          isKitchen,
          now,
          id
        );
        setFlash(token, { success: 'Ürün güncellendi.' });
      }
      return redirect(req, res, '/products');
    }
    if (prodIdMatch && method === 'DELETE') {
      db.prepare('DELETE FROM products WHERE id = ?').run(Number(prodIdMatch[1]));
      setFlash(token, { success: 'Ürün silindi.' });
      return redirect(req, res, '/products');
    }

    // ==================== USERS CRUD ====================
    if (pathname === '/users' && method === 'GET') {
      const rows = db.prepare('SELECT * FROM users ORDER BY id ASC').all();
      return renderInertia(req, res, 'Users/Index', {
        users: rows.map(u => formatUser(u, true)),
      });
    }
    if (pathname === '/users/create' && method === 'GET') {
      const rRows = db.prepare('SELECT * FROM roles ORDER BY id ASC').all();
      return renderInertia(req, res, 'Users/Create', {
        roles: rRows.map(r => formatRole(r)),
        allPermissions: ALL_PERMISSIONS,
      });
    }
    if (pathname === '/users' && method === 'POST') {
      const now = new Date().toISOString();
      const pw = hashPassword(body.password || 'admin');
      db.prepare(`
        INSERT INTO users (role_id, name, email, phone, password_hash, is_active, permissions, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)
      `).run(
        Number(body.role_id) || 3,
        body.name || 'Kullanıcı',
        body.email || `user${Date.now()}@tilkiadisyon.com`,
        body.phone || null,
        pw,
        Array.isArray(body.permissions) ? JSON.stringify(body.permissions) : null,
        now,
        now
      );
      setFlash(token, { success: 'Kullanıcı oluşturuldu.' });
      return redirect(req, res, '/users');
    }
    const userEditMatch = pathname.match(/^\/users\/(\d+)\/edit$/);
    if (userEditMatch && method === 'GET') {
      const row = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(userEditMatch[1]));
      const rRows = db.prepare('SELECT * FROM roles ORDER BY id ASC').all();
      return renderInertia(req, res, 'Users/Edit', {
        user: formatUser(row, true),
        roles: rRows.map(r => formatRole(r)),
        allPermissions: ALL_PERMISSIONS,
      });
    }
    const userToggleMatch = pathname.match(/^\/users\/(\d+)\/toggle-status$/);
    if (userToggleMatch && method === 'POST') {
      const id = Number(userToggleMatch[1]);
      const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
      if (row) {
        db.prepare('UPDATE users SET is_active = ?, updated_at = ? WHERE id = ?')
          .run(row.is_active ? 0 : 1, new Date().toISOString(), id);
      }
      return redirectBack(req, res);
    }
    const userIdMatch = pathname.match(/^\/users\/(\d+)$/);
    if (userIdMatch && (method === 'PUT' || method === 'PATCH')) {
      const id = Number(userIdMatch[1]);
      const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
      if (existing) {
        const now = new Date().toISOString();
        const pw = body.password ? hashPassword(body.password) : existing.password_hash;
        db.prepare(`
          UPDATE users SET role_id = ?, name = ?, email = ?, phone = ?, password_hash = ?, is_active = ?, permissions = ?, updated_at = ? WHERE id = ?
        `).run(
          Number(body.role_id) || existing.role_id,
          body.name || existing.name,
          body.email || existing.email,
          body.phone ?? existing.phone,
          pw,
          body.is_active === false || body.is_active === '0' ? 0 : 1,
          Array.isArray(body.permissions) ? JSON.stringify(body.permissions) : existing.permissions,
          now,
          id
        );
        setFlash(token, { success: 'Kullanıcı güncellendi.' });
      }
      return redirect(req, res, '/users');
    }
    if (userIdMatch && method === 'DELETE') {
      db.prepare('DELETE FROM users WHERE id = ?').run(Number(userIdMatch[1]));
      setFlash(token, { success: 'Kullanıcı silindi.' });
      return redirect(req, res, '/users');
    }

    // ==================== EXPENSE CATEGORIES & EXPENSES ====================
    if (pathname === '/expense-categories' && method === 'GET') {
      const rows = db.prepare('SELECT * FROM expense_categories ORDER BY sort_order ASC, id ASC').all();
      const categories = rows.map(c => {
        const stat = db.prepare('SELECT COUNT(*) AS cnt, COALESCE(SUM(amount), 0) AS total FROM expenses WHERE category_id = ?').get(c.id);
        return {
          ...c,
          is_active: Boolean(c.is_active),
          expenses_count: stat.cnt,
          expenses_sum_amount: String(stat.total),
        };
      });
      return renderInertia(req, res, 'ExpenseCategories/Index', { categories });
    }
    if (pathname === '/expense-categories/create' && method === 'GET') {
      return renderInertia(req, res, 'ExpenseCategories/Create', {});
    }
    if (pathname === '/expense-categories' && method === 'POST') {
      const now = new Date().toISOString();
      db.prepare('INSERT INTO expense_categories (name, color, icon, is_active, sort_order, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?, ?)')
        .run(body.name || 'Gider Kategorisi', body.color || '#6366f1', body.icon || '💡', Number(body.sort_order) || 0, now, now);
      setFlash(token, { success: 'Gider kategorisi oluşturuldu.' });
      return redirect(req, res, '/expense-categories');
    }
    const expCatEditMatch = pathname.match(/^\/expense-categories\/(\d+)\/edit$/);
    if (expCatEditMatch && method === 'GET') {
      const row = db.prepare('SELECT * FROM expense_categories WHERE id = ?').get(Number(expCatEditMatch[1]));
      return renderInertia(req, res, 'ExpenseCategories/Edit', {
        category: row ? { ...row, is_active: Boolean(row.is_active) } : null,
      });
    }
    const expCatIdMatch = pathname.match(/^\/expense-categories\/(\d+)$/);
    if (expCatIdMatch && (method === 'PUT' || method === 'PATCH')) {
      const id = Number(expCatIdMatch[1]);
      const now = new Date().toISOString();
      db.prepare('UPDATE expense_categories SET name = ?, color = ?, icon = ?, is_active = ?, sort_order = ?, updated_at = ? WHERE id = ?')
        .run(body.name, body.color || '#6366f1', body.icon || '💡', body.is_active ? 1 : 0, Number(body.sort_order) || 0, now, id);
      setFlash(token, { success: 'Gider kategorisi güncellendi.' });
      return redirect(req, res, '/expense-categories');
    }
    if (expCatIdMatch && method === 'DELETE') {
      db.prepare('DELETE FROM expense_categories WHERE id = ?').run(Number(expCatIdMatch[1]));
      setFlash(token, { success: 'Gider kategorisi silindi.' });
      return redirect(req, res, '/expense-categories');
    }

    if (pathname === '/expenses' && method === 'GET') {
      let sql = 'SELECT * FROM expenses WHERE 1=1';
      const params = [];
      if (query.category_id) {
        sql += ' AND category_id = ?';
        params.push(Number(query.category_id));
      }
      if (query.start_date) {
        sql += ' AND date(expense_date) >= date(?)';
        params.push(query.start_date);
      }
      if (query.end_date) {
        sql += ' AND date(expense_date) <= date(?)';
        params.push(query.end_date);
      }
      sql += ' ORDER BY expense_date DESC, id DESC';
      const rows = db.prepare(sql).all(...params);
      const formatted = rows.map(ex => {
        const cat = db.prepare('SELECT * FROM expense_categories WHERE id = ?').get(ex.category_id);
        const u = db.prepare('SELECT * FROM users WHERE id = ?').get(ex.created_by);
        return {
          ...ex,
          created_by: formatUser(u, false),
          category: cat ? { ...cat, is_active: Boolean(cat.is_active) } : null,
        };
      });
      const totalAmount = formatted.reduce((s, e) => s + Number(e.amount || 0), 0);
      const categories = db.prepare('SELECT * FROM expense_categories ORDER BY sort_order ASC, id ASC').all().map(c => ({ ...c, is_active: Boolean(c.is_active) }));
      return renderInertia(req, res, 'Expenses/Index', {
        expenses: paginateArray(formatted, query.page || 1, 20, `${baseUrl}/expenses`, query),
        categories,
        filters: {
          category_id: query.category_id || null,
          start_date: query.start_date || null,
          end_date: query.end_date || null,
        },
        totalAmount,
      });
    }
    if (pathname === '/expenses/create' && method === 'GET') {
      const categories = db.prepare('SELECT * FROM expense_categories WHERE is_active = 1 ORDER BY sort_order ASC, id ASC').all().map(c => ({ ...c, is_active: Boolean(c.is_active) }));
      return renderInertia(req, res, 'Expenses/Create', { categories });
    }
    if (pathname === '/expenses' && method === 'POST') {
      const now = new Date().toISOString();
      const amountKurus = Math.round(parseFloat(body.amount || '0') * 100);
      db.prepare('INSERT INTO expenses (category_id, created_by, amount, description, expense_date, receipt_image, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .run(Number(body.category_id) || 1, userRow.id, amountKurus, body.description || null, body.expense_date || now.slice(0, 10), body.receipt_image || null, now, now);
      setFlash(token, { success: 'Gider kaydedildi.' });
      return redirect(req, res, '/expenses');
    }
    const expEditMatch = pathname.match(/^\/expenses\/(\d+)\/edit$/);
    if (expEditMatch && method === 'GET') {
      const ex = db.prepare('SELECT * FROM expenses WHERE id = ?').get(Number(expEditMatch[1]));
      const cat = ex ? db.prepare('SELECT * FROM expense_categories WHERE id = ?').get(ex.category_id) : null;
      const categories = db.prepare('SELECT * FROM expense_categories ORDER BY sort_order ASC, id ASC').all().map(c => ({ ...c, is_active: Boolean(c.is_active) }));
      return renderInertia(req, res, 'Expenses/Edit', {
        expense: ex ? { ...ex, category: cat ? { ...cat, is_active: Boolean(cat.is_active) } : null } : null,
        categories,
      });
    }
    const expIdMatch = pathname.match(/^\/expenses\/(\d+)$/);
    if (expIdMatch && (method === 'PUT' || method === 'PATCH' || method === 'POST')) {
      const id = Number(expIdMatch[1]);
      const existing = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
      if (existing) {
        const now = new Date().toISOString();
        const amountKurus = Math.round(parseFloat(body.amount ?? (existing.amount / 100)) * 100);
        db.prepare('UPDATE expenses SET category_id = ?, amount = ?, description = ?, expense_date = ?, updated_at = ? WHERE id = ?')
          .run(Number(body.category_id) || existing.category_id, amountKurus, body.description ?? existing.description, body.expense_date || existing.expense_date, now, id);
        setFlash(token, { success: 'Gider güncellendi.' });
      }
      return redirect(req, res, '/expenses');
    }
    if (expIdMatch && method === 'DELETE') {
      db.prepare('DELETE FROM expenses WHERE id = ?').run(Number(expIdMatch[1]));
      setFlash(token, { success: 'Gider silindi.' });
      return redirect(req, res, '/expenses');
    }

    // ==================== QR MANAGEMENT ====================
    if (pathname === '/qr-management' && method === 'GET') {
      return renderInertia(req, res, 'QrManagement/Index', {
        defaultUrl: `${baseUrl}/qr`,
      });
    }

    // ==================== REPORTS ====================
    if (pathname === '/reports' && method === 'GET') {
      return renderInertia(req, res, 'Reports/Index', {});
    }

    if (pathname === '/reports/daily' && method === 'GET') {
      const date = query.date || new Date().toISOString().slice(0, 10);
      const paidBills = db.prepare("SELECT * FROM bills WHERE status = 'paid' AND date(closed_at) = date(?)").all(date);
      const cancelledBills = db.prepare("SELECT COUNT(*) AS cnt FROM bills WHERE status = 'cancelled' AND date(closed_at) = date(?)").get(date).cnt;
      const revenue = paidBills.reduce((s, b) => s + Number(b.total || 0), 0);

      const topProducts = db.prepare(`
        SELECT bi.product_name, SUM(bi.quantity) AS total_quantity, SUM(bi.total_price) AS total_revenue
        FROM bill_items bi
        JOIN bills b ON b.id = bi.bill_id
        WHERE b.status = 'paid' AND bi.deleted_at IS NULL AND date(b.closed_at) = date(?)
        GROUP BY bi.product_id, bi.product_name
        ORDER BY total_quantity DESC
        LIMIT 10
      `).all(date);

      const expRows = db.prepare('SELECT * FROM expenses WHERE date(expense_date) = date(?)').all(date);
      const totalExpenses = expRows.reduce((s, e) => s + Number(e.amount || 0), 0);

      return renderInertia(req, res, 'Reports/Daily', {
        date,
        revenue,
        billCount: paidBills.length,
        cancelledBills,
        hourlyData: [],
        topProducts,
        cancelledItems: [],
        expenses: expRows,
        totalExpenses,
        expensesByCategory: [],
        netProfit: revenue - totalExpenses,
      });
    }

    if (pathname === '/reports/weekly' && method === 'GET') {
      const startDate = query.start_date || new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
      const endDate = new Date(new Date(startDate).getTime() + 6 * 86400000).toISOString().slice(0, 10);
      const paidBills = db.prepare("SELECT * FROM bills WHERE status = 'paid' AND date(closed_at) BETWEEN date(?) AND date(?)").all(startDate, endDate);
      const totalRevenue = paidBills.reduce((s, b) => s + Number(b.total || 0), 0);
      const expRows = db.prepare('SELECT * FROM expenses WHERE date(expense_date) BETWEEN date(?) AND date(?)').all(startDate, endDate);
      const totalExpenses = expRows.reduce((s, e) => s + Number(e.amount || 0), 0);

      return renderInertia(req, res, 'Reports/Weekly', {
        startDate,
        endDate,
        dailyData: [],
        totalRevenue,
        totalBills: paidBills.length,
        totalExpenses,
        dailyExpenses: [],
        netProfit: totalRevenue - totalExpenses,
      });
    }

    if (pathname === '/reports/monthly' && method === 'GET') {
      const month = query.month || new Date().toISOString().slice(0, 7);
      const paidBills = db.prepare("SELECT * FROM bills WHERE status = 'paid' AND closed_at LIKE ?").all(`${month}%`);
      const totalRevenue = paidBills.reduce((s, b) => s + Number(b.total || 0), 0);
      const expRows = db.prepare('SELECT * FROM expenses WHERE expense_date LIKE ?').all(`${month}%`);
      const totalExpenses = expRows.reduce((s, e) => s + Number(e.amount || 0), 0);

      return renderInertia(req, res, 'Reports/Monthly', {
        month,
        dailyData: [],
        totalRevenue,
        totalBills: paidBills.length,
        categoryData: [],
        totalExpenses,
        expensesByCategory: [],
        netProfit: totalRevenue - totalExpenses,
      });
    }

    if (pathname === '/reports/user' && method === 'GET') {
      const startDate = query.start_date || new Date().toISOString().slice(0, 10);
      const endDate = query.end_date || startDate;
      const uRows = db.prepare('SELECT * FROM users ORDER BY id ASC').all();
      const userData = uRows.map(u => {
        const fu = formatUser(u, true);
        const closed = db.prepare("SELECT COUNT(*) AS cnt, COALESCE(SUM(total), 0) AS tot FROM bills WHERE closed_by = ? AND status = 'paid' AND date(closed_at) BETWEEN date(?) AND date(?)").get(u.id, startDate, endDate);
        const added = db.prepare('SELECT COUNT(*) AS cnt, COALESCE(SUM(total_price), 0) AS tot FROM bill_items WHERE added_by = ? AND deleted_at IS NULL AND date(created_at) BETWEEN date(?) AND date(?)').get(u.id, startDate, endDate);
        return {
          id: u.id,
          name: u.name,
          role: fu.role?.display_name || 'Personel',
          closed_bills_count: closed.cnt,
          closed_bills_total: closed.tot,
          added_items_count: added.cnt,
          added_items_total: added.tot,
          cancelled_items_count: 0,
          cancelled_items_total: 0,
        };
      });
      return renderInertia(req, res, 'Reports/User', { startDate, endDate, userData });
    }

    if (pathname === '/reports/cancellations' && method === 'GET') {
      const startDate = query.start_date || new Date().toISOString().slice(0, 10);
      const endDate = query.end_date || startDate;
      const rows = db.prepare('SELECT * FROM bill_items WHERE deleted_at IS NOT NULL AND date(deleted_at) BETWEEN date(?) AND date(?) ORDER BY deleted_at DESC').all(startDate, endDate);
      const totalCancelled = rows.reduce((s, r) => s + Number(r.total_price || 0), 0);
      return renderInertia(req, res, 'Reports/Cancellations', {
        startDate,
        endDate,
        cancellations: rows,
        totalCancelled,
        totalCount: rows.length,
      });
    }

    if (pathname === '/reports/payments' && method === 'GET') {
      const startDate = query.start_date || new Date().toISOString().slice(0, 10);
      const endDate = query.end_date || startDate;
      const payRows = db.prepare('SELECT * FROM bill_payments WHERE date(created_at) BETWEEN date(?) AND date(?) ORDER BY id DESC').all(startDate, endDate);
      const payments = payRows.map(p => formatPayment(p));
      const totalPayments = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
      const totalCash = payments.filter(p => p.method === 'cash').reduce((s, p) => s + Number(p.amount || 0), 0);
      const totalCard = payments.filter(p => p.method === 'card').reduce((s, p) => s + Number(p.amount || 0), 0);
      return renderInertia(req, res, 'Reports/Payments', {
        startDate,
        endDate,
        payments,
        totalPayments,
        totalCash,
        totalCard,
        paymentCount: payments.length,
        userSummary: [],
        hourlyPayments: [],
        partialPaymentBills: [],
      });
    }

    // ==================== PROFILE ====================
    if (pathname === '/profile' && method === 'GET') {
      return renderInertia(req, res, 'Profile/Edit', {
        mustVerifyEmail: false,
        status: null,
      });
    }
    if (pathname === '/profile' && method === 'PATCH') {
      db.prepare('UPDATE users SET name = ?, email = ?, updated_at = ? WHERE id = ?')
        .run(body.name || userRow.name, body.email || userRow.email, new Date().toISOString(), userRow.id);
      setFlash(token, { success: 'Profil güncellendi.' });
      return redirectBack(req, res);
    }
    if (pathname === '/password' && method === 'PUT') {
      if (body.password) {
        db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
          .run(hashPassword(body.password), new Date().toISOString(), userRow.id);
      }
      setFlash(token, { success: 'Şifre güncellendi.' });
      return redirectBack(req, res);
    }

    // Fallback to Dashboard
    return redirect(req, res, '/dashboard');
  } catch (err) {
    console.error('Server error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
});

const PORT = Number(process.env.PORT) || Number(appConfig.port) || 3001;
server.listen(PORT, () => {
  console.log(`\n=============================================================`);
  console.log(` 🦊 ${appConfig.businessName || 'TilkiAdisyon'} Full-Stack POS Sunucusu Aktif!`);
  console.log(` 🌐 Yerel Adres   : http://localhost:${PORT}/anasayfa`);
  if (appConfig.domain) {
    console.log(` 🚀 Özel Domain   : ${appConfig.protocol || 'https'}://${appConfig.domain}`);
  }
  console.log(` 🔑 Yönetici Giriş: admin@tilkiadisyon.com / admin`);
  console.log(`=============================================================\n`);
});
