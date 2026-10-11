import 'dotenv/config'
import { hash } from '@node-rs/argon2'
import { db } from '../server/database/client'

const baseUrl = process.env.HSN_SMOKE_BASE_URL ?? 'http://127.0.0.1:3100'
const token = `smoke${Date.now()}`
const adminEmail = `${token}-admin@example.invalid`
const operatorEmail = `${token}-operator@example.invalid`
const password = 'Smoke-Postgres-2026!'
const activitySlug = `${token}-lomba`
const privateActivitySlug = `${token}-private`
const teamActivitySlug = `${token}-team`
const eventActivitySlug = `${token}-event`

type RequestOptions = { readonly method?: string; readonly body?: unknown; readonly cookie?: string }
type ApiResult<T> = { readonly status: number; readonly body: T; readonly cookie: string | null }

const request = async <T>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> => {
  const headers: Record<string, string> = { origin: baseUrl }
  if (options.body !== undefined) headers['content-type'] = 'application/json'
  if (options.cookie) headers.cookie = options.cookie
  const response = await fetch(new URL(path, baseUrl), {
    method: options.method ?? 'GET',
    headers,
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {})
  })
  const body = await response.json() as T
  return { status: response.status, body, cookie: response.headers.get('set-cookie')?.split(';', 1)[0] ?? null }
}

const expectStatus = <T>(result: ApiResult<T>, status: number, scenario: string): ApiResult<T> => {
  if (result.status !== status) throw new Error(`${scenario}: mengharapkan HTTP ${status}, menerima ${result.status}.`)
  console.info(`PASS ${scenario}`)
  return result
}

const expectPass = (condition: boolean, scenario: string): void => {
  if (!condition) throw new Error(`${scenario}: hasil tidak sesuai.`)
  console.info(`PASS ${scenario}`)
}

const login = async (email: string, passwordValue = password): Promise<string> => {
  const result = expectStatus(await request<{ user: { id: number } }>('/api/auth/login', {
    method: 'POST', body: { email, password: passwordValue }
  }), 200, `login ${email.endsWith('-admin@example.invalid') ? 'super admin' : 'operator'}`)
  if (!result.cookie) throw new Error('Login berhasil tetapi cookie session tidak dikirim.')
  return result.cookie
}

