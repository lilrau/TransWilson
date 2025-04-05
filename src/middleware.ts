import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { isAuthenticated } from "@/lib/auth"

// Middleware para verificar autenticação
export async function middleware(request: NextRequest) {
  // TODO: remover isso depois
  return NextResponse.next()
  // Verifica se o usuário está autenticado usando a função do auth.ts
  const authenticated = await isAuthenticated()

  // Se não estiver autenticado, redireciona para a página de login
  if (!authenticated) {
    const url = new URL("/", request.url)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

// Configuração para aplicar o middleware apenas nas rotas do dashboard
export const config = {
  matcher: ["/dashboard/:path*"],
}
