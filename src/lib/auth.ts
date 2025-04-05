"use server"

import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

// Constantes para gerenciamento de sessão
const TOKEN_COOKIE_NAME = "trans_wilson_session"
const SESSION_EXPIRY = 60 * 60 * 24 * 7 // 7 dias em segundos

// Inicializa o cliente Supabase com cookies para autenticação persistente
export const createServerSupabaseClient = async () => {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: {
        getItem: (key: string) => {
          const cookie = cookieStore.get(key)
          return cookie?.value || null
        },
        setItem: () => {},
        removeItem: () => {},
      },
    },
  })
}

// Verifica se o usuário está autenticado
export async function isAuthenticated() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(TOKEN_COOKIE_NAME)

  if (!sessionCookie) {
    return false
  }

  // TODO
  return true
}

// Obtém os dados do usuário atual
export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.auth.getUser()
  return data.user
}

// Define o token de sessão nos cookies
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_EXPIRY,
    path: "/",
    sameSite: "strict",
  })
}

// Remove o token de sessão dos cookies
export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(TOKEN_COOKIE_NAME)
}
