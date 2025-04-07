import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { DespesasTable } from "@/components/despesas/despesas-table"

export const metadata: Metadata = {
  title: "Despesas - Sistema de Fretagem",
  description: "Gerenciamento de despesas do sistema de fretagem",
}

export default function DespesasPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Despesas</h1>
          <p className="text-muted-foreground">Gerencie as despesas cadastradas no sistema.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/cadastros/despesas/novo">
            <Plus className="mr-2 h-4 w-4" /> Nova Despesa
          </Link>
        </Button>
      </div>

      <DespesasTable />
    </div>
  )
}