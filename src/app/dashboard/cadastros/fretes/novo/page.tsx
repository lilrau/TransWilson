import type { Metadata } from "next"
import { FretesForm } from "@/components/fretes/fretes-form"

export const metadata: Metadata = {
  title: "Novo Frete - Sistema de Fretagem",
  description: "Cadastro de novo frete no sistema de fretagem",
}

export default function NovoFretePage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Novo Frete</h1>
        <p className="text-muted-foreground">Preencha os dados para cadastrar um novo frete.</p>
      </div>

      <FretesForm />
    </div>
  )
}
