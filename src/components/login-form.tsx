"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function LoginForm() {
  const router = useRouter()
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
      // Aqui você adicionaria a lógica de autenticação real
      // Simulando um login para demonstração
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Redirecionar para o dashboard após login bem-sucedido
      router.push("/dashboard")
    } catch (err) {
      setError("Falha na autenticação. Verifique suas credenciais.")
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
    } catch (err) {
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

