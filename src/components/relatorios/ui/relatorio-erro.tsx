"use client"

import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface RelatorioErroProps {
  titulo?: string
  mensagem: string
  onRetry?: () => void
}

export function RelatorioErro({
  titulo = "Erro ao carregar dados",
  mensagem,
  onRetry,
}: RelatorioErroProps) {
  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{titulo}</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <p>{mensagem}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="w-fit mt-2">
            Tentar novamente
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
