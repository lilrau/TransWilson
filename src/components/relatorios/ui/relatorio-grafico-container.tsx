import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface RelatorioGraficoContainerProps {
  titulo: string
  descricao?: string
  loading?: boolean
  altura?: number
  children: React.ReactNode
}

export function RelatorioGraficoContainer({
  titulo,
  descricao,
  loading = false,
  altura = 300,
  children,
}: RelatorioGraficoContainerProps) {
  return (
    <Card className="dark:bg-zinc-900 dark:border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">{titulo}</CardTitle>
        {descricao && <CardDescription>{descricao}</CardDescription>}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="w-full" style={{ height: `${altura}px` }} />
        ) : (
          <div style={{ width: "100%", height: `${altura}px` }}>{children}</div>
        )}
      </CardContent>
    </Card>
  )
}
