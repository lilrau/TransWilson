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
import { authenticateUser, setSessionCookie, type UserType } from "@/lib/auth"

export function LoginForm() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [userType, setUserType] = useState<UserType>("driver")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!username || !password) {
      setError("Por favor, preencha todos os campos")
      return
    }

    try {
      setLoading(true)

      // Autenticar usuário com base no tipo selecionado
      const session = await authenticateUser(username, password, userType)

      if (!session) {
        setError("Credenciais inválidas. Tente novamente.")
        return
      }

      // Armazenar sessão nos cookies
      await setSessionCookie(session)

      // Redirecionar para o dashboard após login bem-sucedido
      router.push("/dashboard")
    } catch (err) {
      console.error(err)
      setError("Falha na autenticação. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

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
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userType" className="dark:text-white">
                  Tipo de Usuário
                </Label>
                <select
                  id="userType"
                  value={userType}
                  onChange={(e) => setUserType(e.target.value as UserType)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white mt-2"
                >
                  <option value="admin">Administrador</option>
                  <option value="driver">Motorista</option>
                </select>
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="username" className="dark:text-white">
                  {userType === "admin" ? "Usuário" : "CNH"}
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-white mt-2"
                />
              </div>
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