const main = async (): Promise<void> => {
  let adminCookie: string | null = null
  let operatorCookie: string | null = null
  let adminId: number | null = null
  let operatorId: number | null = null
  let activityId: number | null = null
  let privateActivityId: number | null = null
  let teamActivityId: number | null = null
  let eventActivityId: number | null = null

  try {
    const admin = await db.user.create({ data: {
      name: 'Smoke Test Super Admin',
      email: adminEmail,
      passwordHash: await hash(password),
      role: 'SUPER_ADMIN'
    } })
    adminId = admin.id

    const publicActivities = expectStatus(await request<{ activities: unknown[] }>('/api/public/activities'), 200, 'katalog publik')
    expectPass(Array.isArray(publicActivities.body.activities), 'katalog publik')

    expectStatus(await request('/api/auth/login', {
      method: 'POST', body: { email: adminEmail, password: 'password-salah' }
    }), 401, 'tolak password salah')
    adminCookie = await login(adminEmail)
    expectStatus(await request('/api/auth/session', { cookie: adminCookie }), 200, 'session super admin')

    const createdOperator = expectStatus(await request<{ user: { id: number } }>('/api/admin/users', {
      method: 'POST', cookie: adminCookie,
      body: { name: 'Smoke Test Operator', email: operatorEmail, password, role: 'OPERATOR' }
    }), 200, 'buat operator')
    operatorId = createdOperator.body.user.id
    expectStatus(await request(`/api/admin/users/${operatorId}`, {
      method: 'PATCH', cookie: adminCookie, body: { name: 'Smoke Test Operator Diperbarui' }
    }), 200, 'ubah data operator')

    const now = Date.now()
    const activityInput = {
      type: 'LOMBA', title: 'Smoke Test Lomba', organizer: 'QA Sementara', slug: activitySlug,
      description: 'Data uji sementara', image: null, imageZoom: 1, imagePosition: 'right center',
      displayOrder: 9999, location: 'Trenggalek',
      startsAt: new Date(now + 2 * 60 * 60 * 1000).toISOString(),
      endsAt: new Date(now + 4 * 60 * 60 * 1000).toISOString(),
      registrationOpensAt: new Date(now - 60 * 60 * 1000).toISOString(),
      registrationClosesAt: new Date(now + 60 * 60 * 1000).toISOString(),
      registrationMode: 'INDIVIDUAL', quotaMode: 'REGISTRATION', capacity: 2,
      minTeamMembers: null, maxTeamMembers: null, registrationFields: [], status: 'PUBLISHED'
    }
    const createdActivity = expectStatus(await request<{ activity: { id: number } }>('/api/admin/activities', {
      method: 'POST', cookie: adminCookie, body: activityInput
    }), 200, 'buat kegiatan')
    activityId = createdActivity.body.activity.id
    expectStatus(await request(`/api/admin/activities/${activityId}`, {
      method: 'PATCH', cookie: adminCookie, body: { description: 'Deskripsi diperbarui melalui API.' }
    }), 200, 'ubah kegiatan')

    const privateActivity = expectStatus(await request<{ activity: { id: number } }>('/api/admin/activities', {
      method: 'POST', cookie: adminCookie,
      body: { ...activityInput, title: 'Smoke Test Draft', slug: privateActivitySlug, status: 'DRAFT' }
    }), 200, 'buat kegiatan privat')
    privateActivityId = privateActivity.body.activity.id

    expectStatus(await request(`/api/admin/activities/${activityId}/operators`, {
      method: 'PUT', cookie: adminCookie, body: { userIds: [operatorId] }
    }), 200, 'tugaskan operator')

    const teamActivity = expectStatus(await request<{ activity: { id: number } }>('/api/admin/activities', {
      method: 'POST', cookie: adminCookie,
      body: {
        ...activityInput, title: 'Smoke Test Tim', slug: teamActivitySlug,
        registrationMode: 'TEAM', quotaMode: 'PERSON', capacity: 2,
        minTeamMembers: 2, maxTeamMembers: 3
      }
    }), 200, 'buat kegiatan pendaftaran tim')
    teamActivityId = teamActivity.body.activity.id

    const eventActivity = expectStatus(await request<{ activity: { id: number } }>('/api/admin/activities', {
      method: 'POST', cookie: adminCookie,
      body: { ...activityInput, type: 'EVENT', title: 'Smoke Test Event', slug: eventActivitySlug }
    }), 200, 'buat event tanpa pendaftaran')
    eventActivityId = eventActivity.body.activity.id

    const publicActivity = expectStatus(await request<{ activity: { slug: string; registrationState: string } }>(`/api/public/activities/${activitySlug}`), 200, 'detail kegiatan publik')
    expectPass(publicActivity.body.activity.slug === activitySlug && publicActivity.body.activity.registrationState === 'OPEN', 'kegiatan pendaftaran terbuka')

    operatorCookie = await login(operatorEmail)
    const operatorActivities = expectStatus(await request<{ activities: Array<{ id: number }> }>('/api/admin/activities', { cookie: operatorCookie }), 200, 'daftar kegiatan operator')
    expectPass(operatorActivities.body.activities.some(activity => activity.id === activityId), 'operator melihat kegiatan yang ditugaskan')
    expectStatus(await request(`/api/admin/activities/${privateActivityId}`, { cookie: operatorCookie }), 403, 'otorisasi menolak kegiatan yang tidak ditugaskan')
    expectStatus(await request('/api/public/activities/' + eventActivitySlug + '/register', {
      method: 'POST', body: {}
    }), 422, 'tolak pendaftaran pada event')

    expectStatus(await request(`/api/admin/users/${operatorId}/reset-password`, {
      method: 'POST', cookie: adminCookie, body: { password: 'Smoke-Operator-2026-New!' }
    }), 200, 'reset password operator')
    operatorCookie = await login(operatorEmail, 'Smoke-Operator-2026-New!')

    const register = async (name: string, email: string, phone: string) => expectStatus(await request<{ code: string }>('/api/public/activities/' + activitySlug + '/register', {
      method: 'POST',
      body: { registrantName: name, email, phone, participantCount: 1, answers: {}, members: [] }
    }), 200, `pendaftaran ${name}`)

    const firstRegistration = await register('Smoke Peserta Satu', `${token}-one@example.invalid`, '081234567801')
    expectStatus(await request('/api/public/activities/' + activitySlug + '/register', {
      method: 'POST', body: { registrantName: 'Smoke Duplikat', email: `${token}-one@example.invalid`, phone: '081234567899', participantCount: 1, answers: {}, members: [] }
    }), 409, 'tolak email duplikat')
    await register('Smoke Peserta Dua', `${token}-two@example.invalid`, '081234567802')
    expectStatus(await request('/api/public/activities/' + activitySlug + '/register', {
      method: 'POST', body: { registrantName: 'Smoke Peserta Tiga', email: `${token}-three@example.invalid`, phone: '081234567803', participantCount: 1, answers: {}, members: [] }
    }), 409, 'tolak pendaftaran saat kuota penuh')

    const registrations = expectStatus(await request<{ registrations: Array<{ id: number; code: string; status: string }> }>(`/api/admin/activities/${activityId}/registrations`, { cookie: operatorCookie }), 200, 'daftar pendaftar operator')
    const first = registrations.body.registrations.find(registration => registration.code === firstRegistration.body.code)
    if (!first) throw new Error('Pendaftar pertama tidak ditemukan pada daftar operator.')

    expectStatus(await request(`/api/admin/registrations/${first.id}`, {
      method: 'PATCH', cookie: operatorCookie, body: { status: 'REJECTED' }
    }), 200, 'ubah status menjadi ditolak')
    const afterReleasedQuota = await register('Smoke Peserta Tiga', `${token}-three@example.invalid`, '081234567803')
    expectPass(Boolean(afterReleasedQuota.body.code), 'kuota kembali tersedia setelah penolakan')

    expectStatus(await request(`/api/admin/registrations/${first.id}`, {
      method: 'PATCH', cookie: operatorCookie, body: { status: 'VERIFIED' }
    }), 409, 'kuota membatasi aktivasi ulang')

    const teamRegistration = expectStatus(await request<{ code: string }>('/api/public/activities/' + teamActivitySlug + '/register', {
      method: 'POST', body: {
        registrantName: 'Ketua Smoke', email: `${token}-team@example.invalid`, phone: '081234567804',
        teamName: 'Tim Smoke', participantCount: 2, answers: {},
        members: [{ name: 'Anggota Satu' }, { name: 'Anggota Dua' }]
      }
    }), 200, 'buat pendaftaran tim')
    const teamRow = await db.registration.findUnique({ where: { code: teamRegistration.body.code }, select: { id: true } })
    if (!teamRow) throw new Error('Pendaftaran tim tidak ditemukan setelah dibuat.')
    const teamDetails = expectStatus(await request<{ members: Array<{ name: string }> }>(`/api/admin/registrations/${teamRow.id}`, { cookie: adminCookie }), 200, 'detail pendaftaran tim')
    expectPass(teamDetails.body.members.length === 2, 'anggota tim tersimpan')
    expectStatus(await request('/api/public/activities/' + teamActivitySlug + '/register', {
      method: 'POST', body: {
        registrantName: 'Tim Tidak Valid', email: `${token}-bad-team@example.invalid`, phone: '081234567805',
        teamName: 'Tim Tidak Valid', participantCount: 2, answers: {}, members: [{ name: 'Satu Anggota' }]
      }
    }), 400, 'tolak jumlah anggota tim yang tidak sesuai')

    const confirmation = expectStatus(await request<{ registration: { status: string } }>(`/api/public/registrations/${firstRegistration.body.code}`), 200, 'konfirmasi pendaftaran publik')
    expectPass(confirmation.body.registration.status === 'REJECTED', 'status pendaftaran tampil pada konfirmasi publik')

    const dashboard = expectStatus(await request<{ activities: { total: number }; registrations: { total: number } }>('/api/admin/dashboard', { cookie: adminCookie }), 200, 'dashboard admin')
    expectPass(dashboard.body.activities.total >= 2 && dashboard.body.registrations.total >= 2, 'ringkasan dashboard berisi data')

    expectStatus(await request(`/api/admin/registrations/${first.id}`, { method: 'DELETE', cookie: operatorCookie }), 200, 'hapus pendaftaran')
    expectStatus(await request(`/api/admin/activities/${activityId}`, { method: 'DELETE', cookie: adminCookie }), 200, 'hapus kegiatan uji dan relasinya')
    activityId = null
    expectStatus(await request(`/api/admin/activities/${privateActivityId}`, { method: 'DELETE', cookie: adminCookie }), 200, 'hapus kegiatan privat uji')
    privateActivityId = null
    expectStatus(await request(`/api/admin/activities/${teamActivityId}`, { method: 'DELETE', cookie: adminCookie }), 200, 'hapus kegiatan tim uji')
    teamActivityId = null
    expectStatus(await request(`/api/admin/activities/${eventActivityId}`, { method: 'DELETE', cookie: adminCookie }), 200, 'hapus event uji')
    eventActivityId = null
    expectStatus(await request(`/api/admin/users/${operatorId}`, { method: 'DELETE', cookie: adminCookie }), 200, 'hapus operator uji')
    operatorId = null
  } finally {
    await db.$transaction(async transaction => {
      const activities = await transaction.activity.findMany({ where: { slug: { startsWith: token } }, select: { id: true } })
      const activityIds = activities.map(activity => activity.id)
      if (activityIds.length > 0) {
        await transaction.registration.deleteMany({ where: { activityId: { in: activityIds } } })
        await transaction.activityUser.deleteMany({ where: { activityId: { in: activityIds } } })
        await transaction.activity.deleteMany({ where: { id: { in: activityIds } } })
      }
      await transaction.loginAttempt.deleteMany({ where: { email: { in: [adminEmail, operatorEmail] } } })
      await transaction.user.deleteMany({ where: { email: { in: [adminEmail, operatorEmail] } } })
    })
    await db.$disconnect()
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? `Smoke test gagal: ${error.message}` : 'Smoke test gagal karena error yang tidak dikenali.')
  process.exitCode = 1
})
