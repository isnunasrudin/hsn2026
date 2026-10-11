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

### Sorotan lomba dan pencarian kegiatan

- Structure: pengantar singkat, pencarian kegiatan berdasarkan judul dan deskripsi, seluruh kegiatan terpublikasi yang belum terlewat saat kolom pencarian kosong, dan tautan ke katalog lengkap.
- Ordering: kegiatan diurutkan berdasarkan waktu mulai terdekat; jadwal kosong berada setelah kegiatan yang memiliki waktu. Daftar landing memakai timeline roadmap yang mengelompokkan kegiatan berdasarkan tanggal.
- Activity item: tanggal dan waktu pelaksanaan, nama lomba, deskripsi, penyelenggara, lokasi, status pendaftaran, gambar bila tersedia, serta tautan detail. Permukaan gelap transparan, radius 3px, dan lapisan gambar dengan gradien mengikuti kartu agenda `/timeline`.
- Primary action: tombol berisi aksen emas untuk membuka katalog kegiatan.
- Spacing: tumpukan pengantar dan informasi pada kartu memakai jarak vertikal 12px; pemisah pengantar ke daftar 16px di ponsel dan 12px di desktop.
- States: loading, error, empty, dan populated.
- Layout: timeline responsif memakai rail tanggal dan kartu agenda yang sama dengan `/timeline` dan `/kegiatan`; tidak menampilkan data statis yang bisa berbeda dari katalog.
- Accessibility: heading berurutan, daftar kegiatan semantik, status pemuatan/error diumumkan, tautan memiliki nama yang menjelaskan tujuannya.

### Kegiatan hari ini

- Structure: tanggal WIB, daftar kegiatan yang rentang tanggalnya mencakup hari ini, waktu, status aktif, lokasi, dan penyelenggara.
- Layout: lockup logo di kiri dan daftar grid di kanan pada desktop; satu kolom di layar kecil. Selayang pandang lomba mengikuti bagian hero.
- Surfaces: panel teal tonal; list selayang pandang satu kolom di mobile/tablet dan dua kolom di desktop. Aksen emas hanya untuk status yang sedang berlangsung.
- States: loading, error, empty, scheduled today, and currently in progress.
- Motion: section and items enter with opacity/vertical transform; active dot pulses. `prefers-reduced-motion` disables the pulse and reduces entry motion.
- Accessibility: Indonesian date and time are explicit, schedule links are keyboard reachable, and asynchronous states use polite announcements.

### Roadmap katalog kegiatan

- Structure: header navigasi, judul agenda, jumlah kegiatan, filter jenis bila tersedia, rail tanggal bernomor, dan grid item per tanggal.
- Shared surface: halaman `/timeline` dan `/kegiatan` memakai komponen serta kartu roadmap yang sama.
- States: loading, error, empty, filtered, and populated; cards link to the activity detail route.
- Responsive behavior: kartu dua kolom pada layar lebar dan satu kolom pada layar kecil.

### Admin modal

- Structure: backdrop transparan, panel terpusat, judul, keterangan, konten form, dan aksi penutup.
- States: closed, open, loading, error, destructive confirmation.
- Accessibility: `role="dialog"`, `aria-modal`, tombol tutup, dan penutupan dengan Escape atau klik backdrop.
- Destructive actions: tombol menggunakan status error tonal, bukan garis aksen pada panel.

### Admin activity image cropper

- Structure: pemilih JPG/PNG/WebP, cropper dengan rasio tetap 16:9, pratinjau hasil, lalu aksi pilih ulang atau hapus.
- States: empty, crop in progress, cropped preview, invalid type/size, and cleared.
- Interaction: drag image within the crop area; apply produces a JPEG capped at 1600 × 900 for the public activity surfaces.
- Accessibility: native file input remains keyboard reachable through its visible label; crop errors use `role="alert"` and saved-preview feedback uses `role="status"`.

## 6. Motion & Interaction

- Transisi standar 180ms ease-out.
- Animasi hanya menggunakan opacity dan transform.
- Agenda landing memakai kemunculan bertahap; penanda kegiatan aktif berdenyut lembut.
- Login menampilkan keadaan loading pada tombol.
- `prefers-reduced-motion` menonaktifkan transform dekoratif.

## 7. Depth & Surface

- Strategy: mixed; panel menggunakan tonal shift dan border subtle, tanpa shadow hitam pekat.
- Radius: 3px untuk kartu agenda/sorotan lomba, 8px untuk input/button, 16px untuk panel, full untuk badge.

## 8. Accessibility Constraints & Accepted Debt

- Target WCAG 2.2 AA.
- Kontras teks minimal 4.5:1, focus-visible wajib terlihat, dan semua alur dapat dijalankan dengan keyboard.
- Accepted debt: visual QA browser belum dijalankan karena pengguna meminta tidak melakukan build/test; perlu dilakukan sebelum rilis produksi.
