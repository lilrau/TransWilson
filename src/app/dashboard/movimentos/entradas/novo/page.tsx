import type { Metadata } from "next"
import { EntradaForm } from "@/components/entradas-saidas/entrada-form"

export const metadata: Metadata = {
  title: "Nova Entrada - Sistema de Fretagem",
  description: "Registro de nova entrada financeira no sistema de fretagem",
}

export default function NovaEntradaPage({ searchParams }: { searchParams: { freteId?: string } }) {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nova Entrada</h1>
        <p className="text-muted-foreground">Registre uma nova entrada financeira no sistema.</p>
      </div>

      <EntradaForm freteId={searchParams.freteId} />
    </div>
  )
}
