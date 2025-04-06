import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { UsersTable } from "@/components/users/users-table"

export const metadata: Metadata = {
  title: "Usuários - Sistema de Fretagem",
  description: "Gerenciamento de usuários do sistema de fretagem",
}

export default function UsersPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground">Gerencie os usuários cadastrados no sistema.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/cadastros/users/novo">
            <Plus className="mr-2 h-4 w-4" /> Novo Usuário
          </Link>
        </Button>
      </div>

      <UsersTable />
    </div>
  )
}
