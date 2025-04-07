"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getUserByUsername } from "@/lib/services/users-service"
import { verifyPassword } from "@/lib/password-utils"
import { setSessionCookie } from "@/lib/auth"

export function LoginForm() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  // const [resendingPassword, setResendingPassword] = useState(false)
  // const [resendMessage, setResendMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!username || !password) {
      setError("Por favor, preencha todos os campos")
      return
    }

    try {
      setLoading(true)

      const user = await getUserByUsername(username)

      // Comparar a senha com o hash armazenado
      const isPasswordValid = await verifyPassword(password, user.user_senha)
      if (!isPasswordValid) {
        setError("Credenciais inválidas. Tente novamente.")
        return
      }
      // Armazenar informações da sessão
      const session = {
        userId: user.id,
        username: user.user_user,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 dias
      }

      // Armazenar sessão nos cookies
      await setSessionCookie(JSON.stringify(session))

      // Redirecionar para o dashboard após login bem-sucedido
      router.push("/dashboard")
    } catch (err) {
      console.error(err)
      setError("Falha na autenticação. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  // const handleResendPassword = async () => {
  //   if (!username) {
  //     setError("Por favor, informe seu nome de usuário para receber a senha")
  //     return
  //   }

  //   try {
  //     setResendingPassword(true)
  //     setResendMessage("")
  //     // Aqui você adicionaria a lógica real para reenviar a senha
  //     // Simulando um reenvio para demonstração
  //     await new Promise((resolve) => setTimeout(resolve, 1000))
  //     setResendMessage("Senha reenviada com sucesso! Verifique seu email cadastrado.")
  //   } catch (_err) {
  //     console.error(_err)
  //     setError("Falha ao reenviar a senha. Tente novamente.")
  //   } finally {
  //     setResendingPassword(false)
  //   }
  // }

  return (
    <Card className="w-full dark:bg-zinc-900 dark:border-zinc-800">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Truck className="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl text-center dark:text-white">TransWilson</CardTitle>
        <CardDescription className="text-center dark:text-zinc-400">
          Entre com suas credenciais para acessar o sistema
        </CardDescription>
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
              <Label htmlFor="username" className="dark:text-white">
                Usuário
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="dark:text-white">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
