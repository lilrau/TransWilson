import type { Metadata } from "next"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FretesTable } from "@/components/fretes/fretes-table"

export const metadata: Metadata = {
  title: "Fretes - Sistema de Fretagem",
  description: "Gerenciamento de fretes no sistema de fretagem",
}

export default function FretesPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fretes</h1>
          <p className="text-muted-foreground">Gerencie os fretes cadastrados no sistema.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/cadastros/fretes/novo">
            <Plus className="mr-2 h-4 w-4" /> Novo Frete
          </Link>
        </Button>
      </div>

      <FretesTable />
    </div>
  )
}
