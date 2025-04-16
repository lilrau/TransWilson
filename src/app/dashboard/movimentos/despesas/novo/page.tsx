import type { Metadata } from "next"
import { DespesasForm } from "@/components/despesas/despesas-form"

export const metadata: Metadata = {
  title: "Nova Despesa - Sistema de Fretagem",
  description: "Cadastro de nova despesa no sistema de fretagem",
}

export default function NovaDespesaPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nova Despesa</h1>
        <p className="text-muted-foreground">Cadastre uma nova despesa no sistema.</p>
      </div>

      <DespesasForm />
    </div>
  )
}
