import 'dotenv/config'
import { hash } from '@node-rs/argon2'
import { z } from 'zod'
import { db } from './client'
import { defaultRegistrationFields } from './schema'

const seedEnvironmentSchema = z.object({
  ADMIN_NAME: z.string().trim().min(2),
  ADMIN_EMAIL: z.email().transform(value => value.toLowerCase()),
  ADMIN_PASSWORD: z.string().min(12)
})

const seedAdmin = async (): Promise<number> => {
  const environment = seedEnvironmentSchema.parse(process.env)
  const passwordHash = await hash(environment.ADMIN_PASSWORD, {
    memoryCost: 19_456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1
  })

  const existingUser = await db.user.findUnique({ where: { email: environment.ADMIN_EMAIL }, select: { id: true } })

  if (existingUser) {
    await db.user.update({
      where: { id: existingUser.id },
      data: {
        name: environment.ADMIN_NAME,
        passwordHash,
        role: 'SUPER_ADMIN',
        isActive: true,
        updatedAt: new Date()
      }
    })

    console.info(`Super admin diperbarui: ${environment.ADMIN_EMAIL}`)
    return existingUser.id
  }

  const user = await db.user.create({ data: {
    name: environment.ADMIN_NAME,
    email: environment.ADMIN_EMAIL,
    passwordHash,
    role: 'SUPER_ADMIN'
  } })

  console.info(`Super admin dibuat: ${environment.ADMIN_EMAIL}`)

  return user.id
}

const atWib = (value: string): Date => new Date(`${value}+07:00`)

