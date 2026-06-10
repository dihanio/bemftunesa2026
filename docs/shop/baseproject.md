# 🛒ï¸ FT MERCHANDISE STOREFRONT & E-COMMERCE

**Domain**: `shop.bemftunesa.org`
**Version**: **v2.0 (Enterprise ERP Edition)**

---

## 🎯 1. Deskripsi & Tujuan

Aplikasi khusus **Merchandise Storefront** dirancang untuk mendistribusikan produk cinderamata dan atribut resmi Fakultas Teknik UNESA (hoodie kabinet, jaket angkatan, totebag, stiker, lanyard). Toko ini dikelola oleh Divisi Ekonomi Kreatif BEM FT sebagai salah satu pilar pendapatan internal organisasi (_Revenue Engine_).

```
 [BUYER FRONTEND (shop.bemftunesa.org)] ──► [Central API / Midtrans Gateway]
                       â”‚                                    â”‚
           (Browser Guest Checkout)               (Automated Webhooks Sync)
                                                            â”‚
                                                            â–¼
                                                [IMS FINANCE CASHFLOW]
```

### Core Shop Objectives:

- **Frictionless Guest Checkout**: Memungkinkan mahasiswa atau pembeli luar melakukan pre-order atribut kampus dengan cepat tanpa perlu melakukan pendaftaran akun.
- **Automated Midtrans Webhook Synchronization**: Mencegah verifikasi transfer bank manual dengan mengintegrasikan sistem virtual account dan QRIS otomatis.
- **Finance Core Cashflow Tracking**: Seluruh pendapatan bersih dari penjualan merchandise otomatis dicatat ke dalam dashboard **Keuangan BEM FT** sebagai aliran dana kas masuk organisasi.

---

## ðŸ”„ 2. Siklus Hidup Pesanan (Order Lifecycle)

Semua transaksi diproses secara dinamis menggunakan sistem transisi status yang terintegrasi penuh ke modul persediaan barang:

```
[Waiting Payment] ──► [Verified] ──► [Production] ──► [Ready Pickup / Shipping] ──► [Completed]
```

### 2.1 Alur Transaksi Detail

1. **Waiting Payment (Menunggu Pembayaran)**:
   - Pembeli menempatkan pesanan Pre-Order. Sistem di backend memicu API payment gateway untuk menerbitkan nomor Virtual Account atau kode QRIS aktif (durasi kedaluwarsa 24 jam).
2. **Verified (Terverifikasi)**:
   - Begitu pembayaran dilunasi, payment gateway mengirimkan callback webhook ke central-api. Sistem mengubah status pesanan secara instan dan mengalokasikan pencatatan kas masuk ke database keuangan.
3. **Production (Dalam Produksi)**:
   - Tim Ekonomi Kreatif mengubah status secara masif ketika pesanan Pre-Order mulai masuk ke vendor produksi/konveksi.
4. **Ready Pickup / Shipping (Siap Diambil / Dikirim)**:
   - Barang telah selesai diproduksi dan dikelompokkan berdasarkan metode pengambilan. Pembeli menerima notifikasi otomatis WhatsApp untuk mengambil barang di Sekretariat BEM FT atau resi pengiriman kurir.
5. **Completed (Transaksi Selesai)**:
   - Barang berhasil diserahterimakan, menandai transaksi penjualan selesai.

---

## ðŸ§© 3. Fitur Utama Platform

### 3.1 Katalog & Pre-Order Matrix

- **Variant Selector**: Pemilihan variasi ukuran (S hingga XXXL) dan pilihan warna yang secara dinamis memperbarui harga (misal, ukuran besar memiliki biaya tambahan).
- **Persistent Cart (Zustand-Persisted)**: Keranjang belanja pembeli disimpan secara persisten di _localStorage_ peramban, memastikan data tidak hilang saat navigasi halaman.

### 3.2 Dasbor Pengelola Toko (IMS Merch Management)

- **Real-time Order Matrix**: Dasbor pengelolaan pesanan untuk mengubah status produksi secara massal, memantau riwayat pembeli, dan mengunduh berkas manifest produksi untuk dikirim ke vendor.
- **Income Analytics Dashboard**: Menampilkan diagram performa total penjualan, produk terlaris, proyeksi laba kotor, dan kontribusi omset merchandise ke kas utama organisasi.

---

## ðŸ§± 4. Arsitektur Teknis & Struktur Aplikasi

### 4.1 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Payment Gateway**: Midtrans API / QRIS Gateway
- **State Management**: Zustand (Kelola cart items & input checkout)
- **Data Layer**: TanStack Query -> `api.bemftunesa.org/v1/shop/*`

### 4.2 App Structure

```
apps/shop/
â”œâ”€â”€ app/
â”‚   â”œâ”€â”€ page.tsx                     # Katalog Utama & Banner Promosi
â”‚   â”œâ”€â”€ product/
â”‚   â”‚   â””â”€â”€ [slug]/page.tsx         # Detail Spesifikasi Produk & Selector Variasi
â”‚   â”œâ”€â”€ cart/page.tsx                # Halaman Keranjang Belanja Pembeli
â”‚   â”œâ”€â”€ checkout/page.tsx            # Form Pengisian Alamat & Pembayaran
â”‚   â”œâ”€â”€ order/
â”‚   â”‚   â”œâ”€â”€ [code]/page.tsx         # Invoice & Status Pembayaran Real-time
â”‚   â”‚   â””â”€â”€ track/page.tsx          # Cek Progres Produksi Pre-Order
â”‚   â””â”€â”€ layout.tsx
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ product/
â”‚   â”‚   â”œâ”€â”€ gallery.tsx              # Galeri foto produk (carousel)
â”‚   â”‚   â””â”€â”€ variant-selector.tsx     # Selector ukuran & warna
â”‚   â””â”€â”€ cart/
â””â”€â”€ lib/
    â”œâ”€â”€ cart-store.ts                # Zustand store persisten untuk Cart
    â””â”€â”€ api.ts                       # Fetch wrapper terhubung central-api
```

---

## ðŸ—‚ï¸ 5. Skema Koleksi Database (Shop Module)

- **Collection `products`**:
  `id, name, slug, description, price, category, images (array), status`
- **Collection `product_variants`**:
  `id, productId (Ref), size, color, stock, isPreorder, isAvailable`
- **Collection `orders`**:
  `id, orderCode (unique), customerName, phone, email, deliveryMethod ('Pickup' | 'Shipping'), shippingAddress, totalAmount, status ('Waiting_Payment' | 'Verified' | 'Production' | 'Ready' | 'Completed'), midtransTransactionId`
