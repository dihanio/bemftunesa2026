# ðŸ“˜ INTERNAL MANAGEMENT SYSTEM (IMS) ERP DASHBOARD

**Domain**: `ims.bemftunesa.org`
**Version**: **v6.0 (Enterprise ERP Edition)**

---

## ðŸŽ¯ 1. Deskripsi & Tujuan Sistem

**IMS BEM FT UNESA** telah bertransformasi menjadi sebuah **Organizational Resource Planning (ERP)** tingkat _Enterprise_ yang terintegrasi secara penuh. Sistem ini bukan lagi sekadar dasbor, melainkan sebuah ekosistem _operating system_ organisasi yang mengendalikan birokrasi, keuangan, rekrutmen, analitik, dan perizinan akses secara granular.

```mermaid
graph TD
    subgraph Frontend ERP Ecosystem
        A[Dashboard & Analytics]
        B[Finance & Proposal]
        C[Committee & Lifecycles]
        D[Workload & HR]
        E[Document Versioning]
    end
    F[Role-Based UI Guard] --> Frontend ERP Ecosystem
    Frontend ERP Ecosystem --> G[Central ERP API]
```

### Core Enterprise Objectives:

- **Permission-Based UI Access Control**: Tampilan dinamis dan aman secara absolut. Jika user tidak memiliki akses spesifik, seluruh menu, tombol, dan endpoint terkait akan disembunyikan dan dilindungi.
- **Flexible Enterprise Finance System**: Alokasi anggaran dinamis yang tidak mengunci pagu secara _hardcoded_, memberikan kebebasan fleksibilitas pada Bendahara (override & warnings).
- **Workload & Analytics Monitoring**: Pemantauan presisi terhadap keseimbangan beban kerja seluruh anggota organisasi untuk mencegah _burnout_.
- **Committee Lifecycle & Archiving**: Manajemen status event dari 'Planning' hingga 'Archived' (di mana dokumen/data dibekukan secara permanen).

---

## ðŸ›¡ï¸ 2. Frontend Permission-Based UI Access Control

Arsitektur _frontend_ menerapkan proteksi di seluruh _layer_ (Komponen, Rute, dan Navigasi) berdasarkan izin (_permissions_), bukan sekadar peran (_roles_).

### 2.1 UI States & Guards

Komponen `PermissionGuard` mengatur rendering elemen berdasarkan hak akses:

1. **Hidden**: Elemen navigasi atau tombol benar-benar hilang (contoh: `admin.manage` untuk staff).
2. **Disabled**: Tombol terlihat namun nonaktif dengan _tooltip_ penjelas.
3. **Read Only**: Form input dikunci (hanya dapat membaca data).
4. **Scoped Access**: Filter otomatis yang hanya menampilkan entitas milik departemen/event tertentu.

```tsx
// Contoh Implementasi PermissionGuard
<PermissionGuard permission="finance.approve" fallback={<AccessDeniedCard />}>
  <ApproveRABButton prokerId={proker.id} />
</PermissionGuard>
```

---

## ðŸ‘¥ 3. Manajemen Kepanitiaan (Committee Lifecycle System)

Kepanitiaan tidak lagi berstatus aktif selamanya. Alur hidup event (Lifecycle) diatur secara spesifik:

**Planning â”€â”€â–º Active â”€â”€â–º Event Finished â”€â”€â–º LPJ Revision â”€â”€â–º LPJ Approved â”€â”€â–º Archived**

- **Manual Archive-Based Transition**: Pencabutan akses kepanitiaan tidak dilakukan otomatis oleh sistem, melainkan melalui **Arsip Manual** oleh Sekretaris/WaKaBEM/KaBEM setelah LPJ final disetujui.
- **Archival Freeze**: Ketika diarsipkan, panitia menjadi _read-only_, file proposal dan LPJ dibekukan menjadi _immutable_, izin akses finansial dicabut permanen, dan data diawetkan untuk audit.

---

## ðŸ’° 4. Enterprise Finance System

Manajemen keuangan menggunakan pendekatan **Flexible Department Allocation**.

