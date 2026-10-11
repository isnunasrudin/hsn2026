# HSN 2026 Design System

## 1. Atmosphere & Identity

Admin HSN adalah ruang kerja yang tenang dan terpercaya: latar teal gelap, aksen emas sebagai penanda aksi penting, dan panel transparan yang memberi kedalaman tanpa mengubah suasana identitas Hari Santri.

Landing publik membawa identitas yang sama ke suasana perayaan: logo menjadi fokus, sementara sorotan lomba tampil sebagai informasi ringkas yang bersumber dari katalog kegiatan terpublikasi.

## 2. Color

| Role | Token | Value | Usage |
|---|---|---|---|
| Surface primary | `--hsn-surface-primary` | `#071c1e` | Latar admin |
| Surface secondary | `--hsn-surface-secondary` | `#0a292b` | Panel dan navigasi |
| Surface elevated | `--hsn-surface-elevated` | `#124b4d` | Panel aktif |
| Text primary | `--hsn-text-primary` | `#f4f1e9` | Judul dan isi utama |
| Text secondary | `--hsn-text-secondary` | `#cbd9d4` | Keterangan |
| Text muted | `--hsn-text-muted` | `#8fa8a0` | Metadata |
| Accent primary | `--hsn-accent-primary` | `#e9a51e` | Tombol utama dan status aktif |
| Accent soft | `--hsn-accent-soft` | `#e9b74f` | Label dan highlight |
| Status success | `--hsn-status-success` | `#77c69b` | Sukses |
| Status error | `--hsn-status-error` | `#f08b7c` | Error |
| Border subtle | `--hsn-border-subtle` | `rgba(244,241,233,.14)` | Pemisah panel |

## 3. Typography

- Primary: `Inter, ui-sans-serif, system-ui, sans-serif`.
- Display: 36px, 700, line-height 1.15.
- Landing headline: 30px, 600, line-height 1.3; section heading: 24px, 600, line-height 1.3; activity title: 18px, 600, line-height 1.35.
- Body: 16px, 400, line-height 1.6; landing body: 17px, 400, line-height 1.55.
- Small: 14px, 400, line-height 1.5; landing metadata: 15px, 400, line-height 1.5; desktop date/status label: 14px, 600.
- Overline: 12px, 600, uppercase, letter-spacing `.18em`; compact metadata: 12px, 600, line-height 1.5.

## 4. Spacing & Layout

- Base unit: 4px.
- Admin shell: minimum height `100dvh`, sidebar 248px pada desktop, satu kolom pada mobile.
- Content width: `min(100% - 40px, 1120px)`.
- Panel padding: 24px desktop, 20px mobile.
- Breakpoints: 640px, 768px, 1024px.

## 5. Components

### Admin shell

- Structure: sidebar/header, main content, session action.
- States: default, mobile stacked, reduced motion.
- Accessibility: landmark `nav`, `header`, `main`; focus-visible ring pada link dan button.

### Auth form

- Structure: label, input, error message, submit button.
- States: default, focus, loading, error, disabled.
- Accessibility: label eksplisit, `aria-invalid`, `aria-live` untuk error.

### Status panel

- Structure: overline, title, supporting text, action/link.
- States: default dan informational.
- Layout: panel dengan tonal shift, bukan kartu berulang.

### Sorotan lomba

- Structure: pengantar singkat, hingga tiga kegiatan `LOMBA` terpublikasi, dan tautan ke katalog lengkap.
- Activity item: tanggal dan waktu pelaksanaan, nama lomba, deskripsi, penyelenggara, lokasi, status pendaftaran, gambar bila tersedia, serta tautan detail. Permukaan gelap transparan, radius 3px, dan lapisan gambar dengan gradien mengikuti kartu agenda `/timeline`.
- Primary action: tombol berisi aksen emas untuk membuka katalog kegiatan.
- Spacing: tumpukan pengantar dan informasi pada kartu memakai jarak vertikal 12px; pemisah pengantar ke daftar 16px di ponsel dan 12px di desktop.
- States: loading, error, empty, dan populated.
- Layout: daftar responsif dengan kartu agenda, tidak menampilkan data statis yang bisa berbeda dari katalog.
- Accessibility: heading berurutan, daftar kegiatan semantik, status pemuatan/error diumumkan, tautan memiliki nama yang menjelaskan tujuannya.

### Admin modal

- Structure: backdrop transparan, panel terpusat, judul, keterangan, konten form, dan aksi penutup.
- States: closed, open, loading, error, destructive confirmation.
- Accessibility: `role="dialog"`, `aria-modal`, tombol tutup, dan penutupan dengan Escape atau klik backdrop.
- Destructive actions: tombol menggunakan status error tonal, bukan garis aksen pada panel.

## 6. Motion & Interaction

- Transisi standar 180ms ease-out.
- Animasi hanya menggunakan opacity dan transform.
- Login menampilkan keadaan loading pada tombol.
- `prefers-reduced-motion` menonaktifkan transform dekoratif.

## 7. Depth & Surface

- Strategy: mixed; panel menggunakan tonal shift dan border subtle, tanpa shadow hitam pekat.
- Radius: 3px untuk kartu agenda/sorotan lomba, 8px untuk input/button, 16px untuk panel, full untuk badge.

## 8. Accessibility Constraints & Accepted Debt

- Target WCAG 2.2 AA.
- Kontras teks minimal 4.5:1, focus-visible wajib terlihat, dan semua alur dapat dijalankan dengan keyboard.
- Accepted debt: visual QA browser belum dijalankan karena pengguna meminta tidak melakukan build/test; perlu dilakukan sebelum rilis produksi.
