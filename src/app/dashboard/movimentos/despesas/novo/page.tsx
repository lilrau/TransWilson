import type { Metadata } from "next"
import { DespesasForm } from "@/components/despesas/despesas-form"

export const metadata: Metadata = {
  title: "Nova Despesa - Sistema de Fretagem",
  description: "Registro de nova despesa financeira no sistema de fretagem",
}

export default async function NovaDespesaPage({
  searchParams,
}: {
  searchParams: { freteId?: string }
}) {
  const freteId = await Promise.resolve(searchParams.freteId)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nova Despesa</h1>
          <p className="text-muted-foreground">Registre uma nova despesa financeira no sistema.</p>
        </div>
      </div>

      <DespesasForm freteId={freteId} />
    </div>
  )
}
