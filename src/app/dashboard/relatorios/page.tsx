import type { Metadata } from "next"
import { RelatoriosContainer } from "@/components/relatorios/relatorios-container"

export const metadata: Metadata = {
  title: "Relatórios - Sistema de Fretagem",
  description: "Visualize e exporte relatórios do sistema de fretagem",
}

export default function RelatoriosPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground">
          Visualize e exporte relatórios detalhados do sistema de fretagem
        </p>
      </div>

      <RelatoriosContainer />
    </div>
  )
}