- **Soft Validation & Warnings**: Alokasi proposal diizinkan melebihi pagu (Sistem memberikan peringatan _Overspending_, bukan _Hard-Block_). Bendahara BEM dapat melakukan _override_ sesuai kondisi real.
- **Item-Level Approval & Partial Approval**: Bendahara dapat menolak/menyetujui baris item pengeluaran tertentu dalam RAB/SPJ secara parsial.
- **Immutable Financial Ledger**: Riwayat transaksi SPJ/Kuitansi bersifat _append-only_. Perubahan akan dicatat dalam revisi tanpa menghapus rekam jejak lama.

---

## ðŸ“… 5. Organization Calendar & Workload Analytics

### 5.1 Calendar Engine

Kalender ERP mendukung pemantauan sumber daya fisik dan waktu:

- **Conflict & Room Collision Detection**: Deteksi bentrok jadwal peminjaman ruangan kesekretariatan atau peralatan secara otomatis.
- **Committee Overlap Detection**: Menghindari jadwal kegiatan yang tumpang tindih antar departemen.

### 5.2 Workload Analytics

Dasbor HR organisasi (Biro PSDM / BPI) secara proaktif mendeteksi:

- **Overloaded Members**: Fungsionaris yang menjabat di >3 kepanitiaan dalam waktu bersamaan.
- **Inactive Users**: Fungsionaris yang belum mendapatkan penugasan.
- **Department Imbalance**: Ketidakseimbangan distribusi SDM antar departemen.

---

## ðŸ”„ 6. Version Control System (VCS) untuk Dokumen

Birokrasi menggunakan sistem pelacakan revisi layaknya _Git_ untuk dokumen vital (Proposal, RAB, SPJ, LPJ).

- Fitur Utama: **Version History**, **Compare Versions (Diff)**, **Rollback**, **Revision Notes**, dan **Immutable Snapshots**.
- Memudahkan revisi proposal birokrasi tanpa harus mengunggah file baru dari nol (melalui _Delta Updates_).

---

## ðŸŽ¨ 7. Shared Design System (`packages/ui`)

Pengembangan UI frontend ERP disentralisasi melalui Monorepo (Turborepo).

- Semua _Micro-Frontend_ (IMS, OR, PKKMB, Shop) menggunakan modul lokal `@bemft/ui`.
- Komponen tersentralisasi: _Forms_, _Tables_, _Modals_, _Dashboard Widgets_, _Charts_, _Layout_, _Typography_, _Badges_, dan _Alerts_ yang konsisten.

---

## ðŸ§± 8. Struktur Aplikasi (Next.js 15 App Router)

```
apps/ims/
â”œâ”€â”€ app/
â”‚   â”œâ”€â”€ (auth)/
â”‚   â”‚   â””â”€â”€ login/page.tsx
â”‚   â”œâ”€â”€ (dashboard)/
â”‚   â”‚   â”œâ”€â”€ admin/
â”‚   â”‚   â”‚   â”œâ”€â”€ users/page.tsx           # Scoped: admin.manage
â”‚   â”‚   â”‚   â””â”€â”€ policies/page.tsx        # Workflow Policy Engine GUI
â”‚   â”‚   â”œâ”€â”€ proker/
â”‚   â”‚   â”‚   â””â”€â”€ [id]/page.tsx            # Committee Lifecycle & Proker
â”‚   â”‚   â”œâ”€â”€ finance/
â”‚   â”‚   â”‚   â”œâ”€â”€ dashboard/page.tsx       # Finance Analytics & Ledger
â”‚   â”‚   â”‚   â””â”€â”€ [id]/page.tsx            # RAB Item-level Approval
â”‚   â”‚   â”œâ”€â”€ documents/
â”‚   â”‚   â”‚   â””â”€â”€ [id]/history/page.tsx    # Version Control History
â”‚   â”‚   â””â”€â”€ workload/page.tsx            # Workload & Member Analytics
â””â”€â”€ components/
    â”œâ”€â”€ guards/
    â”‚   â”œâ”€â”€ permission-guard.tsx         # Conditional render component
    â”‚   â””â”€â”€ role-guard.tsx
    â”œâ”€â”€ finance/
    â”‚   â””â”€â”€ ledger-table.tsx             # Immutable ledger UI
    â””â”€â”€ calendar/
        â””â”€â”€ collision-detector.tsx       # Conflict warnings UI
```
