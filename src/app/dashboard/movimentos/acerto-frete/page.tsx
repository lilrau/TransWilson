import type { Metadata } from "next"
import { AcertoFreteComponent } from "@/components/fretes/acerto-frete"

export const metadata: Metadata = {
  title: "Acerto de Frete - Sistema de Fretagem",
  description: "Gerenciamento de acertos de fretes no sistema",
}

export default function AcertoFretePage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Acerto de Frete</h1>
        <p className="text-muted-foreground">Visualize e gerencie os acertos financeiros dos fretes.</p>
      </div>

      <AcertoFreteComponent />
    </div>
  )
} 