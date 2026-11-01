import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, hashPassword } from './db.mjs';

export function seedIfEmpty(force = false) {
  const userCount = db.prepare('SELECT COUNT(*) AS cnt FROM users').get().cnt;
  if (userCount > 0 && !force) {
    return;
  }

  console.log('🦊 TilkiAdisyon veritabanı temiz örnek verilerle hazırlanıyor...');

  db.exec(`
    DELETE FROM roles;
    DELETE FROM users;
    DELETE FROM sessions;
    DELETE FROM areas;
    DELETE FROM tables;
    DELETE FROM categories;
    DELETE FROM products;
    DELETE FROM bills;
    DELETE FROM bill_items;
    DELETE FROM bill_payments;
    DELETE FROM bill_logs;
    DELETE FROM waiter_calls;
    DELETE FROM expense_categories;
    DELETE FROM expenses;
    DELETE FROM v3_registrations;
  `);

  const now = new Date().toISOString();
  const oneHourAgo = new Date(Date.now() - 3600 * 1000).toISOString();
  const twoHoursAgo = new Date(Date.now() - 7200 * 1000).toISOString();
  const threeHoursAgo = new Date(Date.now() - 10800 * 1000).toISOString();
  const twentyMinsAgo = new Date(Date.now() - 1200 * 1000).toISOString();
  const todayDate = now.slice(0, 10);

  // 1. Roller
  const roles = [
    { id: 1, name: 'owner', display_name: 'İşletme Sahibi', permissions: ['*'] },
    { id: 2, name: 'cashier', display_name: 'Kasiyer', permissions: ['take_payment', 'unlock_bills', 'delete_items', 'view_reports', 'apply_discount'] },
    { id: 3, name: 'waiter', display_name: 'Garson', permissions: ['change_table', 'merge_bills'] },
  ];
  const insRole = db.prepare('INSERT INTO roles (id, name, display_name, permissions, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
  for (const r of roles) {
    insRole.run(r.id, r.name, r.display_name, JSON.stringify(r.permissions), now, now);
  }

  // 2. Kullanıcılar (Tüm şifreler: admin)
  const users = [
    { id: 1, role_id: 1, name: 'Tilki Admin', email: 'admin@tilkiadisyon.com', phone: '0555 100 10 10', pw: 'admin' },
    { id: 2, role_id: 3, name: 'Ahmet Yılmaz (Garson)', email: 'garson@tilkiadisyon.com', phone: '0555 200 20 20', pw: 'admin' },
    { id: 3, role_id: 2, name: 'Zeynep Kaya (Kasiyer)', email: 'kasiyer@tilkiadisyon.com', phone: '0555 300 30 30', pw: 'admin' },
  ];
  const insUser = db.prepare(`
    INSERT INTO users (id, role_id, name, email, phone, password_hash, is_active, permissions, email_verified_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, NULL, ?, ?, ?)
  `);
  for (const u of users) {
    insUser.run(u.id, u.role_id, u.name, u.email, u.phone, hashPassword(u.pw), now, now, now);
  }

  // 3. Bölgeler
  const areas = [
    { id: 1, name: 'İç Mekan', sort_order: 1 },
    { id: 2, name: 'Bahçe', sort_order: 2 },
    { id: 3, name: 'Teras', sort_order: 3 },
    { id: 4, name: 'VIP Salon', sort_order: 4 },
  ];
  const insArea = db.prepare('INSERT INTO areas (id, name, sort_order, is_active, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)');
  for (const a of areas) {
    insArea.run(a.id, a.name, a.sort_order, now, now);
  }

  // 4. Masalar (16 Temiz Masa; Masa 2 ve VIP 1 açık örnek adisyonlu)
  const tables = [
    { id: 1, area_id: 1, name: 'Masa 1', capacity: 4, status: 'available', sort_order: 1 },
    { id: 2, area_id: 1, name: 'Masa 2', capacity: 4, status: 'occupied', sort_order: 2 },
    { id: 3, area_id: 1, name: 'Masa 3', capacity: 2, status: 'available', sort_order: 3 },
    { id: 4, area_id: 1, name: 'Masa 4', capacity: 6, status: 'available', sort_order: 4 },
    { id: 5, area_id: 1, name: 'Masa 5', capacity: 4, status: 'available', sort_order: 5 },
    { id: 6, area_id: 1, name: 'Masa 6', capacity: 4, status: 'available', sort_order: 6 },
    { id: 7, area_id: 2, name: 'Bahçe 1', capacity: 4, status: 'available', sort_order: 1 },
    { id: 8, area_id: 2, name: 'Bahçe 2', capacity: 6, status: 'available', sort_order: 2 },
    { id: 9, area_id: 2, name: 'Bahçe 3', capacity: 4, status: 'available', sort_order: 3 },
    { id: 10, area_id: 2, name: 'Bahçe 4', capacity: 4, status: 'available', sort_order: 4 },
    { id: 11, area_id: 3, name: 'Teras 1', capacity: 4, status: 'available', sort_order: 1 },
    { id: 12, area_id: 3, name: 'Teras 2', capacity: 4, status: 'available', sort_order: 2 },
    { id: 13, area_id: 3, name: 'Teras 3', capacity: 6, status: 'available', sort_order: 3 },
    { id: 14, area_id: 4, name: 'VIP 1', capacity: 8, status: 'occupied', sort_order: 1 },
    { id: 15, area_id: 4, name: 'VIP 2', capacity: 8, status: 'available', sort_order: 2 },
    { id: 16, area_id: 4, name: 'VIP 3', capacity: 10, status: 'available', sort_order: 3 },
  ];
  const insTable = db.prepare('INSERT INTO tables (id, area_id, name, capacity, status, sort_order, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)');
  for (const t of tables) {
    insTable.run(t.id, t.area_id, t.name, t.capacity, t.status, t.sort_order, now, now);
  }

  // 5. Kategoriler
  const categories = [
    { id: 1, name: 'Sıcak İçecekler', icon: '☕', color: '#f97316', sort_order: 1 },
    { id: 2, name: 'Soğuk İçecekler', icon: '🥤', color: '#06b6d4', sort_order: 2 },
    { id: 3, name: 'Burger & Ana Yemek', icon: '🍔', color: '#ef4444', sort_order: 3 },
    { id: 4, name: 'Pizza & Makarna', icon: '🍕', color: '#eab308', sort_order: 4 },
    { id: 5, name: 'Tatlılar', icon: '🍰', color: '#ec4899', sort_order: 5 },
    { id: 6, name: 'Kahvaltı & Atıştırmalık', icon: '🥐', color: '#10b981', sort_order: 6 },
  ];
  const insCat = db.prepare('INSERT INTO categories (id, name, icon, color, sort_order, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?)');
  for (const c of categories) {
    insCat.run(c.id, c.name, c.icon, c.color, c.sort_order, now, now);
  }

  // 6. Ürünler
  const products = [
    { id: 1, category_id: 1, name: 'Demleme Çay', price: 25, kitchen: 0, desc: 'Taze Rize yaprak çayı' },
    { id: 2, category_id: 1, name: 'Türk Kahvesi', price: 65, kitchen: 0, desc: 'Çifte kavrulmuş lokumlu Türk kahvesi' },
    { id: 3, category_id: 1, name: 'Caffe Latte', price: 95, kitchen: 0, desc: 'Yumuşak içimli espresso ve kadifemsi süt' },
    { id: 4, category_id: 1, name: 'Filtre Kahve', price: 85, kitchen: 0, desc: ' %100 Arabica taze demleme' },
    { id: 5, category_id: 2, name: 'Ev Yapımı Limonata', price: 80, kitchen: 0, desc: 'Taze nane yapraklı soğuk limonata' },
    { id: 6, category_id: 2, name: 'Taze Portakal Suyu', price: 90, kitchen: 0, desc: 'Sıkma taze portakal suyu' },
    { id: 7, category_id: 2, name: 'Ice Americano', price: 90, kitchen: 0, desc: 'Buzlu çift shot espresso' },
    { id: 8, category_id: 2, name: 'Kola / Soğuk Meşrubat', price: 55, kitchen: 0, desc: '330ml kutu içecek' },
    { id: 9, category_id: 3, name: 'Tilki Özel Burger', price: 290, kitchen: 1, desc: '180gr dana köfte, karamelize soğan, cheddar ve patates' },
    { id: 10, category_id: 3, name: 'Izgara Kasap Köfte', price: 320, kitchen: 1, desc: 'Közlenmiş biber, pilav ve baharatlı patates ile' },
    { id: 11, category_id: 3, name: 'Çıtır Tavuk Schnitzel', price: 260, kitchen: 1, desc: 'Özel soslu altın sarısı tavuk bonfile' },
    { id: 12, category_id: 4, name: 'Karışık İtalyan Pizza', price: 280, kitchen: 1, desc: 'Mozzarella, sucuk, mantar, zeytin ve mısır' },
    { id: 13, category_id: 4, name: 'Fettuccine Alfredo', price: 240, kitchen: 1, desc: 'Kremalı mantarlı ve tavuklu taze makarna' },
    { id: 14, category_id: 5, name: 'San Sebastian Cheesecake', price: 170, kitchen: 1, desc: 'Sıcak Belçika çikolata sosu eşliğinde' },
    { id: 15, category_id: 5, name: 'Çikolatalı Sufle', price: 160, kitchen: 1, desc: 'Vanilyalı dondurma ile sıcak servis' },
    { id: 16, category_id: 6, name: 'Serpme Tilki Kahvaltısı (2 Kişilik)', price: 550, kitchen: 1, desc: 'Sınırsız çay eşliğinde zengin serpme kahvaltı' },
    { id: 17, category_id: 6, name: 'Baharatlı Kajun Sepeti', price: 140, kitchen: 1, desc: 'Çıtır tavuk parçaları ve elma dilim patates' },
  ];
  const insProd = db.prepare(`
    INSERT INTO products (id, category_id, name, image, description, price, unit, sort_order, is_active, track_stock, stock, low_stock_threshold, is_kitchen_item, created_at, updated_at)
    VALUES (?, ?, ?, NULL, ?, ?, 'adet', ?, 1, 0, 100, 10, ?, ?, ?)
  `);
  products.forEach((p, idx) => {
    insProd.run(p.id, p.category_id, p.name, p.desc, p.price, idx + 1, p.kitchen, now, now);
  });

  // 7. Örnek Adisyonlar (4 Tamamlanmış Örnek Tahsilat + 2 Aktif Açık Masa)
  const insBill = db.prepare(`
    INSERT INTO bills (id, table_id, opened_by, closed_by, status, is_locked, subtotal, discount, total, paid_amount, payment_method, opened_at, closed_at, created_at, updated_at, last_order_at)
    VALUES (?, ?, ?, ?, ?, 0, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insItem = db.prepare(`
    INSERT INTO bill_items (bill_id, product_id, added_by, product_name, unit_price, quantity, total_price, status, kitchen_status, sent_to_kitchen_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insPay = db.prepare(`
    INSERT INTO bill_payments (bill_id, received_by, amount, method, note, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // Örnek 1: Masa 1 (Tamamlanmış - Kart ile Ödendi - ₺750)
  insBill.run(1, 1, 1, 1, 'paid', 750, 750, 750, 'card', threeHoursAgo, twoHoursAgo, threeHoursAgo, twoHoursAgo, twoHoursAgo);
  insItem.run(1, 9, 1, 'Tilki Özel Burger', 290, 2, 580, 'completed', 'completed', threeHoursAgo, threeHoursAgo, twoHoursAgo);
  insItem.run(1, 14, 1, 'San Sebastian Cheesecake', 170, 1, 170, 'completed', 'completed', threeHoursAgo, threeHoursAgo, twoHoursAgo);
  insPay.run(1, 1, 750, 'card', 'Kredi Kartı Tahsilat', twoHoursAgo, twoHoursAgo);

  // Örnek 2: Bahçe 1 (Tamamlanmış - Nakit ile Ödendi - ₺550)
  insBill.run(2, 7, 2, 3, 'paid', 550, 550, 550, 'cash', twoHoursAgo, oneHourAgo, twoHoursAgo, oneHourAgo, oneHourAgo);
  insItem.run(2, 16, 2, 'Serpme Tilki Kahvaltısı (2 Kişilik)', 550, 1, 550, 'completed', 'completed', twoHoursAgo, twoHoursAgo, oneHourAgo);
  insPay.run(2, 3, 550, 'cash', 'Nakit Tahsilat', oneHourAgo, oneHourAgo);

  // Örnek 3: Teras 1 (Tamamlanmış - Kart ile Ödendi - ₺470)
  insBill.run(3, 11, 2, 1, 'paid', 470, 470, 470, 'card', twoHoursAgo, oneHourAgo, twoHoursAgo, oneHourAgo, oneHourAgo);
  insItem.run(3, 12, 2, 'Karışık İtalyan Pizza', 280, 1, 280, 'completed', 'completed', twoHoursAgo, twoHoursAgo, oneHourAgo);
  insItem.run(3, 3, 2, 'Caffe Latte', 95, 2, 190, 'completed', 'completed', twoHoursAgo, twoHoursAgo, oneHourAgo);
  insPay.run(3, 1, 470, 'card', 'Kredi Kartı Tahsilat', oneHourAgo, oneHourAgo);

  // Örnek 4: Masa 2 (Şu an AÇIK Adisyon - ₺450)
  insBill.run(4, 2, 1, null, 'open', 450, 450, 0, null, twentyMinsAgo, null, twentyMinsAgo, now, now);
  insItem.run(4, 9, 1, 'Tilki Özel Burger', 290, 1, 290, 'pending', 'preparing', twentyMinsAgo, twentyMinsAgo, now);
  insItem.run(4, 5, 1, 'Ev Yapımı Limonata', 80, 2, 160, 'pending', 'ready', twentyMinsAgo, twentyMinsAgo, now);

  // Örnek 5: VIP 1 (Şu an AÇIK Adisyon - ₺800)
  insBill.run(5, 14, 2, null, 'open', 800, 800, 0, null, twentyMinsAgo, null, twentyMinsAgo, now, now);
  insItem.run(5, 10, 2, 'Izgara Kasap Köfte', 320, 2, 640, 'pending', 'pending', twentyMinsAgo, twentyMinsAgo, now);
  insItem.run(5, 15, 2, 'Çikolatalı Sufle', 160, 1, 160, 'pending', 'pending', twentyMinsAgo, twentyMinsAgo, now);

  // 8. Gider Kategorileri ve 1 Örnek Gider
  const insExpCat = db.prepare('INSERT INTO expense_categories (id, name, color, icon, is_active, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?, ?)');
  insExpCat.run(1, 'Mutfak & Tedarik', '#f97316', '🥦', 1, now, now);
  insExpCat.run(2, 'Fatura & Kira', '#6366f1', '💡', 2, now, now);

  const insExp = db.prepare('INSERT INTO expenses (id, category_id, created_by, amount, description, expense_date, receipt_image, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)');
  insExp.run(1, 1, 1, 350, 'Günlük taze süt ve kahve çekirdeği tedariği', todayDate, now, now);

  console.log('✅ TilkiAdisyon temiz örnek verileri başarıyla yüklendi (3 kullanıcı, 4 bölge, 16 masa, 17 ürün, 5 örnek adisyon).');
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  seedIfEmpty(true);
}
