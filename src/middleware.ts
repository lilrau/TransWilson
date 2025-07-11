import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { Logger } from "./lib/logger"

// Constantes
const TOKEN_COOKIE_NAME = "trans_wilson_session"

// Rotas permitidas para motoristas
const DRIVER_ALLOWED_ROUTES = [
  "/dashboard/motorista",
  "/dashboard/movimentos/criar-frete",
  "/dashboard/movimentos/despesas",
  "/dashboard/movimentos/caixa",
]

// Middleware para verificar autenticação
export async function middleware(request: NextRequest) {
  // Verificar se o cookie de sessão existe
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(TOKEN_COOKIE_NAME)

  if (!sessionCookie) {
    // Redirecionar para a página de login
    const url = new URL("/", request.url)
    return NextResponse.redirect(url)
  }

  try {
    // Verificar se o cookie contém dados válidos
    const session = JSON.parse(sessionCookie.value)

    // Verificar se a sessão não expirou
    if (!session.expiresAt || Date.now() > session.expiresAt) {
      // Sessão expirada, redirecionar para login
      const url = new URL("/", request.url)
      return NextResponse.redirect(url)
    }

    // Verificar rotas restritas a administradores
    const isAdminRoute = request.nextUrl.pathname.startsWith("/dashboard/cadastros/users")
    if (isAdminRoute && session.userType !== "admin") {
      // Redirecionar para dashboard se não for admin tentando acessar rota de admin
      const url = new URL("/dashboard", request.url)
      return NextResponse.redirect(url)
    }

    // Se for motorista, verifica se a rota é permitida
    if (session.userType === "driver") {
      const isAllowedRoute = DRIVER_ALLOWED_ROUTES.some(
        (route) =>
          request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(`${route}/`)
      )

      if (!isAllowedRoute) {
        return NextResponse.redirect(new URL("/dashboard/motorista", request.url))
      }
    }

    // Autenticação válida, continuar
    return NextResponse.next()
  } catch (error) {
    Logger.error("middleware", `Unexpected error while verifying authentication: ${error}	`)

    const url = new URL("/", request.url)
    return NextResponse.redirect(url)
  }
}

// Configuração para aplicar o middleware apenas nas rotas do dashboard
export const config = {
  matcher: ["/dashboard/:path*"],
}
