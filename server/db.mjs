import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

export const dbPath = path.join(dataDir, 'tilkiadisyon.db');
export const db = new DatabaseSync(dbPath);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = OFF;

  CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    permissions TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_id INTEGER NOT NULL DEFAULT 1,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    password_hash TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    permissions TEXT,
    email_verified_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS areas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    area_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 4,
    status TEXT NOT NULL DEFAULT 'available',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '🍽️',
    color TEXT DEFAULT '#f97316',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    image TEXT,
    description TEXT,
    price INTEGER NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'adet',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    track_stock INTEGER NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER NOT NULL DEFAULT 10,
    is_kitchen_item INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_id INTEGER NOT NULL,
    opened_by INTEGER NOT NULL DEFAULT 1,
    closed_by INTEGER,
    status TEXT NOT NULL DEFAULT 'open',
    is_locked INTEGER NOT NULL DEFAULT 0,
    locked_by INTEGER,
    subtotal INTEGER NOT NULL DEFAULT 0,
    discount INTEGER NOT NULL DEFAULT 0,
    discounted_by INTEGER,
    discount_reason TEXT,
    discounted_at TEXT,
    total INTEGER NOT NULL DEFAULT 0,
    paid_amount INTEGER NOT NULL DEFAULT 0,
    payment_method TEXT,
    cancel_reason TEXT,
    notes TEXT,
    opened_at TEXT NOT NULL,
    closed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    last_order_at TEXT
  );

  CREATE TABLE IF NOT EXISTS bill_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    added_by INTEGER NOT NULL DEFAULT 1,
    deleted_by INTEGER,
    product_name TEXT NOT NULL,
    unit_price INTEGER NOT NULL DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_price INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    kitchen_status TEXT DEFAULT 'pending',
    kitchen_ready_at TEXT,
    kitchen_notified_at TEXT,
    sent_to_kitchen_at TEXT,
    kitchen_completed_at TEXT,
    delete_reason TEXT,
    deleted_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS bill_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_id INTEGER NOT NULL,
    received_by INTEGER NOT NULL DEFAULT 1,
    amount INTEGER NOT NULL DEFAULT 0,
    method TEXT NOT NULL DEFAULT 'cash',
    note TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS bill_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL DEFAULT 1,
    action TEXT NOT NULL,
    description TEXT NOT NULL,
    data TEXT,
    ip_address TEXT DEFAULT '127.0.0.1',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS waiter_calls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    note TEXT,
    seen_at TEXT,
    completed_at TEXT,
    seen_by INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS expense_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#6366f1',
    icon TEXT NOT NULL DEFAULT '💡',
    is_active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    created_by INTEGER NOT NULL DEFAULT 1,
    amount INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    expense_date TEXT NOT NULL,
    receipt_image TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS v3_registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firma TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

export function hashPassword(plain) {
  return crypto.createHash('sha256').update(`tilkiadisyon:${plain}`).digest('hex');
}

export function verifyPassword(plain, hash) {
  return hashPassword(plain) === hash;
}

export const ALL_PERMISSIONS = {
  delete_items: 'Ürün Silme',
  take_payment: 'Ödeme Alma',
  view_reports: 'Raporları Görme',
  unlock_bills: 'Adisyon Kilidi Açma',
  manage_users: 'Kullanıcı Yönetimi',
  manage_products: 'Ürün/Kategori Yönetimi',
  manage_tables: 'Masa Yönetimi',
  manage_expenses: 'Gider Yönetimi',
  apply_discount: 'İndirim Uygulama',
  cancel_bills: 'Adisyon İptal',
  change_table: 'Masa Değiştirme',
  merge_bills: 'Adisyon Birleştirme',
};

