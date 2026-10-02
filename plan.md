# Rencana Pengembangan Sistem Pendaftaran Kegiatan HSN 2026

## 1. Tujuan

Mengembangkan proyek Nuxt 4 yang saat ini berisi landing page dan timeline menjadi aplikasi pendaftaran kegiatan Hari Santri Nasional 2026 yang dapat menangani dua jenis kegiatan:

- `LOMBA`: kegiatan kompetisi yang dapat memiliki pendaftaran individu atau tim.
- `EVENT`: kegiatan umum seperti seminar, apel, sarasehan, atau pertunjukan.

Sistem harus menyediakan:

- katalog kegiatan publik;
- pendaftaran peserta dengan periode pendaftaran dan batas kuota;
- manajemen pengguna internal;
- penugasan pengguna sebagai operator pada kegiatan tertentu;
- area admin yang hanya memperlihatkan data sesuai hak akses pengguna;
- penyimpanan data menggunakan SQLite.

## 2. Pengguna dan Kondisi Ideal

### Peserta

- Dapat melihat kegiatan yang sudah dipublikasikan tanpa login.
- Dapat melihat status pendaftaran: belum dibuka, dibuka, kuota penuh, ditutup, atau kegiatan dibatalkan.
- Dapat mendaftar hanya selama periode pendaftaran aktif dan kuota masih tersedia.
- Mendapat kode pendaftaran setelah data berhasil disimpan.
- Tidak dapat membuat pendaftaran ganda pada kegiatan yang sama menggunakan email atau nomor telepon yang sama.

### Super Admin

- Dapat mengelola seluruh kegiatan, pendaftaran, pengguna, dan penugasan operator.
- Dapat melihat ringkasan kuota dan jumlah pendaftar seluruh kegiatan.
- Dapat menonaktifkan akun operator tanpa menghapus histori pengelolaannya.

### Operator Kegiatan

- Hanya dapat membuka dan mengelola kegiatan yang ditugaskan kepadanya.
- Hanya dapat membaca dan mengubah status pendaftaran pada kegiatan tersebut.
- Tidak dapat mengelola pengguna, mengubah penugasan, atau membuka kegiatan milik operator lain.

## 3. Keputusan Arsitektur

### Stack

- Tetap menggunakan Nuxt 4, Vue 3, Tailwind CSS 4, dan pnpm.
- Menggunakan Nitro server routes di direktori `server/api` sebagai backend dalam proyek yang sama.
- Menggunakan SQLite sebagai database tunggal.
- Menggunakan Drizzle ORM agar schema, migration, relasi, dan query SQLite tetap eksplisit.
- Menggunakan `better-sqlite3` sebagai driver SQLite.
- Menggunakan `nuxt-auth-utils` untuk session berbasis cookie terenkripsi.
- Menggunakan `@node-rs/argon2` untuk hashing password.
- Menggunakan `zod` untuk validasi payload API dan field pendaftaran dinamis.

### Library yang Direncanakan

```bash
pnpm add drizzle-orm better-sqlite3 nuxt-auth-utils @node-rs/argon2 zod
pnpm add -D drizzle-kit @types/better-sqlite3 tsx
```

Tambahkan script berikut ke `package.json`:

```json
{
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:seed": "tsx server/database/seed.ts"
}
```

### Model Akses

- `SUPER_ADMIN`: akses seluruh modul dan seluruh kegiatan.
- `OPERATOR`: akses hanya kegiatan yang tercatat pada tabel `activity_users`.
- Peserta tidak wajib mempunyai akun. Pendaftaran dilakukan melalui halaman publik.
- Otorisasi wajib diperiksa kembali di setiap server endpoint; penyembunyian menu di frontend bukan pengamanan utama.

## 4. Struktur Data

### `users`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | integer | Primary key |
| `name` | text | Nama pengguna |
| `email` | text unique | Identitas login dalam lowercase |
| `password_hash` | text | Hash Argon2 |
| `role` | text | `SUPER_ADMIN` atau `OPERATOR` |
| `is_active` | integer/boolean | Menentukan akun dapat login |
| `last_login_at` | datetime nullable | Login terakhir |
| `created_at` | datetime | Waktu dibuat |
| `updated_at` | datetime | Waktu diperbarui |

