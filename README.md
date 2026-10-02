# HSN 2026

Aplikasi Hari Santri Nasional 2026 PCNU Trenggalek, dibangun dengan Nuxt 4 dan SQLite.

## Setup

Pasang dependency dengan pnpm:

```bash
pnpm install
```

Salin konfigurasi environment, lalu isi secret session dan akun super admin:

```bash
cp .env.example .env
```

`NUXT_SESSION_PASSWORD` wajib berupa secret acak minimal 32 karakter. Jangan gunakan nilai contoh untuk production.

## Database

Generate dan terapkan migration SQLite:

```bash
pnpm db:generate
pnpm db:migrate
```

Buat atau perbarui akun super admin dari nilai `ADMIN_*` di `.env`:

```bash
pnpm db:seed
```

Database lokal tersimpan di `data/hsn2026.sqlite` secara default dan tidak masuk Git. Koneksi mengaktifkan foreign key, WAL, serta busy timeout lima detik.

## Autentikasi

Endpoint autentikasi internal yang tersedia:

- `POST /api/auth/login` untuk login dengan email dan password.
- `POST /api/auth/logout` untuk menghapus session.
- `GET /api/auth/session` untuk membaca user aktif.

Session disimpan oleh `nuxt-auth-utils`. Password disimpan sebagai hash Argon2, akun tidak aktif ditolak, dan percobaan login dibatasi lima kegagalan dalam 15 menit per email dan alamat IP.

Middleware halaman yang tersedia adalah `auth` untuk halaman admin dan `guest` untuk halaman yang hanya boleh diakses saat belum login. Pemeriksaan role dan penugasan kegiatan tersedia melalui utilitas server di `server/utils/authorization.ts`.

Endpoint manajemen pengguna hanya dapat dipanggil super admin:

- `GET /api/admin/users` dan `POST /api/admin/users` untuk daftar dan tambah pengguna.
- `GET /api/admin/users/:id` dan `PATCH /api/admin/users/:id` untuk detail dan perubahan pengguna.
- `POST /api/admin/users/:id/reset-password` untuk mengganti password.

Password baru minimal 12 karakter. Super admin aktif terakhir tidak dapat diturunkan rolenya atau dinonaktifkan, dan akun yang sedang dipakai tidak dapat menonaktifkan dirinya sendiri.

Manajemen kegiatan tersedia di `/admin/activities` dan endpoint berikut:

- `GET /api/admin/activities` untuk daftar kegiatan sesuai akses pengguna.
- `POST /api/admin/activities` untuk membuat kegiatan sebagai super admin.
- `GET/PATCH /api/admin/activities/:id` untuk detail dan perubahan kegiatan.
- `PUT /api/admin/activities/:id/operators` untuk mengganti penugasan operator.

Validasi server mencakup slug unik, urutan waktu kegiatan dan pendaftaran, batas anggota tim, field pendaftaran bertipe teks, pilihan, checkbox, atau file maksimal 5 MB, serta transisi status `DRAFT`, `PUBLISHED`, `CLOSED`, dan `CANCELLED`.

Dashboard admin tersedia di `/admin` dan menampilkan jumlah kegiatan serta pendaftaran sesuai cakupan akses akun. Field pendaftaran dinamis dapat dikelola dari form kegiatan dengan tipe teks, paragraf, angka, pilihan, radio, dan checkbox.

Pendaftaran publik tersedia di `/kegiatan` dengan endpoint berikut:

- `GET /api/public/activities` untuk katalog kegiatan terpublikasi, dengan filter query `type=LOMBA` atau `type=EVENT`.
- `GET /api/public/activities/:slug` untuk detail kegiatan dan field pendaftaran.
- `POST /api/public/activities/:slug/register` untuk membuat pendaftaran individu atau tim.
- `GET /api/public/registrations/:code` untuk halaman konfirmasi menggunakan kode pendaftaran.

Pendaftaran memeriksa periode, kapasitas sesuai mode kuota, email dan nomor telepon aktif yang duplikat, serta menyimpan pembuatan pendaftar dan anggota tim dalam satu transaksi SQLite.

Kegiatan bertipe `EVENT` hanya ditampilkan sebagai agenda/detail dan tidak memerlukan pendaftaran. Pendaftaran hanya tersedia untuk kegiatan bertipe `LOMBA`; endpoint server juga menolak pendaftaran langsung ke event.

Pengelolaan pendaftar tersedia pada `/admin/registrations/:activityId` untuk akun yang memiliki akses ke kegiatan tersebut:

- `GET /api/admin/activities/:id/registrations` dengan query `q` dan `status` untuk pencarian serta filter.
- `GET /api/admin/registrations/:id` untuk detail pendaftar dan anggota tim.
- `PATCH /api/admin/registrations/:id` untuk mengubah status dan catatan operator.

Status `VERIFIED` mencatat operator serta waktu verifikasi. Perubahan status yang mengaktifkan kembali pendaftar memeriksa kapasitas dalam transaksi SQLite; status `REJECTED` dan `CANCELLED` otomatis tidak lagi dihitung sebagai kuota aktif.

Landing page menyediakan akses ke katalog kegiatan melalui `/kegiatan`. Roadmap `/timeline` membaca kegiatan `PUBLISHED` dari endpoint publik yang sama, mengelompokkannya berdasarkan tanggal, dan menautkan setiap agenda ke halaman detail. Data awal roadmap disediakan oleh seed database, termasuk penyelenggara, rentang waktu, gambar overlay, zoom, dan posisi gambar.

## Development Server

Start the development server on `http://localhost:3000`:

```bash
pnpm dev
```

## Production

Build the application for production:

```bash
pnpm build
```

Locally preview production build:

```bash
pnpm preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
