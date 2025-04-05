import type { Metadata } from "next"
import { UsersEditForm } from "@/components/users/users-edit-form"

export const metadata: Metadata = {
  title: "Editar Usuário - Sistema de Fretagem",
  description: "Edição de usuário no sistema de fretagem",
}

interface PageParams {
  params: {
    id: string
  }
}

export default function EditarUsuarioPage({ params }: PageParams) {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar Usuário</h1>
        <p className="text-muted-foreground">Atualize os dados do usuário.</p>
      </div>

      <UsersEditForm id={params.id} />
    </div>
  )
}
