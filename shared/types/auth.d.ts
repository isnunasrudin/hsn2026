declare module '#auth-utils' {
  interface User {
    id: number
    name: string
    email: string
    role: 'SUPER_ADMIN' | 'OPERATOR'
  }
}

export {}
