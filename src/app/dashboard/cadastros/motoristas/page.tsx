import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { MotoristasTable } from "@/components/motoristas/motoristas-table"

export const metadata: Metadata = {
  title: "Motoristas - Sistema de Fretagem",
  description: "Gerenciamento de motoristas do sistema de fretagem",
}

export default function MotoristasPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Motoristas</h1>
          <p className="text-muted-foreground">Gerencie os motoristas cadastrados no sistema.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/cadastros/motoristas/novo">
            <Plus className="mr-2 h-4 w-4" /> Novo Motorista
          </Link>
        </Button>
      </div>

      <MotoristasTable />
    </div>
  )
}
