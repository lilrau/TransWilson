import type { Metadata } from "next"
import { FretesForm } from "@/components/fretes/fretes-form"

export const metadata: Metadata = {
  title: "Criar Frete - Sistema de Fretagem",
  description: "Cadastro de novo frete no sistema de fretagem",
}

export default function CriarFretePage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Criar Frete</h1>
        <p className="text-muted-foreground">Preencha os dados para criar um novo frete.</p>
      </div>

      <FretesForm />
    </div>
  )
}