const initialActivities = [
  ['EVENT', 'Kick Off Hari Santri Nasional 2026', 'kick-off-hari-santri-2026', 'Bersamaan dengan Naharul Ijtima` PCNU Trenggalek', 'PCNU', 'Slawe, Watulimo', '2026-10-11T09:00:00', '2026-10-11T12:00:00', null],
  ['EVENT', 'Seminar LP Ma`arif NU', 'seminar-lp-maarif-nu', 'Seminar pendidikan dan penguatan karakter santri di era digital.', "LP Ma'arif NU", 'Ngulanwetan, Pogalan', '2026-10-15T08:00:00', '2026-10-15T12:00:00', '/images/timeline/sakoma.jpeg'],
  ['LOMBA', 'KMD (Kursus Mahir Dasar) LP Ma`arif NU', 'kmd-lp-maarif-nu', 'Pelatihan kepemimpinan dan manajemen pesantren bagi santri dan pengurus pondok pesantren.', "LP Ma'arif NU", 'Ngulanwetan, Pogalan', '2026-10-15T12:00:00', '2026-10-21T23:59:00', '/images/timeline/sakoma.jpeg'],
  ['EVENT', 'Apel Hari Santri Nasional 2026', 'apel-hari-santri-2026', 'Apel peringatan Hari Santri Nasional 2026 di Kabupaten Trenggalek dengan tema “Santri Menguatkan Negeri”.', 'PCNU', 'Aloon Aloon Trenggalek', '2026-10-22T07:00:00', '2026-10-22T09:00:00', '/images/timeline/apel.webp'],
  ['EVENT', 'Khotmil Qur`an', 'khotmil-quran-muslimat-nu', 'Kegiatan khotmil Qur`an bersama Muslimat NU Trenggalek dalam rangka memperingati Hari Santri Nasional 2026.', 'Muslimat NU', 'PP. Anwarul Haromain, Baruharjo, Durenan', '2026-10-25T06:00:00', '2026-10-25T12:00:00', '/images/timeline/muslimat-khotmil.webp'],
  ['EVENT', 'Opening Ceremony bersama Gus Salsaladin', 'opening-ceremony-gus-salsaladin', 'Acara pembukaan peringatan Hari Santri Nasional 2026 dengan menghadirkan Gus Salsaladin sebagai pembicara utama.', 'PCNU', 'Venue Utama, Aloon Aloon Trenggalek', '2026-10-25T19:00:00', '2026-10-25T22:00:00', '/images/timeline/gus_salsaladin.webp'],
  ['EVENT', 'Musik Religi bersama Silvi Kumalasari', 'musik-religi-silvi-kumalasari', 'Penampilan musik religi oleh Silvi Kumalasari untuk memeriahkan peringatan Hari Santri Nasional 2026.', 'PCNU', 'Venue Utama, Aloon Aloon Trenggalek', '2026-10-26T19:00:00', '2026-10-26T22:00:00', '/images/timeline/silvi.webp'],
  ['EVENT', 'Sarasehan', 'sarasehan-pergunu', 'Diskusi dan sarasehan bersama PERGUNU Trenggalek mengenai peran santri dalam pembangunan bangsa.', 'PERGUNU', 'Aula Kemenag Trenggalek', '2026-10-27T09:00:00', '2026-10-27T12:00:00', '/images/timeline/pergunu-seminar.webp'],
  ['EVENT', 'Gus Fauzy bersama Hamid Uye & Amor Rosul', 'gus-fauzy-hamid-uye-amor-rosul', 'Penampilan musik dan tausiyah oleh Gus Fauzy, Hamid Uye, dan Amor Rosul.', 'PCNU', 'Venue Utama, Aloon Aloon Trenggalek', '2026-10-27T19:00:00', '2026-10-27T22:00:00', null],
  ['EVENT', 'Seni Pencak Silat', 'seni-pencak-silat', 'Pertunjukan seni pencak silat oleh PSNU PN Trenggalek.', 'PSNU PN', 'Aloon Aloon Trenggalek', '2026-10-28T19:00:00', '2026-10-28T21:00:00', null],
  ['LOMBA', 'Senam Masal & Lomba Tari Islami (PAUD)', 'senam-masal-lomba-tari-islami-paud', null, 'Muslimat NU', 'Venue Utama, Aloon Aloon Trenggalek', '2026-10-29T06:00:00', '2026-10-29T12:00:00', null],
  ['EVENT', 'Jaljalut & Gus Badar', 'jaljalut-gus-badar', null, 'PCNU', 'Venue Utama, Aloon Aloon Trenggalek', '2026-10-29T19:00:00', '2026-10-29T22:00:00', null],
  ['EVENT', 'Musik Religi bersama Cak Shodiq', 'musik-religi-cak-shodiq', null, 'PCNU', 'Venue Utama, Aloon Aloon Trenggalek', '2026-10-30T19:00:00', '2026-10-30T22:00:00', null],
  ['EVENT', 'Festival Budaya', 'festival-budaya-fatayat', 'Festival budaya dan seni tradisional yang menampilkan berbagai pertunjukan dari komunitas lokal.', 'Fatayat NU', 'Venue Utama, Aloon Aloon Trenggalek', '2026-10-31T09:00:00', '2026-10-31T22:00:00', null],
  ['EVENT', 'ISHARI (Ikatan Seni Hadrah RI)', 'ishari', 'Pertunjukan seni hadrah oleh ISHARI Trenggalek.', 'ISHARI', 'Venue Utama, Aloon Aloon Trenggalek', '2026-10-31T19:00:00', '2026-10-31T22:00:00', null],
  ['EVENT', 'Jalan Sehat Santri Sarungan & Zanjabil Gambus', 'jalan-sehat-santri-sarungan', 'Kegiatan jalan sehat bersama santri dan penampilan musik Zanjabil Gambus.', 'PCNU', 'Venue Utama, Aloon Aloon Trenggalek', '2026-11-01T06:00:00', '2026-11-01T12:00:00', null],
  ['LOMBA', 'Festival Sholawat', 'festival-sholawat', 'Festival sholawat dan lomba hadrah yang diikuti oleh berbagai komunitas santri.', 'IPNU & IPPNU', 'Venue Utama, Aloon Aloon Trenggalek', '2026-11-01T19:00:00', '2026-11-01T22:00:00', null],
  ['EVENT', 'An Najaa Indonesia', 'an-najaa-indonesia', 'Pertunjukan musik religi oleh An Najaa Indonesia.', 'PCNU', 'Venue Utama, Aloon Aloon Trenggalek', '2026-11-02T19:00:00', '2026-11-02T21:00:00', null],
  ['EVENT', 'Istighotzah', 'istighotzah', 'Acara penutupan resmi peringatan Hari Santri Nasional 2026 oleh PCNU Trenggalek.', 'PCNU', 'Venue Utama, Aloon Aloon Trenggalek', '2026-11-02T21:00:00', '2026-11-02T22:00:00', null]
] as const

const seedActivities = async (createdBy: number): Promise<void> => {
  const opensAt = atWib('2026-01-01T00:00:00')
  const closesAt = atWib('2026-12-31T23:59:00')

  for (const [type, title, slug, description, organizer, location, startsAt, endsAt, image] of initialActivities) {
    const existing = await db.activity.findUnique({ where: { slug }, select: { id: true } })
    if (existing) continue

    await db.activity.create({ data: {
      type,
      title,
      organizer,
      slug,
      description,
      image,
      displayOrder: initialActivities.indexOf(initialActivities.find(item => item[2] === slug)!),
      location,
      startsAt: atWib(startsAt),
      endsAt: atWib(endsAt),
      registrationOpensAt: opensAt,
      registrationClosesAt: closesAt,
      registrationMode: 'INDIVIDUAL',
      quotaMode: 'REGISTRATION',
      capacity: null,
      minTeamMembers: null,
      maxTeamMembers: null,
      registrationFields: type === 'LOMBA' ? defaultRegistrationFields() : [],
      status: 'PUBLISHED',
      createdBy
    } })
  }
}

seedAdmin()
  .then(adminId => seedActivities(adminId))
  .catch((error: unknown) => {
    if (error instanceof Error) {
      console.error(`Seed gagal: ${error.message}`)
    } else {
      console.error('Seed gagal karena error yang tidak dikenali.')
    }
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
