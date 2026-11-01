# 🦊 TilkiAdisyon — Kurulum ve Kendi Domainini Bağlama Rehberi (`KURULUM.md`)

Bu rehber, **TilkiAdisyon** sistemini kendi bilgisayarınızda veya sunucunuzda (VPS/VDS) saniyeler içinde nasıl ayağa kaldıracağınızı ve **`KURULUM-VE-DOMAIN.bat` otomatik sihirbazı** ile kendi özel alan adınız (domain) üzerinden dünyaya nasıl açacağınızı adım adım anlatır.

---

## 📋 İçindekiler

1. [Sistem Gereksinimleri](#-1-sistem-gereksinimleri)
2. [Tek Tıkla Çalıştırma (`CALISTIR.bat`) ve Otomatik Config Sihirbazı (`KURULUM-VE-DOMAIN.bat`)](#-2-tek-tıkla-çalıştırma-calistirbat-ve-otomatik-config-sihirbazı-kurulum-ve-domainbat)
3. [Varsayılan Giriş Bilgileri](#-3-varsayılan-giriş-bilgileri)
4. [Yöntem 1: Cloudflare Tunnel ile Port Açmadan Kendi Domainini Bağlama (Önerilen & Ücretsiz)](#-4-yöntem-1-cloudflare-tunnel-ile-port-açmadan-kendi-domainini-bağlama-önerilen--ücretsiz)
5. [Yöntem 2: VPS / Linux Sunucuda Nginx + Ücretsiz SSL (Certbot) + PM2 ile Yayınlama](#-5-yöntem-2-vps--linux-sunucuda-nginx--ücretsiz-ssl-certbot--pm2-ile-yayınlama)
6. [Yöntem 3: Yerel Wi-Fi (LAN) Üzerinden Garson Telefonu ve Mutfak Tabletlerini Bağlama](#-6-yöntem-3-yerel-wi-fi-lan-üzerinden-garson-telefonu-ve-mutfak-tabletlerini-bağlama)
7. [Veritabanı Yedekleme ve Sıfırlama](#-7-veritabanı-yedekleme-ve-sıfırlama)

---

## 💻 1. Sistem Gereksinimleri

TilkiAdisyon, harici hiçbir ağır veritabanı sunucusuna (MySQL/PostgreSQL) veya C++ derleyicisine ihtiyaç duymaz; Node.js'in yerleşik **`node:sqlite`** motorunu kullanır.

- **Node.js:** `v22.5.0` veya daha yeni bir sürüm ([nodejs.org](https://nodejs.org) adresinden LTS sürümünü indirin)
- **İşletim Sistemi:** Windows 10/11, Ubuntu/Debian Linux veya macOS
- **RAM:** Minimum 256 MB boş bellek

---

## ⚡ 2. Tek Tıkla Çalıştırma (`CALISTIR.bat`) ve Otomatik Config Sihirbazı (`KURULUM-VE-DOMAIN.bat`)

### A) `KURULUM-VE-DOMAIN.bat` (Otomatik Config & Domain Sihirbazı)
Proje klasöründeki **`KURULUM-VE-DOMAIN.bat`** dosyasına çift tıkladığınızda karşınıza 5 seçenekli interaktif kurulum menüsü gelir:

```text
 [1] ⚙️  Otomatik Config Oluştur (Port, İşletme Adı & Özel Domain Ayarla)
 [2] 🌐 Cloudflare ile Kendi Domainini Otomatik Bağla (Port Açmadan & Ücretsiz SSL)
 [3] ⚡ Domain Olmadan Anında Ücretsiz HTTPS Link Al (TryCloudflare)
 [4] 📱 Yerel Wi-Fi (Garson Telefonu / Mutfak Tableti) Güvenlik Duvarı İznini Aç
 [5] 🗄️  Veritabanını Sıfırla / İlk Kurulum Demo Verilerini Yükle
```

**`[1]` seçeneğini çalıştırdığınızda sihirbaz sizin yerinize otomatik olarak şu dosyaları üretir:**
1. **`config.json`**: İşletme adınızı, port numaranızı (`3001`) ve özel domain bilginizi kaydeder. `server.mjs` bu dosyayı otomatik okur.
2. **`domain-configs/nginx-adisyon.conf`**: VPS/Linux sunucu kullananlar için girdiğiniz domaine özel hazır Nginx Reverse Proxy yapılandırması.
3. **`domain-configs/cloudflare-tunnel.yml`**: Cloudflare Tunnel yönlendirme yapılandırması.
4. **`DOMAIN-YAYINLA.bat`**: Domain tünelinizi tek tıkla başlatan yardımcı `.bat` dosyası.

---

### B) `CALISTIR.bat` (Tek Tıkla Sunucu Başlatıcı)
Ayarlarınız hazır olduğunda **`CALISTIR.bat`** dosyasına çift tıklamanız yeterlidir:
- `config.json` içerisindeki port numarasını okur.
- Ekranda yerel kasa adresini (`http://localhost:3001/anasayfa`) ve yerel Wi-Fi IP adresinizi (`http://192.168.1.x:3001`) gösterir.
- Eğer otomatik tünel seçeneğini aktif ettiyseniz arka planda `DOMAIN-YAYINLA.bat` tünelini de başlatır.
- Tarayıcınızı otomatik olarak açar.

---

## 🔑 3. Varsayılan Giriş Bilgileri

İlk kurulumda sistem otomatik olarak aşağıdaki yetkili hesapları oluşturur:

| Rol | E-Posta | Şifre | Yetki Kapsamı |
| :--- | :--- | :--- | :--- |
| **İşletme Sahibi (Admin)** | `admin@tilkiadisyon.com` | `admin` | Tüm modüller, raporlar, ayarlar ve personel yönetimi |
| **Garson** | `garson@tilkiadisyon.com` | `admin` | Masalar, sipariş alma, adisyon ve mutfak takibi |
| **Kasiyer** | `kasiyer@tilkiadisyon.com` | `admin` | Tahsilat, adisyon kapatma, Z raporu ve kasa işlemleri |

---

## 🌐 4. Yöntem 1: Cloudflare Tunnel ile Port Açmadan Kendi Domainini Bağlama (Önerilen & Ücretsiz)

Modeminizde port yönlendirme (Port Forwarding) yapmadan, statik IP satın almadan ve **otomatik HTTPS (SSL) sertifikası** ile kendi bilgisayarınızda çalışan TilkiAdisyon'u `adisyon.sizindomaininiz.com` adresinden yayınlamanın en güvenli yoludur.

### Otomatik Sihirbaz ile Kurulum (Windows)
1. **`KURULUM-VE-DOMAIN.bat`** dosyasına çift tıklayın.
2. Menüden **`[2] Cloudflare ile Kendi Domainini Otomatik Bağla`** seçeneğini seçin ve domaininizi yazın (ör. `adisyon.domaininiz.com`).
3. Sihirbaz `cloudflared` aracını otomatik kontrol eder (yoksa `winget` ile kurar), Cloudflare giriş ekranını açar, tünelinizi oluşturur ve DNS yönlendirmesini otomatik tamamlar!

### Manuel Terminal Komutları (Linux / macOS / Windows)
```bash
# 1. Cloudflare hesabınıza giriş yapın
cloudflared tunnel login

# 2. "tilki-adisyon" adında kalıcı bir tünel oluşturun
cloudflared tunnel create tilki-adisyon

# 3. Alt alan adınızı (ör. adisyon.domaininiz.com) tünele yönlendirin
cloudflared tunnel route dns tilki-adisyon adisyon.domaininiz.com

# 4. Tüneli yerel 3001 portunuza bağlayarak başlatın!
cloudflared tunnel run --url http://localhost:3001 tilki-adisyon
```

---

## 🖥️ 5. Yöntem 2: VPS / Linux Sunucuda Nginx + Ücretsiz SSL (Certbot) + PM2 ile Yayınlama

Bir bulut sunucunuz (Ubuntu 22.04 / 24.04) varsa ve domaininizin **DNS A Kaydını** sunucu IP adresinize yönlendirdiyseniz:

### Adım 1: PM2 ile 7/24 Arka Planda Çalıştırma
```bash
sudo npm install -g pm2
cd /var/www/tilki-adisyon
pm2 start server.mjs --name "tilki-adisyon"
pm2 save && pm2 startup
```

### Adım 2: Otomatik Üretilen Nginx Config Dosyasını Aktif Etme
`KURULUM-VE-DOMAIN.bat` (veya `node server/setup-wizard.mjs`) çalıştırıldığında `domain-configs/nginx-adisyon.conf` dosyası domaininize göre hazır oluşturulur:

```bash
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx

# Hazır üretilen Nginx config dosyasını kopyalayın
sudo cp domain-configs/nginx-adisyon.conf /etc/nginx/sites-available/tilki-adisyon
sudo ln -s /etc/nginx/sites-available/tilki-adisyon /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Ücretsiz Let's Encrypt SSL sertifikasını tek komutla kurun
sudo certbot --nginx -d adisyon.domaininiz.com
```

---

## 📱 6. Yöntem 3: Yerel Wi-Fi (LAN) Üzerinden Garson Telefonu ve Mutfak Tabletlerini Bağlama

Kafe veya restoran içinde internet kesilse bile aynı Wi-Fi ağındaki telefon ve tabletlerden sistemi kullanabilirsiniz:

1. **`KURULUM-VE-DOMAIN.bat`** dosyasını açıp **`[4]`** numaralı seçeneği çalıştırarak Windows Güvenlik Duvarı iznini otomatik açın.
2. **`CALISTIR.bat`** ekranında yazan **`Wi-Fi Garson / Tablet IP`** adresini (ör. `http://192.168.1.45:3001`) telefon veya tablet tarayıcısına yazarak anında bağlanın!

---

## 🗄️ 7. Veritabanı Yedekleme ve Sıfırlama

- **Veritabanı Dosyası:** Tüm masalar, adisyonlar, ürünler, garsonlar ve raporlar tek bir güvenli SQLite dosyasında tutulur:
  ```text
  data/tilkiadisyon.db
  ```
- **Fabrika Ayarlarına Sıfırlama:** `KURULUM-VE-DOMAIN.bat` içinden **`[5]`** seçeneğini seçebilir veya terminalde şu komutu çalıştırabilirsiniz:
  ```bash
  node server/seed.mjs --reset
  ```

---

<div align="center">
  <b>🦊 TilkiAdisyon — Yeni Nesil Restoran & Kafe POS Otomasyonu</b><br/>
  Developed by <a href="https://doga.dev"><b>doga.dev</b></a> & <a href="https://ensxr.dev"><b>ensxr.dev</b></a>
</div>
