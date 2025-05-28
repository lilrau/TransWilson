import type { Metadata } from "next"
import { CaixaContainer } from "@/components/caixa/caixa-container"

export const metadata: Metadata = {
  title: "Caixa - Sistema de Fretagem",
  description: "Visualize o fluxo de caixa por veículo e geral do sistema",
}

export default function CaixaPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Caixa</h1>
        <p className="text-muted-foreground">
          Visualize o fluxo de caixa por veículo e geral do sistema.
        </p>
      </div>

      <CaixaContainer />
    </div>
  )
} 