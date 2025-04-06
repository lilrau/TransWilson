import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FretesTable } from "@/components/fretes/fretes-table"
import { Plus } from "lucide-react"

export const metadata: Metadata = {
  title: "Fretes - Sistema de Fretagem",
  description: "Gerenciamento de fretes no sistema",
}

export default function FretesPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fretes</h1>
          <p className="text-muted-foreground">Gerencie os fretes do sistema.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/movimentos/criar-frete">
            <Plus className="mr-2 h-4 w-4" /> Criar Frete
          </Link>
        </Button>
      </div>

      <FretesTable />
    </div>
  )
}