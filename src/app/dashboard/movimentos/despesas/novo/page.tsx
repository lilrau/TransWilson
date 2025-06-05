"use client"
import { DespesasForm } from "@/components/despesas/despesas-form"

export default function NovaDespesaPage({ params }: { params: { freteId: string } }) {
  const despesa_frete_id = Number(params.freteId)
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nova Despesa</h1>
        <p className="text-muted-foreground">Cadastre uma nova despesa no sistema.</p>
      </div>
      <DespesasForm despesa_frete_id={despesa_frete_id} />
    </div>
  )
}
