import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AgenciadoresTable } from "@/components/agenciadores/agenciadores-table"

export const metadata: Metadata = {
  title: "Agenciadores - Sistema de Fretagem",
  description: "Gerenciamento de agenciadores no sistema de fretagem",
}

export default function AgenciadoresPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agenciadores</h1>
          <p className="text-muted-foreground">Gerencie os agenciadores cadastrados no sistema.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/cadastros/agenciadores/novo">Cadastrar Agenciador</Link>
        </Button>
      </div>

      <AgenciadoresTable />
    </div>
  )
}