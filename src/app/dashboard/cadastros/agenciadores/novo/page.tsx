import type { Metadata } from "next"
import { AgenciadoresForm } from "@/components/agenciadores/agenciadores-form"

export const metadata: Metadata = {
  title: "Novo Agenciador - Sistema de Fretagem",
  description: "Cadastro de novo agenciador no sistema de fretagem",
}

export default function NovoAgenciadorPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Novo Agenciador</h1>
        <p className="text-muted-foreground">Cadastre um novo agenciador no sistema.</p>
      </div>

      <AgenciadoresForm />
    </div>
  )
}
