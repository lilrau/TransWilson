"use client"
import { DespesasForm } from "@/components/despesas/despesas-form"
import { useSearchParams } from "next/navigation"

export default function NovaDespesaPage() {
  const searchParams = useSearchParams()
  const freteIdParam = searchParams.get("freteId")
  const despesa_frete_id = freteIdParam ? Number(freteIdParam) : undefined
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
