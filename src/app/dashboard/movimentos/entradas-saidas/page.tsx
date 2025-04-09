import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { EntradasSaidasTable } from "@/components/entradas-saidas/entradas-saidas-table"

export const metadata: Metadata = {
  title: "Entradas e Saídas - Sistema de Fretagem",
  description: "Gerenciamento de entradas e saídas financeiras do sistema de fretagem",
}

export default function EntradasSaidasPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Entradas e Saídas</h1>
          <p className="text-muted-foreground">Gerencie os movimentos financeiros do sistema.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/movimentos/despesas/novo">
              <Plus className="mr-2 h-4 w-4" /> Nova Despesa
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/movimentos/entradas/novo">
              <Plus className="mr-2 h-4 w-4" /> Nova Entrada
            </Link>
          </Button>
        </div>
      </div>

      <EntradasSaidasTable />
    </div>
  )
}
