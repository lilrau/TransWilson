import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isAuthenticated } from '@/lib/auth'

// Rotas que requerem autenticação
const PROTECTED_ROUTES = [
  '/dashboard',
  '/dashboard/cadastros',
  '/dashboard/fretes',
  '/dashboard/relatorios',
]

// Middleware para verificar autenticação
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Verifica se a rota atual precisa de autenticação
  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  )
  
  if (!isProtectedRoute) {
    return NextResponse.next()
  }
  
  // Verifica se o usuário está autenticado usando a função do auth.ts
  const authenticated = await isAuthenticated()
  
  // Se não estiver autenticado, redireciona para a página de login
  if (!authenticated) {
    const url = new URL('/', request.url)
    return NextResponse.redirect(url)
  }
  
  return NextResponse.next()
}

// Configuração para aplicar o middleware apenas nas rotas especificadas
export const config = {
  matcher: [
    '/dashboard/:path*',
  ],
}