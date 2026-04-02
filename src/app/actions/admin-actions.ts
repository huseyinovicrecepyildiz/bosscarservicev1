'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function createAdminUser(formData: FormData) {
  const userId = formData.get('userId') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as string

  if (!userId || !password || password.length < 6) {
    return { error: 'Geçersiz ID veya 6 karakterden kısa şifre.' }
  }

  // Generate a dummy email and format
  const dummyEmail = `${userId.trim().toLowerCase()}@bosscar.local`

  try {
    // 1. Create Identity using Admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: dummyEmail,
      password: password,
      email_confirm: true,
      user_metadata: { local_id: userId }
    })

    if (authError) throw authError

    // 2. Wait a moment for the PostgreSQL trigger to finish executing (which inserts into `profiles`)
    // Because it's asynchronous on the DB level sometimes, though usually synchronous in the transaction.
    // 3. Force update their role in profiles table to match the selected role.
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ role: role })
      .eq('id', authData.user.id)

    if (profileError) {
      console.error('Profile update issue:', profileError)
      // Non-fatal if the trigger successfully set it to 'personel' at least.
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error creating user:', error)
    return { error: error.message || 'Kullanıcı oluşturulurken bir hata meydana geldi.' }
  }
}
