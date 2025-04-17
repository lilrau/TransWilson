"use server"

import { cookies } from "next/headers"
import { verifyPassword } from "./password-utils"
import { getUserByUsername } from "./services/users-service"
import { getMotoristaByCredentials } from "./services/motorista-service"
import { Logger } from "./logger"

// Constantes para gerenciamento de sessão
const TOKEN_COOKIE_NAME = "trans_wilson_session"
const SESSION_EXPIRY = 60 * 60 * 24 * 7 // 7 dias em segundos

// Tipos de usuário para autenticação
export type UserType = "admin" | "driver"

// Interface para dados da sessão
export interface SessionData {
  id: number
  username: string
  userType: UserType
  expiresAt: number
}

// Verifica se o usuário está autenticado
export async function isAuthenticated() {
  try {
    const session = await getSessionData()
    if (!session) return false

    // Verifica se a sessão não expirou
    return Date.now() < session.expiresAt
  } catch (error) {
    Logger.error("auth", "Erro ao verificar autenticação", { error })
    return false
  }
}

// Obtém os dados da sessão atual
export async function getSessionData(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(TOKEN_COOKIE_NAME)

    if (!sessionCookie) {
      return null
    }

    const session: SessionData = JSON.parse(sessionCookie.value)
    return session
  } catch (error) {
    Logger.error("auth", "Erro ao obter dados da sessão", { error })
    return null
  }
}

// Define o token de sessão nos cookies
export async function setSessionCookie(sessionData: SessionData) {
  try {
    const cookieStore = await cookies()
    cookieStore.set(TOKEN_COOKIE_NAME, JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_EXPIRY,
      path: "/",
      sameSite: "strict",
    })

    Logger.info("auth", "Sessão criada com sucesso", {
      userId: sessionData.id,
      userType: sessionData.userType,
    })

    return true
  } catch (error) {
    Logger.error("auth", "Erro ao definir cookie de sessão", { error })
    return false
  }
}

// Remove o token de sessão dos cookies
export async function clearSessionCookie() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete(TOKEN_COOKIE_NAME)
    Logger.info("auth", "Sessão encerrada com sucesso")
    return true
  } catch (error) {
    Logger.error("auth", "Erro ao limpar cookie de sessão", { error })
    return false
  }
}

// Função para autenticar usuário (admin ou motorista)
export async function authenticateUser(
  identifier: string,
  password: string,
  userType: UserType,
): Promise<SessionData | null> {
  try {
    // Autenticação de administrador
    if (userType === "admin") {
      const user = await getUserByUsername(identifier)

      if (!user || !user.user_senha) {
        Logger.warn("auth", "Tentativa de login com usuário admin inválido", { username: identifier })
        return null
      }

      const isPasswordValid = await verifyPassword(password, user.user_senha)

      if (!isPasswordValid) {
        Logger.warn("auth", "Senha inválida para usuário admin", { username: identifier })
        return null
      }

      // Usuário autenticado com sucesso
      const session: SessionData = {
        id: user.id,
        username: user.user_user,
        userType: "admin",
        expiresAt: Date.now() + SESSION_EXPIRY * 1000,
      }

      Logger.info("auth", "Login de administrador bem-sucedido", { userId: user.id })
      return session
    }
    // Autenticação de motorista
    else if (userType === "driver") {
      const motorista = await getMotoristaByCredentials(identifier)

      if (!motorista || !motorista.motorista_senha) {
        Logger.warn("auth", "Tentativa de login com CNH de motorista inválida", { cnh: identifier })
        return null
      }

      const isPasswordValid = await verifyPassword(password, motorista.motorista_senha)

      if (!isPasswordValid) {
        Logger.warn("auth", "Senha inválida para motorista", { cnh: identifier })
        return null
      }

      // Motorista autenticado com sucesso
      const session: SessionData = {
        id: motorista.id,
        username: motorista.motorista_nome,
        userType: "driver",
        expiresAt: Date.now() + SESSION_EXPIRY * 1000,
      }

      Logger.info("auth", "Login de motorista bem-sucedido", { motoristaId: motorista.id })
      return session
    }

    return null
  } catch (error) {
    Logger.error("auth", "Erro durante autenticação", { error, userType })
    return null
  }
}

// Verifica se o usuário atual tem permissão de administrador
export async function isAdmin(): Promise<boolean> {
  const session = await getSessionData()
  return session?.userType === "admin"
}

// Verifica se o usuário atual é um motorista específico
export async function isMotorista(motoristaId?: number): Promise<boolean> {
  const session = await getSessionData()

  if (!session || session.userType !== "driver") {
    return false
  }

  // Se não especificar ID, apenas verifica se é qualquer motorista
  if (!motoristaId) {
    return true
  }

  // Verifica se é o motorista específico
  return session.id === motoristaId
}
