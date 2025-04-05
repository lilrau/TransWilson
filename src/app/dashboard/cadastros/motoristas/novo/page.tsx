import type { Metadata } from "next"
import { MotoristasForm } from "@/components/motoristas/motoristas-form"

export const metadata: Metadata = {
  title: "Novo Motorista - Sistema de Fretagem",
  description: "Cadastro de novo motorista no sistema de fretagem",
}

export default function NovoMotoristaPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Novo Motorista</h1>
        <p className="text-muted-foreground">Preencha os dados para cadastrar um novo motorista.</p>
      </div>

      <MotoristasForm />
    </div>
  )
}
