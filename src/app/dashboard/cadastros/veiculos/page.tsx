import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { VeiculosTable } from "@/components/veiculos/veiculos-table"

export const metadata: Metadata = {
  title: "Veículos - Sistema de Fretagem",
  description: "Gerenciamento de veículos do sistema de fretagem",
}

export default function VeiculosPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Veículos</h1>
          <p className="text-muted-foreground">Gerencie os veículos cadastrados no sistema.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/cadastros/veiculos/novo">
            <Plus className="mr-2 h-4 w-4" /> Novo Veículo
          </Link>
        </Button>
      </div>

      <VeiculosTable />
    </div>
  )
}
