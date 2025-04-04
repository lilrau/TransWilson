import type { Metadata } from "next"
import { MotoristasEditForm } from "@/components/motoristas/motoristas-edit-form"

export const metadata: Metadata = {
  title: "Editar Motorista - Sistema de Fretagem",
  description: "Edição de motorista no sistema de fretagem",
}

export default function EditarMotoristaPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar Motorista</h1>
        <p className="text-muted-foreground">Atualize os dados do motorista.</p>
      </div>

      <MotoristasEditForm id={params.id} />
    </div>
  )
}