### `activities`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | integer | Primary key |
| `type` | text | `LOMBA` atau `EVENT` |
| `title` | text | Nama kegiatan |
| `slug` | text unique | URL publik |
| `description` | text nullable | Deskripsi |
| `image` | text nullable | Path gambar dari direktori `public` |
| `image_zoom` | real | Zoom gambar roadmap, default `1` |
| `image_position` | text | Posisi gambar roadmap, default `right center` |
| `display_order` | integer | Urutan tampil pada roadmap |
| `location` | text nullable | Lokasi kegiatan |
| `starts_at` | datetime | Waktu mulai kegiatan |
| `ends_at` | datetime nullable | Waktu selesai kegiatan |
| `registration_opens_at` | datetime | Awal pendaftaran |
| `registration_closes_at` | datetime | Akhir pendaftaran |
| `registration_mode` | text | `INDIVIDUAL` atau `TEAM` |
| `quota_mode` | text | `REGISTRATION` atau `PERSON` |
| `capacity` | integer nullable | `null` berarti tidak dibatasi |
| `min_team_members` | integer nullable | Hanya untuk mode tim |
| `max_team_members` | integer nullable | Hanya untuk mode tim |
| `registration_fields` | text/json | Konfigurasi field tambahan |
| `status` | text | `DRAFT`, `PUBLISHED`, `CLOSED`, atau `CANCELLED` |
| `created_by` | integer | FK pengguna pembuat |
| `created_at` | datetime | Waktu dibuat |
| `updated_at` | datetime | Waktu diperbarui |

Aturan:

- `registration_closes_at` harus sesudah `registration_opens_at`.
- `ends_at`, jika ada, harus sesudah `starts_at`.
- `capacity`, jika ada, minimal `1`.
- `registration_mode = TEAM` wajib memiliki batas minimal dan maksimal anggota yang valid.
- `registration_fields` hanya boleh berisi tipe field yang didukung: `text`, `textarea`, `number`, `select`, `radio`, dan `checkbox`.

### `activity_users`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `activity_id` | integer | FK kegiatan |
| `user_id` | integer | FK operator |
| `created_at` | datetime | Waktu penugasan |

Gunakan unique constraint gabungan `activity_id + user_id`.

### `registrations`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | integer | Primary key |
| `code` | text unique | Kode publik, misalnya `HSN26-XXXXXX` |
| `activity_id` | integer | FK kegiatan |
| `registrant_name` | text | Nama penanggung jawab |
| `email` | text | Email dalam lowercase |
| `phone` | text | Nomor telepon yang sudah dinormalisasi |
| `institution` | text nullable | Pesantren, sekolah, atau instansi |
| `team_name` | text nullable | Wajib untuk pendaftaran tim |
| `participant_count` | integer | Jumlah orang dalam pendaftaran |
| `answers` | text/json | Jawaban field tambahan |
| `status` | text | `PENDING`, `VERIFIED`, `REJECTED`, atau `CANCELLED` |
| `operator_notes` | text nullable | Catatan internal |
| `verified_by` | integer nullable | FK operator |
| `verified_at` | datetime nullable | Waktu verifikasi |
| `created_at` | datetime | Waktu pendaftaran |
| `updated_at` | datetime | Waktu diperbarui |

Aturan kuota:

- Status `PENDING` dan `VERIFIED` sama-sama memakai kuota agar tidak terjadi overbooking.
- Status `REJECTED` dan `CANCELLED` melepaskan kuota.
- `quota_mode = REGISTRATION`: satu baris pendaftaran dihitung satu slot.
- `quota_mode = PERSON`: kuota dihitung dari total `participant_count`.
- Pemeriksaan kuota dan penyimpanan pendaftaran harus dilakukan dalam satu transaksi SQLite `IMMEDIATE`.

### `registration_members`

Digunakan ketika kegiatan memakai `registration_mode = TEAM`.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | integer | Primary key |
| `registration_id` | integer | FK pendaftaran |
| `name` | text | Nama anggota |
| `identity_number` | text nullable | Nomor identitas jika disyaratkan |
| `metadata` | text/json | Data anggota tambahan |

### `login_attempts`

Mencatat percobaan login per email dan alamat IP untuk pembatasan sederhana, misalnya maksimal lima kegagalan dalam 15 menit. Data lama dapat dibersihkan saat login berhasil atau secara berkala.

