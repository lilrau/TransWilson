import type { Metadata } from "next"
import { DespesasForm } from "@/components/despesas/despesas-form"

export const metadata: Metadata = {
  title: "Editar Despesa - Sistema de Fretagem",
  description: "Edição de despesa no sistema de fretagem",
}

interface EditarDespesaPageProps {
  params: {
    id: string
  }
}

export default async function EditarDespesaPage({ params }: EditarDespesaPageProps) {
  const { id } = await params

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar Despesa</h1>
        <p className="text-muted-foreground">Edite os dados da despesa no sistema.</p>
      </div>

      <DespesasForm id={id} />
    </div>
  )
}
