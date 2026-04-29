import { supabase } from '@/lib/supabase'

export const loginWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'https://avalialaudo.vercel.app'
    }
  })

  if (error) console.log(error)
}
