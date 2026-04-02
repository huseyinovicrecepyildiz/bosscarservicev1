'use server'

import PocketBase from 'pocketbase'
import { cookies } from 'next/headers'

export async function createAdminUser(formData: FormData) {
  const userId = formData.get('userId') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as string

  if (!userId || !password || password.length < 6) {
    return { error: 'Geçersiz ID veya 6 karakterden kısa şifre.' }
  }

  const dummyEmail = `${userId.trim().toLowerCase()}@bosscar.local`

  const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090'
  const pb = new PocketBase(pbUrl)
  
  // Apply current auth to pass security rules
  const cookieStore = cookies()
  const token = cookieStore.get('pb_auth')?.value
  if (token) pb.authStore.loadFromCookie(`pb_auth=${token}`)

  try {
    await pb.collection('users').create({
      email: dummyEmail,
      password: password,
      passwordConfirm: password,
      role: role,
      verified: true,
    })

    return { success: true }
  } catch (error: any) {
    console.error('Error creating user:', error)
    return { error: error.message || 'Kullanıcı oluşturulurken bir hata meydana geldi.' }
  }
}