## 5. Struktur Direktori yang Direncanakan

```text
app/
  components/
    admin/
    activities/
    registration/
  composables/
    useAuth.ts
    useActivities.ts
  layouts/
    admin.vue
    index.vue
  middleware/
    auth.ts
    guest.ts
  pages/
    index.vue
    timeline.vue
    kegiatan/
      index.vue
      [slug].vue
      [slug]/daftar.vue
      pendaftaran/[code].vue
    admin/
      login.vue
      index.vue
      users/index.vue
      users/new.vue
      users/[id].vue
      activities/index.vue
      activities/new.vue
      activities/[id]/index.vue
      activities/[id]/registrations.vue
server/
  api/
    auth/
    public/
    admin/
  database/
    client.ts
    schema.ts
    seed.ts
  services/
    activity.service.ts
    registration.service.ts
    user.service.ts
  utils/
    auth.ts
    authorization.ts
    validation.ts
    registration-state.ts
    registration-code.ts
drizzle/
drizzle.config.ts
data/
  hsn2026.sqlite
```

Database production tidak boleh disimpan ke Git. Tambahkan `data/*.sqlite`, `data/*.sqlite-shm`, dan `data/*.sqlite-wal` ke `.gitignore`.

## 6. API yang Direncanakan

### Autentikasi

- `POST /api/auth/login`
  - Validasi email dan password.
  - Tolak akun tidak aktif.
  - Terapkan pembatasan percobaan login.
  - Simpan session hanya dengan `id`, `name`, `email`, dan `role`.
- `POST /api/auth/logout`
- `GET /api/auth/session`

### Publik

- `GET /api/public/activities`
  - Hanya mengembalikan kegiatan `PUBLISHED`.
  - Mendukung filter `type` dan status pendaftaran.
- `GET /api/public/activities/:slug`
  - Mengembalikan detail, field pendaftaran, kuota terpakai, kuota tersisa, dan status pendaftaran terhitung.
- `POST /api/public/activities/:slug/register`
  - Muat ulang kegiatan langsung dari database.
  - Pastikan status kegiatan `PUBLISHED`.
  - Pastikan waktu server berada dalam periode pendaftaran.
  - Validasi field standar, field dinamis, mode individu/tim, dan jumlah anggota.
  - Cegah duplikasi berdasarkan kegiatan + email atau kegiatan + telepon untuk status aktif.
  - Kunci transaksi, hitung ulang kuota, lalu simpan.
- `GET /api/public/registrations/:code`
  - Menampilkan ringkasan aman tanpa catatan internal atau data sensitif anggota.

### Admin

- `GET/POST /api/admin/users`
- `GET/PATCH /api/admin/users/:id`
- `POST /api/admin/users/:id/reset-password`
- `GET/POST /api/admin/activities`
- `GET/PATCH /api/admin/activities/:id`
- `PUT /api/admin/activities/:id/operators`
- `GET /api/admin/activities/:id/registrations`
- `GET /api/admin/activities/:id/registrations/:registrationId`
- `PATCH /api/admin/activities/:id/registrations/:registrationId/status`
- `GET /api/admin/dashboard`

Semua endpoint admin harus memakai utilitas yang sama:

- `requireAuthenticatedUser(event)` untuk memastikan session valid dan akun masih aktif.
- `requireSuperAdmin(event)` untuk pengelolaan pengguna dan penugasan operator.
- `requireActivityAccess(event, activityId)` untuk menerima super admin atau operator yang ditugaskan.

## 7. Alur Bisnis

### Status Pendaftaran Kegiatan

Status yang ditampilkan dihitung server-side dengan urutan berikut:

1. `CANCELLED` jika kegiatan dibatalkan.
2. `DRAFT` jika belum dipublikasikan.
3. `NOT_OPEN` jika waktu sekarang sebelum `registration_opens_at`.
4. `CLOSED` jika status ditutup manual atau melewati `registration_closes_at`.
5. `FULL` jika kuota tersisa nol atau jumlah orang yang diminta melebihi sisa kuota.
6. `OPEN` jika seluruh syarat terpenuhi.

Frontend hanya menampilkan hasil tersebut dan tidak menentukan kelayakan pendaftaran sendiri.

