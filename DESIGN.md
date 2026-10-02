# HSN 2026 Coming Soon

## Direction

Halaman tunggal dengan atmosfer futuristik "holographic observatory". Teal
menjadi ruang gelap, logo HSN menjadi focal point bercahaya, dan gold menjadi
aksen telemetry pada countdown. Grid perspektif, orbit, scanline, dan frame
teknis memberi kedalaman tanpa menambah headline, deskripsi, atau tombol.

## Tokens

- `--color-teal-950`: `#043f40`, latar utama.
- `--color-teal-700`: `#077d7f`, cahaya latar yang sangat halus.
- `--color-gold-500`: `#d79219`, angka countdown dan detail divider.
- `--color-cream`: `#fffaf0`, logo dan teks pendamping countdown.
- `--color-cyan`: `#43e6e3`, garis grid dan glow sekunder.
- `--color-ink`: `#021f20`, panel transparan.
- `--font-display`: `Orbitron`, `Arial`, sans-serif, untuk angka countdown.
- `--font-sans`: `Exo 2`, `Arial`, sans-serif, untuk label dan footer.
- Spacing unit: 8px.
- Countdown angka: clamp 2rem hingga 4.5rem, tabular numerals.
- Motion: orbit 18s/28s linear dan pulse 4s ease-in-out; hanya transform,
  opacity, serta filter yang dianimasikan.

## Primitives and states

- `ComingSoonShell`: viewport-height layout dengan atmospheric grid, logo di
  pusat, countdown di bawahnya, dan footer yang selalu berada di dasar halaman.
- `LogoStage`: focal point bercahaya dengan orbit dan scanline. Ornamen bersifat
  dekoratif dan tidak masuk accessibility tree.
- `CountdownBlock`: empat unit hari/jam/menit/detik. State normal dan state
  selesai (semua nilai nol) memakai struktur visual yang sama, dengan frame
  telemetry dan angka tabular.
- Motion memakai opacity/transform/filter untuk logo, orbit, dan scanline.
  `prefers-reduced-motion` menonaktifkan semua motion dekoratif.

## Accessibility

- Logo memiliki alt text yang bermakna.
- Countdown mempunyai region live yang tidak mengganggu pembaca layar.
- Kontras logo, angka, dan footer dijaga terhadap latar teal.

## Scope

Countdown dihitung ke 22 Oktober 2026 pukul 00.00 WIB. Tidak ada API atau
backend; waktu dihitung di browser menggunakan `Intl.DateTimeFormat` dan
`setInterval` satu detik.

## Landing Page V2

V2 tersedia di route `/v2` dan tidak menggantikan route `/`. V1 tetap menjadi
halaman utama yang sudah ada. V2 memakai split-screen asimetris: logo berada di
frame visual kiri, countdown berada di grid telemetry kanan, dengan breakpoint
mobile menjadi satu kolom. Token V2 memakai near-black, teal, cyan struktural,
dan gold sebagai aksen utama.

## Landing Page V3

V3 tersedia di route `/v3` dan memakai aset `hsn2026v3.png`. V3 tidak mengubah
V1 atau V2. Arah visualnya minimalis terang dengan bidang off-white, teal logo
sebagai warna utama, dan gold sebagai aksen countdown. Layout split-screen
menjadi satu kolom pada layar kecil dan sengaja membatasi copy menjadi kicker,
tanggal acara, countdown, serta footer.

## Timeline Page

Timeline tersedia di route `/timeline` dan memakai arah visual yang sama dengan
landing terbaru: latar teal gelap, aksen gold, tipografi Inter, dan garis
geometris dekoratif. Halaman memakai `timelineItems` sebagai satu sumber data
untuk tanggal, status, judul, deskripsi, dan lokasi setiap agenda. Struktur
timeline menggunakan daftar semantik `<ol>`, garis progres dekoratif, dan
breakpoint mobile satu kolom dengan rail yang lebih ringkas.
