"use client"

import type React from "react"
import bcrypt from "bcryptjs"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { setSessionCookie } from "@/lib/auth"

export function LoginForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [resendingPassword, setResendingPassword] = useState(false)
  const [resendMessage, setResendMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!username || !password) {
      setError("Por favor, preencha todos os campos")
      return
    }

    try {
      setLoading(true)

      // Consultar o Supabase para verificar as credenciais
      const { data, error } = await supabase
        .from("users")
        .select("id, user_user, user_senha, user_ativo, user_email")
        .eq("user_user", username)
        .single()

        if (error || !data) {
        setError("Credenciais inválidas. Tente novamente.")
        return
      }

      // Verificar se o usuário está ativo
      if (!data.user_ativo) {
        setError("Usuário inativo. Entre em contato com o administrador.")
        return
      }

      // Comparar a senha (assumindo que você está armazenando senhas como hash)
      const isPasswordValid = await verifyPassword(password, data.user_senha)
      if (!isPasswordValid) {
        setError("Credenciais inválidas. Tente novamente.")
        return
      }

      // TODO
      // Criar sessão com Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data?.user_email, // Fallback se não tiver email
        password: password
      })

      if (authError) {
        // console.error("Erro na autenticação com Supabase:", authError)
        // Se falhar a autenticação com Supabase Auth, ainda podemos prosseguir com nossa própria sessão
        // Isso é útil durante a migração para o sistema de auth do Supabase
      }

      // Armazenar informações da sessão
      const session = {
        userId: data.id,
        username: data.user_user,
        token: authData?.session?.access_token || `session-${Date.now()}`,
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 dias
      }

      // Armazenar sessão nos cookies
      await setSessionCookie(JSON.stringify(session))

      // Redirecionar para o dashboard após login bem-sucedido
      router.push('/dashboard')
    } catch (err) {
      console.error(err)
      setError("Falha na autenticação. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleResendPassword = async () => {
    if (!username) {
      setError("Por favor, informe seu nome de usuário para receber a senha")
      return
    }

    try {
      setResendingPassword(true)
      setResendMessage("")
      // Aqui você adicionaria a lógica real para reenviar a senha
      // Simulando um reenvio para demonstração
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setResendMessage("Senha reenviada com sucesso! Verifique seu email cadastrado.")
    } catch (_err) {
      console.error(_err)
      setError("Falha ao reenviar a senha. Tente novamente.")
    } finally {
      setResendingPassword(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Truck className="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl text-center">TransWilson</CardTitle>
        <CardDescription className="text-center">Entre com suas credenciais para acessar o sistema</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        {resendMessage && (
          <Alert className="bg-green-50 text-green-800 border-green-200">
            <AlertDescription>{resendMessage}</AlertDescription>
          </Alert>
        )}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleResendPassword}
          disabled={resendingPassword}
        >
          {resendingPassword ? "Reenviando..." : "Reenviar senha para o email"}
        </Button>
      </CardFooter>
    </Card>
  )
}

// Função para verificar a senha (exemplo com bcrypt)
async function verifyPassword(inputPassword: string, storedHash: Uint8Array): Promise<boolean> {
  return bcrypt.compare(inputPassword, storedHash.toString())
}