export function formatRole(row) {
  if (!row) return null;
  let perms = [];
  try {
    perms = typeof row.permissions === 'string' ? JSON.parse(row.permissions) : (row.permissions || []);
  } catch {
    perms = [];
  }
  return {
    id: row.id,
    name: row.name,
    display_name: row.display_name,
    permissions: perms,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function formatUser(row, includeRole = true) {
  if (!row) return null;
  let perms = null;
  if (row.permissions) {
    try {
      perms = typeof row.permissions === 'string' ? JSON.parse(row.permissions) : row.permissions;
    } catch {
      perms = null;
    }
  }
  const u = {
    id: row.id,
    role_id: row.role_id,
    name: row.name,
    email: row.email,
    phone: row.phone || null,
    is_active: Boolean(row.is_active),
    permissions: perms,
    email_verified_at: row.email_verified_at || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
  if (includeRole) {
    const roleRow = db.prepare('SELECT * FROM roles WHERE id = ?').get(row.role_id);
    u.role = formatRole(roleRow);
  }
  return u;
}

export function formatAuthUser(row) {
  if (!row) return null;
  const user = formatUser(row, true);
  const isOwner = user.role?.name === 'owner' || user.role?.permissions?.includes('*');
  const userPerms = Array.isArray(user.permissions) ? user.permissions : [];
  const rolePerms = Array.isArray(user.role?.permissions) ? user.role.permissions : [];
  const hasPerm = (key, legacyKey) => {
    if (isOwner) return true;
    if (userPerms.includes(key) || (legacyKey && userPerms.includes(legacyKey))) return true;
    if (rolePerms.includes(key) || (legacyKey && rolePerms.includes(legacyKey))) return true;
    return false;
  };
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: {
      name: user.role?.name || 'owner',
      display_name: user.role?.display_name || 'İşletme Sahibi',
    },
    permissions: userPerms,
    can: {
      view_reports: hasPerm('view_reports', 'reports.view'),
      take_payment: hasPerm('take_payment', 'bills.pay'),
      delete_items: hasPerm('delete_items', 'items.delete'),
      apply_discount: hasPerm('apply_discount', 'bills.discount'),
      cancel_bills: hasPerm('cancel_bills', 'bills.delete'),
      change_table: hasPerm('change_table', 'tables.manage'),
      merge_bills: hasPerm('merge_bills', 'bills.update'),
      manage_users: hasPerm('manage_users', 'users.manage'),
      manage_products: hasPerm('manage_products', 'products.manage'),
      manage_tables: hasPerm('manage_tables', 'tables.manage'),
      manage_expenses: hasPerm('manage_expenses', 'expenses.manage'),
      unlock_bills: hasPerm('unlock_bills', 'bills.unlock'),
    },
  };
}

export function formatArea(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    sort_order: row.sort_order,
    is_active: Boolean(row.is_active),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function formatTable(row, includeArea = true) {
  if (!row) return null;
  const t = {
    id: row.id,
    area_id: row.area_id,
    name: row.name,
    capacity: row.capacity,
    status: row.status,
    sort_order: row.sort_order,
    is_active: Boolean(row.is_active),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
  if (includeArea) {
    const areaRow = db.prepare('SELECT * FROM areas WHERE id = ?').get(row.area_id);
    t.area = formatArea(areaRow);
  }
  return t;
}

export function formatCategory(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    icon: row.icon || '🍽️',
    color: row.color || '#f97316',
    sort_order: row.sort_order,
    is_active: Boolean(row.is_active),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function formatProduct(row, baseUrl = '', includeCategory = false) {
  if (!row) return null;
  const trackStock = Boolean(row.track_stock);
  let stockStatus = 'not_tracked';
  if (trackStock) {
    if (row.stock <= 0) stockStatus = 'out_of_stock';
    else if (row.stock <= row.low_stock_threshold) stockStatus = 'low_stock';
    else stockStatus = 'in_stock';
  }
  const inStock = !trackStock || Number(row.stock) > 0;
  const p = {
    id: row.id,
    category_id: row.category_id,
    name: row.name,
    image: row.image || null,
    description: row.description || null,
    price: row.price,
    unit: row.unit || 'adet',
    sort_order: row.sort_order,
    is_active: Boolean(row.is_active),
    track_stock: trackStock,
    stock: row.stock,
    low_stock_threshold: row.low_stock_threshold,
    is_kitchen_item: Boolean(row.is_kitchen_item),
    created_at: row.created_at,
    updated_at: row.updated_at,
    image_url: row.image ? `${baseUrl}/storage/${row.image}` : null,
    stock_status: stockStatus,
    in_stock: inStock,
    is_new: false,
  };
  if (includeCategory) {
    const catRow = db.prepare('SELECT * FROM categories WHERE id = ?').get(row.category_id);
    p.category = formatCategory(catRow);
  }
  return p;
}

export function formatBillItem(row, baseUrl = '') {
  if (!row) return null;
  const prodRow = db.prepare('SELECT * FROM products WHERE id = ?').get(row.product_id);
  const addedByRow = db.prepare('SELECT * FROM users WHERE id = ?').get(row.added_by);
  return {
    id: row.id,
    bill_id: row.bill_id,
    product_id: row.product_id,
    added_by: formatUser(addedByRow, false),
    product_name: row.product_name,
    unit_price: row.unit_price,
    quantity: row.quantity,
    total_price: row.total_price,
    notes: row.notes || null,
    status: row.status || 'pending',
    kitchen_status: row.kitchen_status || 'pending',
    kitchen_ready_at: row.kitchen_ready_at || null,
    kitchen_notified_at: row.kitchen_notified_at || null,
    sent_to_kitchen_at: row.sent_to_kitchen_at || null,
    kitchen_completed_at: row.kitchen_completed_at || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    product: formatProduct(prodRow, baseUrl, false),
  };
}

export function formatPayment(row) {
  if (!row) return null;
  const uRow = db.prepare('SELECT * FROM users WHERE id = ?').get(row.received_by);
  return {
    id: row.id,
    bill_id: row.bill_id,
    received_by: formatUser(uRow, false),
    amount: row.amount,
    method: row.method,
    note: row.note || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function formatBill(row, baseUrl = '', options = {}) {
  if (!row) return null;
  const {
    includeTable = true,
    includeItems = false,
    includePayments = false,
    expandUsers = true,
  } = options;

  const openedByUser = expandUsers
    ? formatUser(db.prepare('SELECT * FROM users WHERE id = ?').get(row.opened_by), false)
    : row.opened_by;
  const closedByUser = row.closed_by
    ? (expandUsers ? formatUser(db.prepare('SELECT * FROM users WHERE id = ?').get(row.closed_by), false) : row.closed_by)
    : null;

  const b = {
    id: row.id,
    table_id: row.table_id,
    opened_by: openedByUser,
    closed_by: closedByUser,
    status: row.status,
    is_locked: Boolean(row.is_locked),
    locked_by: row.locked_by || null,
    subtotal: row.subtotal,
    discount: row.discount,
    discounted_by: row.discounted_by || null,
    discount_reason: row.discount_reason || null,
    discounted_at: row.discounted_at || null,
    total: row.total,
    paid_amount: row.paid_amount,
    payment_method: row.payment_method || null,
    notes: row.notes || null,
    opened_at: row.opened_at,
    closed_at: row.closed_at || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    last_order_at: row.last_order_at || row.opened_at,
    is_idle: false,
    idle_minutes: 0,
    idle_warning: null,
  };

  if (includeTable) {
    const tRow = db.prepare('SELECT * FROM tables WHERE id = ?').get(row.table_id);
    b.table = formatTable(tRow, true);
  }

  if (includeItems) {
    const itemRows = db.prepare('SELECT * FROM bill_items WHERE bill_id = ? AND deleted_at IS NULL ORDER BY id ASC').all(row.id);
    b.items = itemRows.map(ir => formatBillItem(ir, baseUrl));
  }

  if (includePayments) {
    const payRows = db.prepare('SELECT * FROM bill_payments WHERE bill_id = ? ORDER BY id ASC').all(row.id);
    b.payments = payRows.map(pr => formatPayment(pr));
  }

  return b;
}

export function recalcBillTotals(billId) {
  const bill = db.prepare('SELECT * FROM bills WHERE id = ?').get(billId);
  if (!bill) return null;
  const sumRow = db.prepare('SELECT COALESCE(SUM(total_price), 0) AS subtotal FROM bill_items WHERE bill_id = ? AND deleted_at IS NULL').get(billId);
  const subtotal = Number(sumRow?.subtotal || 0);
  const discount = Math.min(subtotal, Number(bill.discount || 0));
  const total = Math.max(0, subtotal - discount);
  const now = new Date().toISOString();
  db.prepare('UPDATE bills SET subtotal = ?, discount = ?, total = ?, updated_at = ? WHERE id = ?')
    .run(subtotal, discount, total, now, billId);
  return db.prepare('SELECT * FROM bills WHERE id = ?').get(billId);
}

export function addBillLog(billId, userId, action, description, data = null) {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO bill_logs (bill_id, user_id, action, description, data, ip_address, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, '127.0.0.1', ?, ?)
  `).run(billId, userId || 1, action, description, data ? JSON.stringify(data) : null, now, now);
}
