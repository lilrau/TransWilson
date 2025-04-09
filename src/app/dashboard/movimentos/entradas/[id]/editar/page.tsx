import type { Metadata } from "next"
import { EntradaEditForm } from "@/components/entradas-saidas/entrada-edit-form"

export const metadata: Metadata = {
  title: "Editar Entrada - Sistema de Fretagem",
  description: "Edição de entrada financeira no sistema de fretagem",
}

interface PageParams {
  params: {
    id: string
  }
}

export default function EditarEntradaPage({ params }: PageParams) {
  const { id } = params

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar Entrada</h1>
        <p className="text-muted-foreground">Atualize os dados da entrada financeira.</p>
      </div>

      <EntradaEditForm id={id} />
    </div>
  )
}