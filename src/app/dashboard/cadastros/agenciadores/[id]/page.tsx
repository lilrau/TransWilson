import type { Metadata } from "next"
import { AgenciadoresForm } from "@/components/agenciadores/agenciadores-form"

export const metadata: Metadata = {
  title: "Editar Agenciador - Sistema de Fretagem",
  description: "Edição de agenciador no sistema de fretagem",
}

interface PageParams {
  params: {
    id: string
  }
}

export default async function EditarAgenciadorPage({ params }: PageParams) {
  const { id } = await params
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar Agenciador</h1>
        <p className="text-muted-foreground">Atualize os dados do agenciador.</p>
      </div>

      <AgenciadoresForm id={id} />
    </div>
  )
}