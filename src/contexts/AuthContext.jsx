import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

// Dev-only escape hatch. Set VITE_DEV_AUTOLOGIN=true in .env.local to skip
// the login screen and run as a fake admin user when developing with
// `npm run dev`. import.meta.env.DEV is automatically false in production
// builds (npm run build), so this can never leak to live users.
const DEV_AUTOLOGIN =
  import.meta.env.DEV && import.meta.env.VITE_DEV_AUTOLOGIN === 'true'

const DEV_FAKE_USER = DEV_AUTOLOGIN
  ? { id: 'dev-local-user', email: 'dev@local.test' }
  : null

export const IS_DEV_AUTOLOGIN = DEV_AUTOLOGIN

export function AuthProvider({ children }) {
  const [user, setUser] = useState(DEV_FAKE_USER)
  const [authLoading, setAuthLoading] = useState(!DEV_AUTOLOGIN)

  useEffect(() => {
    // Dev autologin: skip Supabase entirely.
    if (DEV_AUTOLOGIN) return

    // Restore existing session on mount.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })

    // Keep state in sync with Supabase auth events (sign in, sign out, token
    // refresh, etc.) that happen in other tabs or after OAuth redirects.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    return data
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  // Sends a password-reset email. Supabase opens our /reset-password page
  // after the user clicks the link in the email — that page then calls
  // updatePassword() below.
  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  }

  // Called from the /reset-password page once the recovery session is active.
  async function updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{
      user, authLoading, signUp, signIn, signOut, resetPassword, updatePassword
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
