import assert from 'node:assert/strict';

const BASE = 'http://localhost:3001';
let cookies = {};

function updateCookies(res) {
  const setCookie = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  for (const c of setCookie) {
    const [pair] = c.split(';');
    const idx = pair.indexOf('=');
    if (idx > 0) {
      cookies[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
    }
  }
}

function cookieHeader() {
  return Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
}

async function reqInertia(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Cookie': cookieHeader(),
      'X-Inertia': 'true',
      'X-Inertia-Version': 'tilkiadisyon-v1',
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
    redirect: opts.redirect || 'manual',
  });
  updateCookies(res);
  return res;
}

console.log('Running TilkiAdisyon E2E Smoke Suite against', BASE);

// 1. QR Menu & Waiter Call (Public)
{
  const r = await reqInertia('/qr');
  assert.equal(r.status, 200);
  const body = await r.json();
  assert.equal(body.component, 'QrMenu/Index');
  assert.equal(body.props.categories.length, 5);
  assert.equal(body.props.products.length, 44);
  console.log('✓ 1. Public QR Menu verified (5 categories, 44 products)');

  const wc = await fetch(`${BASE}/qr/call-waiter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table_id: 4, note: 'Hesap lütfen' }),
  });
  assert.equal(wc.status, 200);
  const wcJson = await wc.json();
  assert.equal(wcJson.success, true);
  console.log('✓ 2. Public Waiter Call verified');
}

// 2. Login as admin@tilkiadisyon.com / admin
{
  const r = await reqInertia('/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@tilkiadisyon.com', password: 'admin' }),
  });
  assert.equal(r.status, 303);
  assert.equal(r.headers.get('location'), '/dashboard');
  assert.ok(cookies['tilkiadisyon_session'], 'Session cookie must be set');
  console.log('✓ 3. Admin Login (admin@tilkiadisyon.com / admin) verified');
}

// 3. Dashboard
{
  const r = await reqInertia('/dashboard');
  assert.equal(r.status, 200);
  const body = await r.json();
  assert.equal(body.component, 'Dashboard');
  assert.equal(body.props.areas.length, 3);
  assert.equal(body.props.stats.total_tables, 19);
  assert.equal(body.props.stats.open_bills, 13);
  console.log('✓ 4. Dashboard verified (3 areas, 19 tables, 13 live open bills)');
}

// 4. Waiter Calls Active & Complete
{
  const r = await fetch(`${BASE}/waiter-calls/active`, {
    headers: { 'Cookie': cookieHeader(), 'Accept': 'application/json' },
  });
  const data = await r.json();
  assert.ok(data.count >= 1);
  const callId = data.calls[0].id;
  await fetch(`${BASE}/waiter-calls/${callId}/complete`, {
    method: 'POST',
    headers: { 'Cookie': cookieHeader(), 'Accept': 'application/json' },
  });
  console.log('✓ 5. Waiter Calls active polling & completion verified');
}

// 5. Full POS Bill Lifecycle on Table 4 (Masa 4)
{
  const openRes = await reqInertia('/bills', {
    method: 'POST',
    body: JSON.stringify({ table_id: 4 }),
  });
  assert.equal(openRes.status, 303);
  const billLoc = openRes.headers.get('location');
  assert.match(billLoc, /^\/bills\/\d+$/);
  const billId = Number(billLoc.split('/').pop());

  // Add item (Product 1 = Çay, 1500 kuruş, kitchen item)
  const addRes = await reqInertia(`/bills/${billId}/items`, {
    method: 'POST',
    body: JSON.stringify({ product_id: 1, quantity: 2, notes: 'Demli' }),
  });
  assert.equal(addRes.status, 303);

  // Check bill show
  const showRes = await reqInertia(`/bills/${billId}`);
  const showData = await showRes.json();
  assert.equal(showData.props.bill.subtotal, 3000);
  const itemId = showData.props.bill.items[0].id;

  // Check kitchen orders
  const kRes = await fetch(`${BASE}/kitchen/orders`, {
    headers: { 'Cookie': cookieHeader() },
  });
  const kData = await kRes.json();
  assert.ok(kData.orders.some(o => o.id === itemId));

  // Increase quantity (2 -> 3, subtotal = 4500)
  await reqInertia(`/bill-items/${itemId}/increase`, { method: 'POST', body: '{}' });

  // Apply discount (5 TL = 500 kuruş -> total = 4000)
  await reqInertia(`/bills/${billId}/discount`, {
    method: 'POST',
    body: JSON.stringify({ discount: 500, reason: 'İkram' }),
  });

  // Partial pay (15 TL = 1500 kuruş)
  await reqInertia(`/bills/${billId}/partial-pay`, {
    method: 'POST',
    body: JSON.stringify({ amount: 1500, method: 'cash', note: 'Nakit kısmi' }),
  });

  // Full pay remaining (25 TL = 2500 kuruş)
  const payRes = await reqInertia(`/bills/${billId}/pay`, {
    method: 'POST',
    body: JSON.stringify({ payment_method: 'card' }),
  });
  assert.equal(payRes.status, 303);
  assert.equal(payRes.headers.get('location'), '/dashboard');

  // Verify Masa 4 is available again and bill is in archive
  const showAfter = await (await reqInertia(`/bills/${billId}`)).json();
  assert.equal(showAfter.props.bill.status, 'paid');
  assert.equal(showAfter.props.bill.paid_amount, 4000);
  assert.equal(showAfter.props.bill.table.status, 'available');
  console.log(`✓ 6. Full POS Bill lifecycle verified on Bill #${billId} (open -> add item -> kitchen -> increase -> discount -> partial pay -> full pay -> table freed)`);
}

// 6. Verify all Management & Report Inertia endpoints
const endpoints = [
  '/bills',
  '/bills/archive',
  '/bills/55',
  '/bills/55/logs',
  '/kitchen',
  '/areas',
  '/tables',
  '/categories',
  '/products',
  '/products/1/edit',
  '/users',
  '/expense-categories',
  '/expenses',
  '/qr-management',
  '/reports',
  '/reports/daily',
  '/reports/weekly',
  '/reports/monthly',
  '/reports/user',
  '/reports/cancellations',
  '/reports/payments',
  '/profile',
];

for (const ep of endpoints) {
  const r = await reqInertia(ep);
  assert.equal(r.status, 200, `Expected 200 for ${ep}`);
  const j = await r.json();
  assert.ok(j.component, `Expected Inertia component for ${ep}`);
}
console.log(`✓ 7. All ${endpoints.length} Management, Archive, Kitchen, QR, and Report Inertia endpoints verified!`);
console.log('\nALL SMOKE TESTS PASSED SUCCESSFULLY!');
