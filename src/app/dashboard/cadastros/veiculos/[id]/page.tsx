// In your [id]/page.tsx file
import type { Metadata } from "next"
import { VeiculosForm } from "@/components/veiculos/veiculos-form"

export const metadata: Metadata = {
  title: "Editar Veículo - Sistema de Fretagem",
  description: "Edição de veículo no sistema de fretagem",
}

interface PageParams {
  params: {
    id: string
  }
}

export default async function EditarVeiculoPage({ params }: PageParams) {
  const { id } = await params
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar Veículo</h1>
        <p className="text-muted-foreground">Atualize os dados do veículo.</p>
      </div>

      <VeiculosForm id={id} />
    </div>
  )
}