### Pendaftaran

1. Peserta membuka detail kegiatan.
2. Sistem menampilkan periode, kuota, persyaratan, dan formulir sesuai konfigurasi.
3. Form dikirim sebagai JSON ke endpoint publik.
4. Server melakukan validasi dan pemeriksaan ulang status/kuota dalam transaksi.
5. Sistem membuat kode pendaftaran unik.
6. Peserta diarahkan ke halaman konfirmasi `/kegiatan/pendaftaran/[code]`.

### Pengelolaan Operator

1. Super admin membuat akun operator.
2. Super admin menugaskan satu atau beberapa kegiatan.
3. Setelah login, dashboard operator hanya memuat kegiatan yang ditugaskan.
4. Endpoint tetap menolak akses jika operator mengganti ID melalui URL.
5. Ketika operator dinonaktifkan atau penugasannya dicabut, akses berhenti pada request berikutnya.

## 8. Tahapan Implementasi

### Fase 1 - Fondasi Database dan Konfigurasi

- Tambahkan dependency dengan pnpm.
- Tambahkan konfigurasi environment:
  - `NUXT_SESSION_PASSWORD` minimal 32 karakter;
  - `NUXT_DATABASE_PATH`, default `./data/hsn2026.sqlite`.
- Buat konfigurasi Drizzle, koneksi SQLite tunggal, schema, migration awal, dan seed.
- Aktifkan foreign key SQLite, WAL mode, dan busy timeout.
- Seed satu akun `SUPER_ADMIN`; password dibaca dari environment dan tidak ditulis di repository.
- Tambahkan `.env.example` tanpa nilai rahasia.

### Fase 2 - Autentikasi dan Otorisasi

- Pasang `nuxt-auth-utils` di konfigurasi Nuxt.
- Implementasikan login, logout, session, hashing Argon2, dan pembatasan login.
- Buat middleware halaman admin dan guest.
- Buat utilitas server untuk pemeriksaan role dan akses kegiatan.
- Pastikan seluruh endpoint mutasi hanya menerima JSON same-origin dan menolak origin yang tidak sesuai.

### Fase 3 - Manajemen Pengguna

- Buat daftar, tambah, edit, aktivasi/nonaktifkan, dan reset password pengguna.
- Email harus unik dan dinormalisasi.
- Super admin tidak boleh menonaktifkan akun sendiri.
- Penghapusan permanen pengguna tidak disediakan agar histori tetap utuh.

### Fase 4 - Manajemen Kegiatan

- Buat CRUD kegiatan `LOMBA` dan `EVENT`.
- Buat editor periode pendaftaran, waktu kegiatan, mode peserta, kuota, dan field tambahan.
- Buat aksi publish, close, dan cancel dengan aturan transisi yang eksplisit.
- Buat penugasan banyak operator ke banyak kegiatan.
- Gambar menggunakan path file yang sudah tersedia di `public`; upload file tidak termasuk cakupan tahap ini.

### Fase 5 - Pendaftaran Publik

- Buat katalog `/kegiatan` dengan filter lomba/event dan status pendaftaran.
- Buat detail `/kegiatan/[slug]`.
- Buat formulir dinamis individu dan tim.
- Implementasikan transaksi kuota, pencegahan duplikasi, kode pendaftaran, dan halaman konfirmasi.
- Tampilkan pesan kegagalan yang spesifik untuk belum dibuka, sudah ditutup, penuh, duplikat, dan data tidak valid.

### Fase 6 - Pengelolaan Pendaftar

- Buat ringkasan dashboard sesuai scope pengguna.
- Buat daftar pendaftar per kegiatan dengan pencarian nama, email, telepon, kode, dan filter status.
- Buat halaman detail serta perubahan status pendaftaran.
- Catat operator dan waktu verifikasi.
- Pastikan perubahan ke `REJECTED` atau `CANCELLED` langsung memperbarui kuota tersisa.

### Fase 7 - Integrasi dengan Halaman Saat Ini

