import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { Logger } from "./lib/logger"

// Constantes
const TOKEN_COOKIE_NAME = "trans_wilson_session"

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

    // Verificar rotas específicas de motoristas (se necessário)
    // const isDriverSpecificRoute = request.nextUrl.pathname.match(/\/dashboard\/motoristas\/(\d+)/)
    // if (isDriverSpecificRoute) {
    //   const motoristaId = parseInt(isDriverSpecificRoute[1])
    //   if (session.userType !== 'admin' && session.id !== motoristaId) {
    //     // Redirecionar para dashboard se não for admin ou o próprio motorista
    //     const url = new URL("/dashboard", request.url)
    //     return NextResponse.redirect(url)
    //   }
    // }

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