- Pertahankan visual dan perilaku `app/pages/index.vue` serta `app/pages/timeline.vue`.
- Tambahkan tombol menuju katalog kegiatan tanpa mengganti struktur data roadmap yang sudah ada.
- Pindahkan data awal `timelineItems` ke seed `activities` agar kegiatan hanya mempunyai satu sumber data.
- Ubah `timeline.vue` agar memuat kegiatan `PUBLISHED` dari API publik, mengelompokkannya per tanggal seperti perilaku sekarang, dan menautkan agenda ke detail kegiatan.
- Pertahankan dukungan overlay `image`, `image_zoom`, dan `image_position` agar hasil visual yang sudah disesuaikan tidak berubah.
- Gunakan warna teal, emas, tipografi, dan pola visual yang sudah didefinisikan di `DESIGN.md`.

### Fase 8 - Hardening dan Dokumentasi Operasional

- Batasi ukuran body request dan panjang seluruh input teks.
- Jangan pernah mengembalikan `password_hash`, catatan internal, atau metadata anggota pada endpoint publik.
- Normalisasi email dan nomor telepon sebelum pemeriksaan duplikasi.
- Gunakan parameter query ORM, bukan SQL hasil interpolasi string.
- Tambahkan panduan setup database, migration, seed admin, backup, dan restore ke `README.md`.
- Dokumentasikan bahwa SQLite cocok untuk satu instance aplikasi dengan volume pendaftaran HSN 2026; deployment multi-instance memerlukan database bersama dan berada di luar scope.

## 9. Kriteria Selesai

- Landing page dan timeline lama tetap tersedia.
- Kegiatan dapat dibuat sebagai `LOMBA` atau `EVENT`.
- Kegiatan dapat memakai pendaftaran individu atau tim.
- Periode pendaftaran divalidasi menggunakan waktu server.
- Kuota tidak dapat terlampaui oleh dua request pendaftaran bersamaan.
- Peserta menerima kode pendaftaran dan dapat membuka statusnya kembali.
- Super admin dapat mengelola pengguna, kegiatan, operator, dan seluruh pendaftaran.
- Operator hanya dapat mengakses kegiatan yang ditugaskan, baik melalui UI maupun API langsung.
- Akun nonaktif tidak dapat memakai session lama untuk mengakses endpoint admin.
- Data tersimpan di SQLite dan dapat dimigrasikan serta di-backup secara operasional.

## 10. Verifikasi yang Diizinkan

Sesuai instruksi, implementasi tidak menambahkan unit test, integration test, maupun end-to-end test dan tidak menjalankan perintah test. Tidak ada pekerjaan test-driven development dalam rencana ini.

Pemeriksaan implementasi dibatasi pada:

- inspeksi statis terhadap schema, route, middleware, dan guard otorisasi;
- pemeriksaan manual bahwa migration dan seed memiliki instruksi yang lengkap, tanpa menjalankannya jika larangan build/test masih berlaku;
- checklist manual untuk alur login, pembatasan akses operator, periode pendaftaran, kuota penuh, pendaftaran tim, duplikasi, dan perubahan status;
- build atau browser smoke check hanya dilakukan jika nanti diperintahkan secara eksplisit oleh pengguna.

## 11. Di Luar Cakupan

- Pembayaran online.
- Upload berkas atau foto oleh peserta.
- Pengiriman WhatsApp, email, atau SMS otomatis.
- Cetak sertifikat dan kartu peserta.
- Export Excel/CSV.
- Akun/login peserta.
- Integrasi dengan database eksternal.
- Deployment multi-instance dengan SQLite bersama.
- Pembuatan test otomatis atau fixture khusus test.

## 12. Urutan Eksekusi dan Ketergantungan

1. Fase 1 harus selesai sebelum seluruh fitur lain.
2. Fase 2 menjadi prasyarat Fase 3, Fase 4, dan Fase 6.
3. Fase 4 menjadi prasyarat Fase 5 dan Fase 6.
4. Fase 3 dan Fase 4 dapat dikerjakan paralel setelah autentikasi stabil.
5. Fase 5 dan Fase 6 dapat dikerjakan paralel setelah schema kegiatan final.
6. Fase 7 dilakukan setelah route publik kegiatan tersedia.
7. Fase 8 dilakukan terakhir tanpa memperluas fitur bisnis.

Setiap fase harus menjaga perubahan pengguna yang sudah ada dan tidak boleh menulis ulang `index.vue`, `timeline.vue`, atau aset visual di luar perubahan integrasi yang disebutkan secara eksplisit.
